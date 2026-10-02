export default async function handler(req, res) {
  const railway = process.env.PRIMARY_BACKEND_URL || process.env.BACKUP_BACKEND_URL;
  const render = process.env.BACKUP_BACKEND_URL || process.env.PRIMARY_BACKEND_URL;

  if (!railway) {
    return res.status(500).json({
      message: "Backend URLs are not configured"
    });
  }

  const path = "/api/auth/firebase/me";

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
    const url =
      `${baseUrl.replace(/\/$/, "")}${path}`;

    console.log(`Calling backend: ${url}`);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(url, {
        method: req.method,
        headers,
        redirect: "manual",
        signal: controller.signal
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

  try {
    let response =
      await callBackend(railway, 8000);

    if (![502, 503, 504].includes(response.status)) {
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
      "Railway request failed:",
      error
    );

    try {

      console.log(
        "Trying Render backup..."
      );

      const response =
        await callBackend(render, 50000);

      return await sendResponse(response);

    } catch (backupError) {

      console.error(
        "Both Railway and Render failed:",
        backupError
      );

      return res.status(503).json({
        message:
          "Both backend servers are currently unavailable"
      });
    }
  }
}
