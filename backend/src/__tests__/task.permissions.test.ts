import request, { Response } from "supertest";
import app from "../app";
import prisma from "../../prisma/client";

jest.setTimeout(20000);

describe("Task Permissions", () => {
  let creatorCookie: string;
  let assigneeCookie: string;
  let taskId: string;
  let assigneeId: string;

  beforeAll(async () => {
    creatorCookie = global.authCookie;
    if (!creatorCookie) throw new Error("Auth cookie not found in global setup");

    // Register assignee
    const registerRes = await request(app).post("/auth/register").send({
      name: "Assignee",
      email: "assignee@perm.com",
      password: "password123",
    });
    console.log("Assignee registration:", registerRes.status);

    const loginRes: Response = await request(app).post("/auth/login").send({
      email: "assignee@perm.com",
      password: "password123",
    });
    console.log("Assignee login:", loginRes.status);

    const assigneeSetCookie = loginRes.headers["set-cookie"];
    if (!assigneeSetCookie || !assigneeSetCookie[0]) {
      throw new Error("Assignee login failed");
    }
    assigneeCookie = assigneeSetCookie[0];

    const assignee = await prisma.user.findUnique({
      where: { email: "assignee@perm.com" },
    });
    if (!assignee) throw new Error("Assignee not found in DB");
    assigneeId = assignee.id;
    console.log("Assignee ID:", assigneeId);

    // Create task assigned to assignee
    const taskRes: Response = await request(app)
      .post("/tasks")
      .set("Cookie", creatorCookie)
      .send({
        title: "Permission Task",
        description: "Testing permissions",
        dueDate: new Date().toISOString(),
        priority: "Medium",
        status: "ToDo",
        assignedToId: assigneeId,
      });

    console.log("Task creation response:", taskRes.status, taskRes.body);

    if (taskRes.status !== 201) {
      console.error("Failed to create task:", taskRes.body);
      throw new Error("Failed to create task for permissions test");
    }

    taskId = taskRes.body.task?.id || taskRes.body.id;
    if (!taskId) {
      console.error("Task ID not found in response:", taskRes.body);
      throw new Error("Task ID not found");
    }
    console.log("Created task ID:", taskId);
  });

  afterAll(async () => {
    // Clean up assignee and their tasks
    try {
      await prisma.task.deleteMany({
        where: { 
          OR: [
            { assignedToId: assigneeId },
            { id: taskId }
          ]
        },
      });
      await prisma.user.delete({
        where: { email: "assignee@perm.com" },
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("assignee CAN update status", async () => {
    const res: Response = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Cookie", assigneeCookie)
      .send({ status: "InProgress" });

    console.log("Assignee update status:", res.status, res.body);
    expect(res.status).toBe(200);
  });

  it("assignee CANNOT update title", async () => {
    const res: Response = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Cookie", assigneeCookie)
      .send({ title: "Hack Attempt" });

    console.log("Assignee update title:", res.status, res.body);
    expect(res.status).toBe(403);
  });

  it("creator CAN update everything", async () => {
    const res: Response = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Cookie", creatorCookie)
      .send({ title: "Updated by Creator" });

    console.log("Creator update:", res.status, res.body);
    expect(res.status).toBe(200);
  });
});
