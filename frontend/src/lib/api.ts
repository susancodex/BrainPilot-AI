import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

// VITE_API_URL = the Render backend origin, e.g. "https://brainpilot-api.onrender.com"
// In dev (no env var): empty string → relative URLs handled by the Vite proxy (/api → localhost:8000)
const _apiOrigin = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const api = axios.create({
  // Dev:  baseURL="/api/v1"  → relative, Vite proxy forwards to Django on localhost:8000
  // Prod: baseURL="https://brainpilot-api.onrender.com"  → absolute calls to Render
  baseURL: _apiOrigin || "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap the standard backend envelope: { success, message, data: X } → X
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Use a bare axios instance (no interceptors) to avoid re-triggering this handler.
        // _apiOrigin is "" in dev (Vite proxy resolves the relative path) and the full
        // Render origin in production, so the URL is always correct in both environments.
        const { data } = await axios.post(
          `${_apiOrigin}/api/v1/token/refresh/`,
          { refresh },
        );
        setTokens(data.access, refresh);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        redirectToLogin();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  const onAuthPage = ["/", "/login", "/register"].some((p) => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    return path === p || path.endsWith(p);
  });
  if (!onAuthPage) {
    window.dispatchEvent(new CustomEvent("brainpilot:auth-expired"));
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export default api;
