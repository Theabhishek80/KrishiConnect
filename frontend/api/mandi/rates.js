export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const primary =
    process.env.PRIMARY_BACKEND_URL ||
    "https://krishiconnect-production-a757.up.railway.app";

  const backup =
    process.env.BACKUP_BACKEND_URL ||
    "";

  const query =
    req.url.includes("?")
      ? req.url.substring(req.url.indexOf("?"))
      : "";

  const backends = [
    primary,
    backup
  ].filter(Boolean);

  let lastError = null;

  for (const backend of backends) {
    try {
      const base = backend.replace(/\/+$/, "");

      const target =
        `${base}/api/mandi/rates${query}`;

      /*
       * Mandi rates are PUBLIC.
       *
       * Do NOT forward the browser's Firebase
       * Authorization header to this endpoint.
       */
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
        data = {
          error:
            text ||
            `Backend returned HTTP ${response.status}.`,
        };
      }

      /*
       * Try backup only for backend/server failures.
       */
      if (response.status >= 500) {
        lastError = data;
        continue;
      }

      return res.status(response.status).json(data);

    } catch (error) {
      console.error(
        "Mandi proxy error:",
        error
      );

      lastError = {
        error:
          error?.message ||
          "Could not connect to backend.",
      };
    }
  }

  return res.status(502).json({
    error:
      lastError?.error ||
      "Mandi backend is currently unavailable.",
  });
}
