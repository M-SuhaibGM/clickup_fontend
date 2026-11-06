// lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const REFRESH_URL = `${process.env.NEXT_PUBLIC_AUTH_URL ?? `${API_URL}/auth`}/refresh`;

// Endpoints where a 401 means "bad credentials / no session", never "access token expired"
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/google'];
const isAuthRoute = (url?: string) => !!url && AUTH_ROUTES.some((r) => url.includes(r));

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach the access token ─────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh: one shared request, however many calls got a 401 ─
// Only the ACCESS token is replaced. The refresh token lives in an httpOnly
// cookie and is never touched here (it is not rotated).
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    // Plain axios (not `api`) so this call can never trigger the interceptor again
    refreshPromise = axios
      .post<{ accessToken: string }>(REFRESH_URL, {}, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ── Refresh token expired/invalid → clear session and go to /login ──
let redirecting = false;

function forceLogout() {
  useAuthStore.getState().logout();
  if (typeof window === 'undefined' || redirecting) return;
  if (window.location.pathname.startsWith('/login')) return;
  redirecting = true;
  window.location.replace('/login');
}

// ── Response: on 401, refresh the access token once and retry ──
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Not an expired-access-token case → pass the error through untouched
    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      isAuthRoute(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true; // each request is retried at most once

    try {
      const newToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${newToken}`;
      // Not awaited on purpose: if the retry fails, that error goes to the caller
      // and must not be mistaken for a failed refresh by the catch below.
      return api(original);
    } catch (refreshError) {
      const status = (refreshError as AxiosError).response?.status;
      // Refresh token expired / invalid / revoked → back to login.
      // Network errors and 5xx keep the session so the user can simply retry.
      if (status === 401 || status === 403) {
        forceLogout();
      }
      return Promise.reject(refreshError);
    }
  }
);