import { Request, Response } from "express";
import { ZodError } from "zod";
import { createTaskSchema, updateTaskSchema } from "../dtos/task.dto";
import * as taskService from "../services/task.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { auditLogger } from "../utils/auditLogger";

/**
 * Helper to build audit-safe user object
 */
function auditUser(req: AuthRequest) {
  return {
    id: req.user!.id,
    email: req.user!.email,
  };
}

// 🔹 CREATE TASK
export async function createTask(req: AuthRequest, res: Response) {
  try {
    const parsed = createTaskSchema.parse(req.body);

    const validated = {
      title: parsed.title,
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      status: parsed.status,
      ...(parsed.description !== undefined && {
        description: parsed.description,
      }),
      ...(parsed.assignedToId !== undefined && {
        assignedToId: parsed.assignedToId,
      }),
    };

    const task = await taskService.createTask(req.user!.id, validated);

    // ✅ AUDIT LOG
    auditLogger.logTaskCreated(
      auditUser(req),
      {
        id: task.id,
        title: task.title,
      }
    );

    return res.status(201).json({ task });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

// 🔹 GET ALL TASKS
export async function getAllTasks(req: AuthRequest, res: Response) {
  try {
    const tasks = await taskService.getAllTasks();
    return res.json({ tasks });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// 🔹 GET TASKS ASSIGNED TO ME
export async function getMyAssignedTasks(req: AuthRequest, res: Response) {
  try {
    const tasks = await taskService.getTasksAssignedToUser(req.user!.id);
    return res.json({ tasks });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// 🔹 GET TASKS CREATED BY ME
export async function getMyCreatedTasks(req: AuthRequest, res: Response) {
  try {
    const tasks = await taskService.getTasksCreatedByUser(req.user!.id);
    return res.json({ tasks });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// 🔹 UPDATE TASK
export async function updateTask(
  req: AuthRequest & Request<{ id: string }>,
  res: Response
) {
  try {
    const parsed = updateTaskSchema.parse(req.body);

    // Build validated object without using 'any'
    const validated: {
      title?: string;
      description?: string;
      dueDate?: string;
      priority?: "Low" | "Medium" | "High" | "Urgent";
      status?: "ToDo" | "InProgress" | "Review" | "Completed";
      assignedToId?: string;
    } = {
      ...(parsed.title !== undefined && { title: parsed.title }),
      ...(parsed.description !== undefined && { description: parsed.description }),
      ...(parsed.dueDate !== undefined && { dueDate: parsed.dueDate }),
      ...(parsed.priority !== undefined && { priority: parsed.priority }),
      ...(parsed.status !== undefined && { status: parsed.status }),
      ...(parsed.assignedToId !== undefined && { assignedToId: parsed.assignedToId }),
    };

    // Get old task before update
    const oldTask = await taskService.getTaskById(req.params.id);

    const task = await taskService.updateTask(
      req.params.id,
      req.user!.id,
      validated
    );

    // Track changes
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    if (validated.title && validated.title !== oldTask.title) {
      changes.push({
        field: "title",
        oldValue: oldTask.title,
        newValue: validated.title,
      });
    }

    if (
      validated.description !== undefined &&
      validated.description !== oldTask.description
    ) {
      changes.push({
        field: "description",
        oldValue: oldTask.description ?? "none",
        newValue: validated.description ?? "none",
      });
    }

    if (validated.status && validated.status !== oldTask.status) {
      changes.push({
        field: "status",
        oldValue: oldTask.status,
        newValue: validated.status,
      });
    }

    if (validated.priority && validated.priority !== oldTask.priority) {
      changes.push({
        field: "priority",
        oldValue: oldTask.priority,
        newValue: validated.priority,
      });
    }

    if (
      validated.dueDate &&
      new Date(validated.dueDate).toISOString() !==
        new Date(oldTask.dueDate).toISOString()
    ) {
      changes.push({
        field: "dueDate",
        oldValue: oldTask.dueDate,
        newValue: validated.dueDate,
      });
    }

    if (
      validated.assignedToId !== undefined &&
      validated.assignedToId !== oldTask.assignedToId
    ) {
      changes.push({
        field: "assignedToId",
        oldValue: oldTask.assignedToId ?? "unassigned",
        newValue: validated.assignedToId ?? "unassigned",
      });
    }

    // Audit only if changes exist
    if (changes.length > 0) {
      auditLogger.logTaskUpdated(
        auditUser(req),
        {
          id: task.id,
          title: task.title,
        },
        changes
      );
    }

    return res.json({ task });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.issues });
    }
    return res.status(403).json({ message: err.message });
  }
}

// 🔹 DELETE TASK
export async function deleteTask(
  req: AuthRequest & Request<{ id: string }>,
  res: Response
) {
  try {
    const task = await taskService.getTaskById(req.params.id);

    await taskService.deleteTask(req.params.id, req.user!.id);

    auditLogger.logTaskDeleted(
      auditUser(req),
      {
        id: task.id,
        title: task.title,
      }
    );

    return res.json({ message: "Task deleted successfully" });
  } catch (err: any) {
    return res.status(403).json({ message: err.message });
  }
}

// 🔹 FILTERED TASKS
export async function getFilteredTasks(req: AuthRequest, res: Response) {
  try {
    const { status, priority, sort } = req.query;

    const tasks = await taskService.getTasksWithFilters({
      status: status as any,
      priority: priority as any,
      sort: (sort as "asc" | "desc") || "asc",
    });

    return res.json({ tasks });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}