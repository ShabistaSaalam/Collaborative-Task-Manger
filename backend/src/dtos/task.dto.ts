// src/dtos/task.dto.ts
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().max(100, "Title should be at most 100 characters"),
  description: z.string().optional(),
  dueDate: z.string(), // or z.date() depending on how you parse
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  status: z.enum(["ToDo", "InProgress", "Review", "Completed"]),
  assignedToId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  status: z.enum(["ToDo", "InProgress", "Review", "Completed"]).optional(),
  assignedToId: z.string().optional(),
});
