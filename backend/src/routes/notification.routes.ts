import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { getNotifications, markNotificationAsRead } from "../controllers/notification.controller";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.patch("/:id/read", requireAuth, markNotificationAsRead);

export default router;