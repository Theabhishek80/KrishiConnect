export default async function handler(req, res) {
  const railway = process.env.PRIMARY_BACKEND_URL;
  const render = process.env.BACKUP_BACKEND_URL;

  if (!railway || !render) {
    return res.status(500).json({
      message: "Backend URLs are not configured"
    });
  }

  const path = req.url;

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
    const url =
      `${baseUrl.replace(/\/$/, "")}${path}`;

    console.log(
      `Calling cart backend: ${url}`
    );

    const controller =
      new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(url, {
        method: req.method,
        headers,
        body,
        redirect: "manual",
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function sendResponse(response) {
    response.headers.forEach(
      (value, key) => {
        const lower = key.toLowerCase();

        if (
          lower !== "content-length" &&
          lower !== "content-encoding" &&
          lower !== "transfer-encoding" &&
          lower !== "connection"
        ) {
          res.setHeader(key, value);
        }
      }
    );

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    return res
      .status(response.status)
      .send(buffer);
  }

  try {
    let response =
      await callBackend(railway, 8000);

    if (
      ![502, 503, 504].includes(
        response.status
      )
    ) {
      return await sendResponse(response);
    }

    console.log(
      `Railway returned ${response.status}. Trying Render...`
    );

    response =
      await callBackend(render, 50000);

    return await sendResponse(response);

  } catch (error) {
    console.error(
      "Railway cart request failed:",
      error
    );

    try {
      const response =
        await callBackend(render, 50000);

      return await sendResponse(response);

    } catch (backupError) {
      console.error(
        "Both cart backends failed:",
        backupError
      );

      return res.status(503).json({
        message:
          "Both backend servers are currently unavailable"
      });
    }
  }
}
