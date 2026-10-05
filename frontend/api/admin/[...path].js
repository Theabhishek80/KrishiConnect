export const config = {
  maxDuration: 60,

  // IMPORTANT:
  // Keep multipart/form-data as a raw request body.
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const primary = process.env.PRIMARY_BACKEND_URL;
  const backup = process.env.BACKUP_BACKEND_URL;

  const backends = [primary, backup]
    .filter(Boolean)
    .map(url => url.replace(/\/+$/, ""));

  if (!backends.length) {
    return res.status(500).json({
      message: "No backend URL is configured.",
    });
  }

  // Keep the complete original /api/... path.
  const path = req.url || "/api/status";

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    // Let fetch/Vercel generate these correctly.
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
      Array.isArray(value)
        ? value.join(",")
        : value
    );
  }

  let body;

  // Read the raw request body.
  if (!["GET", "HEAD"].includes(req.method)) {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    }

    body = Buffer.concat(chunks);
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

  const safeMethod = [
    "GET",
    "HEAD",
    "OPTIONS",
  ].includes(req.method);

  /*
   * Only fail over POST requests where retrying is safe.
   *
   * IMPORTANT:
   * Do NOT automatically retry image uploads.
   * Otherwise an upload could reach the primary,
   * succeed in ImageKit, and then be uploaded again
   * to the backup after a timeout.
   */
  const retryableAuthWrite =
    req.method === "POST" &&
    (
      path.startsWith("/api/auth/login") ||
      path.startsWith("/api/auth/refresh") ||
      path.startsWith("/api/auth/firebase/onboard")
    );

  const canFailover =
    safeMethod || retryableAuthWrite;

  for (let i = 0; i < backends.length; i++) {
    const backend = backends[i];

    try {
      const timeoutMs =
        i === 0 ? 25000 : 50000;

      const response = await callBackend(
        backend,
        timeoutMs
      );

      if (
        i === 0 &&
        canFailover &&
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

      if (
        !canFailover ||
        i === backends.length - 1
      ) {
        return res.status(503).json({
          message:
            i === 0
              ? "Primary backend is unavailable."
              : "All configured backend servers are unavailable.",
        });
      }
    }
  }

  return res.status(503).json({
    message: "Backend servers are unavailable.",
  });
}
