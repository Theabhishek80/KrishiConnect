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
    .map((url) => url.replace(/\/+$/, ""));

  if (!backends.length) {
    return res.status(500).json({
      message:
        "No backend URL is configured. Set PRIMARY_BACKEND_URL.",
    });
  }

  /*
   * vercel.json sends:
   *
   * /api/products/farmer
   *
   * to:
   *
   * /api/gateway?path=products/farmer
   *
   * We reconstruct the ORIGINAL Spring Boot API path here.
   */
  let requestedPath = req.query?.path;

  if (Array.isArray(requestedPath)) {
    requestedPath = requestedPath.join("/");
  }

  if (typeof requestedPath !== "string") {
    requestedPath = "";
  }

  requestedPath = requestedPath.trim();

  let path;

  if (requestedPath) {
    requestedPath = requestedPath.replace(/^\/+/, "");

    path = `/api/${requestedPath}`;
  } else {
    /*
     * Fallback for direct calls to the gateway.
     */
    const originalUrl =
      req.headers["x-original-url"] ||
      req.headers["x-forwarded-uri"];

    if (typeof originalUrl === "string" && originalUrl.startsWith("/")) {
      path = originalUrl;
    } else {
      path = "/api/status";
    }
  }

  /*
   * Preserve normal query parameters while removing the internal
   * ?path= parameter used by the Vercel rewrite.
   */
  const urlObject = new URL(
    req.url || "/",
    "https://kisan-direct-gateway.local"
  );

  urlObject.searchParams.delete("path");

  const queryString = urlObject.searchParams.toString();

  if (queryString) {
    path = `${path}?${queryString}`;
  }

  console.log("Gateway request:", {
    method: req.method,
    path,
  });

  /*
   * Copy request headers.
   */
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
   * Read request body.
   *
   * Important for:
   * - product creation
   * - image uploads
   * - JSON POST requests
   */
  let body;

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
      const targetUrl = `${baseUrl}${path}`;

      console.log("Calling backend:", targetUrl);

      return await fetch(targetUrl, {
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

  /*
   * Only safe requests can fail over automatically.
   *
   * Product creation/image upload MUST NOT be replayed,
   * because that could create duplicate products/uploads.
   */
  const safeMethod = [
    "GET",
    "HEAD",
    "OPTIONS",
  ].includes(req.method);

  const retryableAuthWrite =
    req.method === "POST" &&
    (
      path.startsWith("/api/auth/login") ||
      path.startsWith("/api/auth/refresh") ||
      path.startsWith("/api/auth/firebase/onboard")
    );

  const canFailover =
    safeMethod || retryableAuthWrite;

  for (
    let i = 0;
    i < backends.length;
    i++
  ) {
    const backend = backends[i];

    try {
      const timeoutMs =
        i === 0
          ? 25000
          : 50000;

      const response =
        await callBackend(
          backend,
          timeoutMs
        );

      /*
       * For safe requests, try backup when primary
       * is unavailable.
       */
      if (
        i === 0 &&
        canFailover &&
        [502, 503, 504].includes(
          response.status
        ) &&
        backends.length > 1
      ) {
        continue;
      }

      return await sendResponse(
        response
      );
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
    message:
      "Backend servers are unavailable.",
  });
}

  return res.status(503).json({
    message: "Backend servers are unavailable."
  });
}
