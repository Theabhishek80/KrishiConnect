
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Only GET requests are supported.
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  // Render is now the only backend.
  const backend = process.env.PRIMARY_BACKEND_URL;

  if (!backend) {
    console.error("PRIMARY_BACKEND_URL is not configured.");

    return res.status(500).json({
      error: "Backend configuration is missing.",
    });
  }

  // Preserve all query parameters.
  const query = req.url.includes("?")
    ? req.url.substring(req.url.indexOf("?"))
    : "";

  const base = backend.replace(/\/+$/, "");

  const target = `${base}/api/mandi/rates${query}`;

  try {
    const response = await fetch(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const contentType =
      response.headers.get("content-type") || "";

    const text = await response.text();

    let data;

    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error: "Backend returned invalid JSON.",
        };
      }
    } else {
      const looksLikeHtml = /^\s*</.test(text);

      data = {
        error: looksLikeHtml
          ? "The Mandi server is temporarily unavailable. Please try again later."
          : text || `Backend returned HTTP ${response.status}.`,
      };
    }

    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Mandi proxy error:", error);

    return res.status(502).json({
      error: "Could not connect to the Render backend.",
    });
  }
}

