export default async function handler(req, res) {
  const railway = process.env.PRIMARY_BACKEND_URL;
  const render = process.env.BACKUP_BACKEND_URL;

  if (!railway || !render) {
    return res.status(500).json({
      message: "Backend URLs are not configured"
    });
  }

  const path = req.url.replace(/^\/api/, "");

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    if (
      lower === "host" ||
      lower === "content-length" ||
      lower === "connection"
    ) {
      continue;
    }

    headers.set(
      key,
      Array.isArray(value) ? value.join(",") : value
    );
  }

  let body;

  if (!["GET", "HEAD"].includes(req.method)) {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      );
    }

    body = Buffer.concat(chunks);
  }

  async function callBackend(baseUrl) {
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;

    return fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: "manual"
    });
  }

  async function sendResponse(response) {
    response.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== "content-encoding" &&
        key.toLowerCase() !== "content-length"
      ) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.status(response.status).send(buffer);
  }

  try {
    let response = await callBackend(railway);

    if (![502, 503, 504].includes(response.status)) {
      return await sendResponse(response);
    }

    console.log(
      `Railway returned ${response.status}. Trying Render...`
    );

    response = await callBackend(render);

    return await sendResponse(response);
  } catch (error) {
    console.error(
      "Railway unavailable. Trying Render...",
      error
    );

    try {
      const response = await callBackend(render);

      return await sendResponse(response);
    } catch (backupError) {
      console.error(
        "Both Railway and Render failed",
        backupError
      );

      return res.status(503).json({
        message: "Both backend servers are currently unavailable"
      });
    }
  }
}
