// src/routes/user.routes.ts
import { Router, RequestHandler } from "express";
import { getProfile, updateProfile, getAllUsers } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", requireAuth, getProfile as RequestHandler);
router.patch("/me", requireAuth, updateProfile as RequestHandler);
router.get('/all', requireAuth, getAllUsers as RequestHandler);

export default router;