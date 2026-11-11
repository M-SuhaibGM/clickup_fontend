import { api } from './api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/auth';

export function startGoogleLogin() {
  // Same-origin proxy by default, so the refresh cookie is set on the frontend's domain.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || `${apiUrl}/auth`;
  window.location.href = `${authUrl}/google`;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>('/users/me');
    useAuthStore.getState().setUser(data.user);
    return data.user;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    useAuthStore.getState().logout();
  }
}