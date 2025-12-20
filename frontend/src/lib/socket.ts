import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const initializeSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
      
      if (userId) {
        socket?.emit('join:user', userId);
        console.log('🔌 Joined user room:', userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
    });

    socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      if (userId) {
        socket?.emit('join:user', userId);
        console.log('🔌 Re-joined user room:', userId);
      }
    });

    // Remove the notifications:missed and notification listeners
    // The NotificationCenter component will handle fetching notifications

  } else if (userId) {
    socket.emit('join:user', userId);
    console.log('🔌 Joined user room:', userId);
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { initializeSocket, getSocket, disconnectSocket };