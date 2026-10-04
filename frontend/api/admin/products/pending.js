export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
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

  const path = "/api/admin/products/pending";

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

  async function callBackend(baseUrl, timeoutMs) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(`${baseUrl}${path}`, {
        method: req.method,
        headers,
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

    return res.status(response.status).send(buffer);
  }

  for (let i = 0; i < backends.length; i++) {
    try {
      const response = await callBackend(
        backends[i],
        i === 0 ? 25000 : 50000
      );

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
        `Backend ${i + 1} request failed:`,
        error
      );

      if (i === backends.length - 1) {
        return res.status(503).json({
          message: "All configured backend servers are unavailable.",
        });
      }
    }
  }

  return res.status(503).json({
    message: "Backend servers are unavailable.",
  });
}
