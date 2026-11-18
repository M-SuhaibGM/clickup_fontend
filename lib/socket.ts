// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { refreshAccessToken } from '@/lib/api';

// WebSockets can't be proxied by the Next.js rewrite, so this must be the
// public backend origin. next.config.ts injects it from BACKEND_URL (or from
// NEXT_PUBLIC_SOCKET_URL / NEXT_SOCKET_URL if you set them explicitly).
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let authRetries = 0;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // A function, so every (re)connect sends the CURRENT access token, not the one from first connect
      auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
      withCredentials: true,
      autoConnect: false,
    });

    socket.on('connect', () => {
      authRetries = 0;
    });

    // An expired access token is rejected by the server's auth middleware, and socket.io does NOT
    // retry those on its own — refresh the token and reconnect (a few times at most).
    socket.on('connect_error', async (err) => {
      if (err.message !== 'Authentication error' || authRetries >= 3) return;
      authRetries++;
      try {
        await refreshAccessToken();
        socket?.connect();
      } catch {
        /* refresh failed — the API layer will send the user to /login */
      }
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected && !s.active) s.connect();
  return s;
};
