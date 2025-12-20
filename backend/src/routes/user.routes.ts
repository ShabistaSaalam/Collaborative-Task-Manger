// src/routes/user.routes.ts
import { Router } from "express";
import { getProfile, updateProfile,getAllUsers } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.patch("/me", requireAuth, updateProfile);
router.get('/all', requireAuth, getAllUsers);
export default router;
