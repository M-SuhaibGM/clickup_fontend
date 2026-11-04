import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: refresh on 401 (once), queue concurrent requests ──
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Don't try to refresh on auth endpoints
    const isAuthRoute =
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/logout') ||
      original?.url?.includes('/auth/google');

    if (error.response?.status !== 401 || original?._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Wait for the ongoing refresh, then retry with the new token
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error);
          original._retry = true;
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${token}`,
          };
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/refresh`,
        {},
        {
          withCredentials: true,
          // Add this to ensure headers are set correctly
          headers: { 'Content-Type': 'application/json' }
        }
      );

      useAuthStore.getState().setAccessToken(data.accessToken);
      processQueue(data.accessToken);

      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${data.accessToken}`,
      };
      return api(original);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      processQueue(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);