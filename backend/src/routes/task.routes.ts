import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  createTask,
  getAllTasks,
  getMyAssignedTasks,
  getMyCreatedTasks,
  updateTask,
  deleteTask,
  getFilteredTasks
} from "../controllers/task.controller";

const router = Router();

router.post("/", requireAuth, createTask);

// READ
router.get("/", requireAuth, getAllTasks);
router.get("/me", requireAuth, getMyAssignedTasks);
router.get("/created", requireAuth, getMyCreatedTasks);
router.patch("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);
router.get("/filtered", requireAuth, getFilteredTasks);

export default router;
