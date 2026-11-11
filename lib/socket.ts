// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

// WebSockets can't be proxied by Next.js rewrites — they need to go directly
// to the backend. Set NEXT_PUBLIC_SOCKET_URL to the public backend origin
// (e.g. https://your-backend.onrender.com) in production.
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:5000';

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
