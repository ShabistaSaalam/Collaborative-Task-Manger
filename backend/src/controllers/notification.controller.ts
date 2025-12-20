import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as notificationService from "../services/notification.service";

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getUserNotifications(userId);
    return res.json(notifications);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response) {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user?.id;

    if (!notificationId || !userId) {
      return res.status(400).json({
        message: "Notification ID or user not found",
      });
    }

    await notificationService.markAsRead(notificationId, userId);

    return res.json({ message: "Notification marked as read" });
  } catch (err: any) {
    return res.status(403).json({ message: err.message });
  }
}
