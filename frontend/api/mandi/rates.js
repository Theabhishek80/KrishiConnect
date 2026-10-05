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

      const headers = {
        Accept: "application/json",
      };

      /*
       * Forward Authorization if the browser sent one.
       * Mandi is public, so it is not required,
       * but forwarding it keeps the proxy consistent
       * with the rest of the application.
       */
      if (req.headers.authorization) {
        headers.Authorization =
          req.headers.authorization;
      }

      const response = await fetch(target, {
        method: "GET",
        headers,
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
       * If Railway returns a server error, try the backup.
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
