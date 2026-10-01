import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "/api"
});

let initialAuthCheck = null;

function waitForInitialAuth() {
  if (!initialAuthCheck) {
    initialAuthCheck = new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(
        auth,
        () => {
          unsubscribe();
          resolve();
        }
      );
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

    // IMPORTANT: check currentUser AGAIN after waiting.
    const firebaseUser = auth.currentUser;

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
