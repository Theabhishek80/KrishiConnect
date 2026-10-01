import axios from "axios";
import {
  auth,
  onAuthStateChanged
} from "./firebase";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "/api"
});

let authReadyPromise;

function waitForAuthReady() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(
        auth,
        user => {
          unsubscribe();
          resolve(user);
        }
      );
    });
  }

  return authReadyPromise;
}

api.interceptors.request.use(
  async config => {
    const firebaseUser = await waitForAuthReady();

    if (firebaseUser) {
      const idToken =
        await firebaseUser.getIdToken();

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${idToken}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

export default api;
