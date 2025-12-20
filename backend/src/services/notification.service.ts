import prisma from "../../prisma/client";

export async function getUserNotifications(userId: string) {
  // Get last 15 notifications only
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  // Delete older notifications (keep only last 15)
  const notificationIds = notifications.map(n => n.id);
  await prisma.notification.deleteMany({
    where: {
      userId,
      id: { notIn: notificationIds },
    },
  });

  return notifications;
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("Not authorized");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}