export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method Not Allowed",
    });
  }

  const primary = process.env.PRIMARY_BACKEND_URL;
  const backup = process.env.BACKUP_BACKEND_URL;

  const backends = [primary, backup]
    .filter(Boolean)
    .map((url) => url.replace(/\/+$/, ""));

  if (!backends.length) {
    return res.status(500).json({
      message: "No backend URL is configured.",
    });
  }

  const path = "/api/ai/chat";

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    if (
      lower === "host" ||
      lower === "content-length" ||
      lower === "connection" ||
      lower === "origin"
    ) {
      continue;
    }

    headers.set(
      key,
      Array.isArray(value) ? value.join(",") : value
    );
  }

  let body;

  try {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    }

    body = Buffer.concat(chunks);
  } catch (error) {
    return res.status(400).json({
      message: "Could not read request body.",
    });
  }

  async function callBackend(baseUrl, timeoutMs) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers,
        body,
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function sendResponse(response) {
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();

      if (
        lower !== "content-length" &&
        lower !== "content-encoding" &&
        lower !== "transfer-encoding" &&
        lower !== "connection"
      ) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    return res
      .status(response.status)
      .send(buffer);
  }

  for (let i = 0; i < backends.length; i++) {
    try {
      const response = await callBackend(
        backends[i],
        i === 0 ? 50000 : 50000
      );

      // Only fail over when the primary server itself is unavailable.
      if (
        i === 0 &&
        [502, 503, 504].includes(response.status) &&
        backends.length > 1
      ) {
        continue;
      }

      return await sendResponse(response);

    } catch (error) {
      console.error(
        `AI backend ${i + 1} failed:`,
        error
      );

      if (i === backends.length - 1) {
        return res.status(503).json({
          message:
            "AI backend servers are unavailable.",
        });
      }
    }
  }

  return res.status(503).json({
    message: "AI backend servers are unavailable.",
  });
}
