// Vercel serverless gateway: Railway (primary) -> Render (backup)
// Place at: frontend/api/[...path].js

export const config = {
  runtime: "nodejs",
  maxDuration: 60, // Render cold start can take 30-60s; default is only 10s on Hobby
};

const PRIMARY_TIMEOUT_MS = Number(process.env.PRIMARY_TIMEOUT_MS || 8000);
const BACKUP_TIMEOUT_MS = Number(process.env.BACKUP_TIMEOUT_MS || 50000);

const SKIP_REQ_HEADERS = new Set([
  "host", "content-length", "connection", "transfer-encoding",
  "origin", // server-to-server call: avoids Spring "Invalid CORS request" (e.g. Vercel preview URLs)
]);
const SKIP_RES_HEADERS = new Set([
  "content-encoding", "content-length", "transfer-encoding", "connection",
]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default async function handler(req, res) {
  const primary = process.env.PRIMARY_BACKEND_URL; // Railway
  const backup = process.env.BACKUP_BACKEND_URL;   // Render

  if (!primary || !backup) {
    return res.status(500).json({ message: "Backend URLs are not configured" });
  }

  // IMPORTANT: keep "/api" — Spring controllers are mapped as /api/products, /api/auth ...
  // (the old code stripped /api, so Railway/Render received /products and returned 404/403)
  const path = req.url;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || SKIP_REQ_HEADERS.has(key.toLowerCase())) continue;
    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }

  let body;
  if (!SAFE_METHODS.has(req.method)) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    body = Buffer.concat(chunks);
  }

  async function callBackend(baseUrl, timeoutMs) {
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    console.log(`Calling backend: ${req.method} ${url}`);
    return fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  async function sendResponse(response) {
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (SKIP_RES_HEADERS.has(lower) || lower === "set-cookie") return;
      res.setHeader(key, value);
    });
    const cookies = response.headers.getSetCookie?.() ?? [];
    if (cookies.length) res.setHeader("Set-Cookie", cookies);

    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);
  }

  try {
    let response;
    try {
      response = await callBackend(primary, PRIMARY_TIMEOUT_MS);
      if (![502, 503, 504].includes(response.status)) {
        return await sendResponse(response); // Railway OK
      }
      console.log(`Primary returned ${response.status}, trying backup...`);
    } catch (err) {
      const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
      console.error("Primary failed:", err?.message);
      // Don't replay POST/PUT/DELETE after a timeout: Railway may have processed it
      // (avoids duplicate orders). Connection errors are safe to retry.
      if (timedOut && !SAFE_METHODS.has(req.method)) {
        return res.status(504).json({ message: "Primary server timed out. Please retry." });
      }
    }

    response = await callBackend(backup, BACKUP_TIMEOUT_MS);
    return await sendResponse(response);
  } catch (error) {
    console.error("Both backend servers failed", error);
    return res.status(503).json({ message: "Both backend servers are currently unavailable" });
  }
}
          "Both backend servers are currently unavailable"
      });
    }
  }
}
