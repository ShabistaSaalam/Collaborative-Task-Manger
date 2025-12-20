import prisma from "../../prisma/client";
import { Prisma } from "@prisma/client";
import { getIO } from "../socket";

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "ToDo" | "InProgress" | "Review" | "Completed";
  assignedToId?: string;
};

/**
 * 🔔 Helper: Save notification to DB and emit via socket
 */
async function createAndEmitNotification(
  userId: string,
  type: "TaskAssigned" | "TaskUpdated" | "TaskCompleted" | "TaskDeleted",
  title: string,
  message: string,
  data: any
) {
  try {
    // Save to database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        read: false,
      },
    });

    // Emit to socket (if user is online)
    const io = getIO();
    io.to(userId).emit("notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    console.log(`✅ Notification saved and emitted to ${userId}`);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * 🔹 CREATE TASK
 */
export async function createTask(creatorId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      dueDate: new Date(input.dueDate),
      priority: input.priority,
      status: input.status,
      creatorId,
      assignedToId: input.assignedToId ?? null,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  const io = getIO();
  io.emit("task:created", task);

  // 🔔 Notify assigned user
  if (task.assignedToId && task.assignedTo) {
    console.log("🔔 Creating notification for:", task.assignedToId);

    await createAndEmitNotification(
      task.assignedToId,
      "TaskAssigned",
      "New Task Assigned",
      `You have been assigned: "${task.title}"`,
      {
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedBy: task.creator.name,
      }
    );

    // Keep the old event for backwards compatibility
    io.to(task.assignedToId).emit("task:assigned", task);
  }

  return task;
}

/**
 * 🔹 GET ALL TASKS
 */
export async function getAllTasks() {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * 🔹 GET TASK BY ID
 */
export async function getTaskById(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}

/**
 * 🔹 TASKS ASSIGNED TO CURRENT USER
 */
export async function getTasksAssignedToUser(userId: string) {
  return prisma.task.findMany({
    where: { assignedToId: userId },
    orderBy: { dueDate: "asc" },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * 🔹 TASKS CREATED BY CURRENT USER
 */
export async function getTasksCreatedByUser(userId: string) {
  return prisma.task.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * 🔹 UPDATE TASK (CREATOR vs ASSIGNEE LOGIC ✅)
 */
export async function updateTask(
  taskId: string,
  userId: string,
  input: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: "Low" | "Medium" | "High" | "Urgent";
    status?: "ToDo" | "InProgress" | "Review" | "Completed";
    assignedToId?: string;
  }
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const isCreator = task.creatorId === userId;
  const isAssignee = task.assignedToId === userId;

  // ❌ Neither creator nor assignee
  if (!isCreator && !isAssignee) {
    throw new Error("Not authorized to update this task");
  }

  const data: Prisma.TaskUpdateInput = {};

  /**
   * 👑 CREATOR: can update everything
   */
  if (isCreator) {
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.dueDate !== undefined) data.dueDate = new Date(input.dueDate);
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) data.status = input.status;

    if (input.assignedToId !== undefined) {
      data.assignedTo = { connect: { id: input.assignedToId } };
    }
  }

  /**
   * 👷 ASSIGNEE: can update STATUS ONLY
   */
  if (isAssignee && !isCreator) {
    if (input.status === undefined) {
      throw new Error("Assignee can only update task status");
    }
    data.status = input.status;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  const io = getIO();
  io.emit("task:updated", updatedTask);

  // 🔔 Notify newly assigned user
  if (isCreator && input.assignedToId && input.assignedToId !== task.assignedToId) {
    await createAndEmitNotification(
      input.assignedToId,
      "TaskAssigned",
      "New Task Assigned",
      `You have been assigned: "${updatedTask.title}"`,
      {
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        assignedBy: updatedTask.creator.name,
      }
    );

    // Keep old event for backwards compatibility
    io.to(input.assignedToId).emit("task:assigned", updatedTask);
  }

  // 🔔 Notify creator if assignee completes the task
  if (isAssignee && input.status === "Completed" && task.status !== "Completed") {
    await createAndEmitNotification(
      task.creatorId,
      "TaskCompleted",
      "Task Completed",
      `"${updatedTask.title}" has been completed by ${updatedTask.assignedTo?.name}`,
      {
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        completedBy: updatedTask.assignedTo?.name,
      }
    );
  }

  return updatedTask;
}

/**
 * 🔹 DELETE TASK (CREATOR ONLY)
 */
export async function deleteTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!task || task.creatorId !== userId) {
    throw new Error("Not authorized to delete this task");
  }

  // 🔔 Notify assigned user if task is deleted
  if (task.assignedToId) {
    await createAndEmitNotification(
      task.assignedToId,
      "TaskDeleted",
      "Task Deleted",
      `The task "${task.title}" has been deleted`,
      {
        taskId: task.id,
        taskTitle: task.title,
      }
    );
  }

  await prisma.task.delete({ where: { id: taskId } });

  const io = getIO();
  io.emit("task:deleted", { taskId });
}

export async function getTasksWithFilters(filters: {
  status?: "ToDo" | "InProgress" | "Review" | "Completed";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  sort?: "asc" | "desc";
}) {
  return prisma.task.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
    },
    orderBy: {
      dueDate: filters.sort || "asc",
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}