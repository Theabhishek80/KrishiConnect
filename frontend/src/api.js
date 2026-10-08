import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import {
  clearStoredSession,
  emitAuthChange,
  getLegacyToken,
  isLegacySession
} from "./utils/auth";

/*
 * API base URL
 *  - development : "/api"  (Vite proxies it to http://localhost:8080)
 *  - production  : VITE_API_BASE_URL. "/api" is appended automatically when
 *                  it is missing, because every Spring controller lives
 *                  under /api/...
 */
function resolveBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!raw) return "/api";

  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

const BASE_URL = resolveBaseUrl();

const api = axios.create({ baseURL: BASE_URL });

// Plain client (no interceptors) used for the token-refresh call.
const raw = axios.create({ baseURL: BASE_URL });

let initialAuthCheck = null;

function waitForInitialAuth() {
  if (!initialAuthCheck) {
    initialAuthCheck = new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });
  }

  return initialAuthCheck;
}

api.interceptors.request.use(
  async config => {
    // Firebase may still be restoring the session after a page refresh.
    if (!auth.currentUser) {
      await waitForInitialAuth();
    }

    config.headers = config.headers || {};

    const firebaseUser = auth.currentUser;

    if (firebaseUser) {
      // Firebase user (email/password or Google).
      const idToken = await firebaseUser.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
    } else {
      // Admin / legacy account signed in through POST /auth/login.
      const legacy = getLegacyToken();

      if (legacy) {
        config.headers.Authorization = `Bearer ${legacy}`;
      }
    }

    return config;
  },
  error => Promise.reject(error)
);

// Legacy (backend JWT) access tokens last 30 minutes. Refresh once on 401.
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !auth.currentUser &&
      isLegacySession()
    ) {
      original._retried = true;

      const refreshToken = localStorage.getItem("kc_refresh");

      if (refreshToken) {
        try {
          const { data } = await raw.post("/auth/refresh", { refreshToken });

          localStorage.setItem("kc_access", data.accessToken);
          localStorage.setItem("kc_refresh", data.refreshToken);

          original.headers.Authorization = `Bearer ${data.accessToken}`;

          return api(original);
        } catch {
          // fall through: session is really over
        }
      }

      clearStoredSession();
      emitAuthChange();
    }

    return Promise.reject(error);
  }
);

export default api;
