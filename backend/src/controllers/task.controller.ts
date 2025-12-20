import { Request, Response } from "express";
import { ZodError } from "zod";
import { createTaskSchema, updateTaskSchema } from "../dtos/task.dto";
import * as taskService from "../services/task.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { auditLogger } from "../utils/auditLogger"; // ✅ ADD THIS

export async function createTask(req: AuthRequest, res: Response) {
  try {
    // 1️⃣ Validate request body using Zod
    const parsed = createTaskSchema.parse(req.body);

    // 2️⃣ Normalize optional fields (important for exactOptionalPropertyTypes)
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

    // 3️⃣ Call service (creatorId comes from JWT via requireAuth)
    const task = await taskService.createTask(req.user!.id, validated);

    // ✅ 4️⃣ AUDIT LOG - Task Created
    auditLogger.logTaskCreated(
      {
        id: req.user!.id,
        name: req.user!.name || 'Unknown User',
        email: req.user!.email,
      },
      {
        id: task.id,
        title: task.title,
      },
      req.ip
    );

    // 5️⃣ Send response
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
  req: Request<{ id: string }> & { user?: { id: string; email: string; name?: string } },
  res: Response
) {
  try {
    const parsed = updateTaskSchema.parse(req.body);

    // Remove undefined keys
    const validated: {
      title?: string;
      description?: string;
      dueDate?: string;
      priority?: "Low" | "Medium" | "High" | "Urgent";
      status?: "ToDo" | "InProgress" | "Review" | "Completed";
      assignedToId?: string;
    } = {};

    Object.keys(parsed).forEach((key) => {
      const value = (parsed as any)[key];
      if (value !== undefined) {
        (validated as any)[key] = value;
      }
    });

    // ✅ Get old task data BEFORE updating
    const oldTask = await taskService.getTaskById(req.params.id);

    // Update the task
    const task = await taskService.updateTask(
      req.params.id,
      req.user!.id,
      validated
    );

    // ✅ AUDIT LOG - Track what changed
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    if (validated.title && validated.title !== oldTask.title) {
      changes.push({
        field: 'title',
        oldValue: oldTask.title,
        newValue: validated.title,
      });
    }
    if (validated.description !== undefined && validated.description !== oldTask.description) {
      changes.push({
        field: 'description',
        oldValue: oldTask.description || 'none',
        newValue: validated.description || 'none',
      });
    }
    if (validated.status && validated.status !== oldTask.status) {
      changes.push({
        field: 'status',
        oldValue: oldTask.status,
        newValue: validated.status,
      });
    }
    if (validated.priority && validated.priority !== oldTask.priority) {
      changes.push({
        field: 'priority',
        oldValue: oldTask.priority,
        newValue: validated.priority,
      });
    }
    if (validated.dueDate && new Date(validated.dueDate).toISOString() !== new Date(oldTask.dueDate).toISOString()) {
      changes.push({
        field: 'dueDate',
        oldValue: oldTask.dueDate,
        newValue: validated.dueDate,
      });
    }
    if (validated.assignedToId !== undefined && validated.assignedToId !== oldTask.assignedToId) {
      changes.push({
        field: 'assignedToId',
        oldValue: oldTask.assignedToId || 'unassigned',
        newValue: validated.assignedToId || 'unassigned',
      });
    }

    // Only log if there are actual changes
    if (changes.length > 0) {
      auditLogger.logTaskUpdated(
        {
          id: req.user!.id,
          name: req.user!.name || 'Unknown User',
          email: req.user!.email,
        },
        {
          id: task.id,
          title: task.title,
        },
        changes,
        req.ip
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
  req: Request<{ id: string }> & { user?: { id: string; email: string; name?: string } },
  res: Response
) {
  try {
    // ✅ Get task data BEFORE deleting (for audit log)
    const task = await taskService.getTaskById(req.params.id);

    await taskService.deleteTask(
      req.params.id,
      req.user!.id
    );

    // ✅ AUDIT LOG - Task Deleted
    auditLogger.logTaskDeleted(
      {
        id: req.user!.id,
        name: req.user!.name || 'Unknown User',
        email: req.user!.email,
      },
      {
        id: task.id,
        title: task.title,
      },
      req.ip
    );

    return res.json({ message: "Task deleted successfully" });
  } catch (err: any) {
    return res.status(403).json({ message: err.message });
  }
}

export async function getFilteredTasks(req: AuthRequest, res: Response) {
  try {
    const { status, priority, sort } = req.query;

    const tasks = await taskService.getTasksWithFilters({
      status: status as any,
      priority: priority as any,
      sort: (sort as "asc" | "desc") || "asc",
    });

    return res.json({ tasks });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}