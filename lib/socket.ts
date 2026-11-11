// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

// WebSockets can't be proxied by the Next.js rewrite, so this must be the
// public backend origin. next.config.ts injects it from BACKEND_URL (or from
// NEXT_PUBLIC_SOCKET_URL / NEXT_SOCKET_URL if you set them explicitly).
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: useAuthStore.getState().accessToken,
      },
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: useAuthStore.getState().accessToken };
    s.connect();
  }
  return s;
};
