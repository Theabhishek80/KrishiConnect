import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
});

let refreshing = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kc_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("kc_refresh");
    if (!refreshToken) return Promise.reject(error);

    original._retry = true;

    try {
      refreshing ||= api.post("/auth/refresh", { refreshToken });

      const response = await refreshing;
      refreshing = null;

      localStorage.setItem("kc_access", response.data.accessToken);
      localStorage.setItem("kc_refresh", response.data.refreshToken);
      localStorage.setItem("kc_user", JSON.stringify(response.data));

      original.headers.Authorization = `Bearer ${response.data.accessToken}`;

      return api(original);
    } catch (refreshError) {
      refreshing = null;

      localStorage.removeItem("kc_access");
      localStorage.removeItem("kc_refresh");
      localStorage.removeItem("kc_user");

      return Promise.reject(refreshError);
    }
  }
);

export default api;
