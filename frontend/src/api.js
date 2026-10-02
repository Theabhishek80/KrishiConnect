import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 20000,
  headers: { "Content-Type": "application/json" }
});

let firebaseReady;
function waitForFirebase() {
  if (!firebaseReady) {
    firebaseReady = new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });
  }
  return firebaseReady;
}

api.interceptors.request.use(async config => {
  // Prefer the application session. Firebase is only the identity provider.
  const appToken = localStorage.getItem("kc_access");
  if (appToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${appToken}`;
    return config;
  }

  if (!auth.currentUser) await waitForFirebase();
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config?._authRetry) {
      localStorage.removeItem("kc_access");
      localStorage.removeItem("kc_refresh");
      localStorage.removeItem("kc_user");
    }
    return Promise.reject(error);
  }
);

export default api;
