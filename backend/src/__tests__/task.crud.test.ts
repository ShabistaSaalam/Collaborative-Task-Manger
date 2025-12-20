import request, { Response } from "supertest";
import app from "../app";

jest.setTimeout(20000);

describe("Task CRUD", () => {
  let cookie: string;
  let taskId: string;

  beforeAll(() => {
    cookie = global.authCookie;
    if (!cookie) throw new Error("Auth cookie not found in global setup");
    console.log("Using cookie:", cookie.substring(0, 50) + "...");
  });

  it("should create task", async () => {
    const res: Response = await request(app)
      .post("/tasks")
      .set("Cookie", cookie)
      .send({
        title: "Test Task",
        description: "Test Description",
        dueDate: new Date().toISOString(),
        priority: "High",
        status: "ToDo",
      });

    console.log("Create task response:", res.status, res.body);

    if (res.status !== 201) {
      console.error("Error creating task:", res.body);
    }

    expect(res.status).toBe(201);
    
    // Handle both possible response structures
    taskId = res.body.task?.id || res.body.id;
    expect(taskId).toBeDefined();
    
    const taskTitle = res.body.task?.title || res.body.title;
    expect(taskTitle).toBe("Test Task");
  });

  it("should fetch all tasks", async () => {
    const res: Response = await request(app)
      .get("/tasks")
      .set("Cookie", cookie);

    console.log("Fetch tasks response:", res.status, res.body);
    expect(res.status).toBe(200);
    
    // Handle both possible response structures
    const tasks = res.body.tasks || res.body;
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("should update task", async () => {
    const res: Response = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Cookie", cookie)
      .send({ status: "InProgress" });

    console.log("Update task response:", res.status, res.body);
    
    if (res.status !== 200) {
      console.error("Error updating task:", res.body);
    }

    expect(res.status).toBe(200);
  });

  it("should delete task (creator only)", async () => {
    const res: Response = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Cookie", cookie);

    console.log("Delete task response:", res.status, res.body);
    
    if (res.status !== 200) {
      console.error("Error deleting task:", res.body);
    }

    expect(res.status).toBe(200);
  });
});