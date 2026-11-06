// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // FIXED: Point directly to the backend port (5000), not the proxy
    socket = io('http://localhost:5000', {
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