import { Server } from "socket.io";
import http from "http";
import prisma from "../prisma/client"; // ⬅️ ADD THIS

let io: Server;

/**
 * Initialize Socket.io
 * This should be called ONCE in server.ts
 */
export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    /**
     * Each user joins a room with their userId
     * This allows private notifications
     */
    socket.on("join:user", async (userId: string) => { // ⬅️ MAKE ASYNC
      socket.join(userId);
      console.log(`👤 User joined room: ${userId}`);
      
      // ✅ Send missed notifications when user connects
      try {
        const missedNotifications = await prisma.notification.findMany({
          where: {
            userId,
            read: false,
            createdAt: { 
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (missedNotifications.length > 0) {
          socket.emit('notifications:missed', missedNotifications);
          console.log(`📬 Sent ${missedNotifications.length} missed notifications to ${userId}`);
        }
      } catch (error) {
        console.error('Error fetching missed notifications:', error);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
}

/**
 * Get initialized Socket.io instance
 * Used inside services
 * ✅ Returns mock during tests to prevent crashes
 */
export function getIO() {
  // ✅ Return mock for tests
  if (process.env.NODE_ENV === "test") {
    return {
      emit: () => {},
      to: () => ({ emit: () => {} }),
    } as any as Server;
  }

  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}