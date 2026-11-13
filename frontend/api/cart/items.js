
export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  const backend = process.env.PRIMARY_BACKEND_URL;

  if (!backend) {
    console.error("PRIMARY_BACKEND_URL is missing.");

    return res.status(500).json({
      message: "Backend URL is not configured.",
    });
  }

  const baseUrl = backend.replace(/\/+$/, "");
  const targetUrl = `${baseUrl}/api/cart/items`;

  // Forward request headers while excluding hop-by-hop headers.
  const headers = new Headers();

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

  // Read the original request body.
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
    console.error("Cart request body error:", error);

    return res.status(400).json({
      message: "Unable to read cart request.",
    });
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 55000);

  try {
    console.log("Sending cart request to Render:", targetUrl);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      signal: controller.signal,
    });

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();

      if (
        ![
          "content-length",
          "content-encoding",
          "transfer-encoding",
          "connection",
      ].includes(lower)
      ) {
        res.setHeader(key, value);
      }
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
      message: error.name === "AbortError"
        ? "Render backend request timed out. Please try again."
        : "Unable to connect to the Render backend.",
    });

  } finally {
    clearTimeout(timeout);
  }
}

