// src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── REQUEST INTERCEPTOR — attach token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pragati_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── RESPONSE INTERCEPTOR — auto-refresh on 401 ──────────────────────
let refreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      refreshing = true;
      try {
        const refreshToken = localStorage.getItem("pragati_refresh");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem("pragati_token", data.accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("pragati_token");
        localStorage.removeItem("pragati_refresh");
        localStorage.removeItem("pragati_user");
        window.dispatchEvent(new Event("pragati:logout"));
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
