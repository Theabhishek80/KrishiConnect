
export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const allowedMethods = [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ];

  if (!allowedMethods.includes(req.method)) {
    res.setHeader("Allow", allowedMethods);

    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  // Render is the only backend.
  const backend = process.env.PRIMARY_BACKEND_URL;

  if (!backend) {
    console.error("PRIMARY_BACKEND_URL is missing.");

    return res.status(500).json({
      message: "Backend URL is not configured.",
    });
  }

  // Preserve the original API path and query parameters.
  const path = req.url;

  const targetUrl =
    `${backend.replace(/\/+$/, "")}${path}`;

  const headers = new Headers();

  // Forward authentication and content headers.
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    if (
      [
        "host",
        "content-length",
        "connection",
        "origin",
      ].includes(lower)
    ) {
      continue;
    }

    headers.set(
      key,
      Array.isArray(value) ? value.join(",") : value
    );
  }

  // Read request body for write operations.
  let body;

  if (!["GET", "HEAD"].includes(req.method)) {
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
      console.error("Request body error:", error);

      return res.status(400).json({
        message: "Unable to read request body.",
      });
    }
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 55000);

  try {
    console.log("Cart request → Render:", targetUrl);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal,
    });

    // Forward backend response headers.
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();

      if (
        [
          "content-length",
          "content-encoding",
          "transfer-encoding",
          "connection",
      ].includes(lower)
      ) {
        return;
      }

      res.setHeader(key, value);
    });

    const responseBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    return res
      .status(response.status)
      .send(responseBuffer);

  } catch (error) {
    console.error("Render cart request failed:", error);

    return res.status(503).json({
      message:
        error.name === "AbortError"
          ? "Render backend request timed out."
          : "Unable to connect to Render backend.",
    });

  } finally {
    clearTimeout(timeout);
  }
}

