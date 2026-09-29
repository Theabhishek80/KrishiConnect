import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080/api"
});

api.interceptors.request.use(
  async config => {

    const firebaseUser = auth.currentUser;

    if (firebaseUser) {

      const idToken =
        await firebaseUser.getIdToken();

      config.headers.Authorization =
        `Bearer ${idToken}`;
    }

    return config;
  },

  error => Promise.reject(error)
);

export default api;
