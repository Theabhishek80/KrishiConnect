export const config = {
  maxDuration: 60,
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

  /*
   * Vercel invokes this function for:
   *
   * /api/admin/...
   *
   * req.url already contains the complete path.
   */
  const path = req.url || "/api/admin";

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
      Array.isArray(value)
        ? value.join(",")
        : value
    );
  }

  /*
   * POST/PUT may contain JSON or multipart data.
   *
   * PATCH/DELETE in our admin API don't need a request body,
   * so we leave their body untouched.
   */
  let body;

  if (req.method === "POST" || req.method === "PUT") {
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

    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const options = {
        method: req.method,
        headers,
        redirect: "manual",
        signal: controller.signal,
      };

      if (body !== undefined) {
        options.body = body;
      }

      return await fetch(
        `${baseUrl}${path}`,
        options
      );
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

  /*
   * Only GET/HEAD/OPTIONS are allowed to fail over.
   *
   * NEVER replay DELETE/PATCH/POST business mutations
   * on the backup server.
   */
  const safeMethod = [
    "GET",
    "HEAD",
    "OPTIONS",
  ].includes(req.method);

  for (let i = 0; i < backends.length; i++) {
    try {
      const timeoutMs =
        i === 0 ? 25000 : 50000;

      const response = await callBackend(
        backends[i],
        timeoutMs
      );

      /*
       * Primary failed with a gateway/server-unavailable
       * response → GET can try Render.
       */
      if (
        i === 0 &&
        safeMethod &&
        [502, 503, 504].includes(response.status) &&
        backends.length > 1
      ) {
        continue;
      }

      return await sendResponse(response);

    } catch (error) {
      console.error(
        `Admin backend ${i + 1} request failed:`,
        error
      );

      /*
       * PATCH/DELETE/POST must NOT be replayed.
       */
      if (
        !safeMethod ||
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
