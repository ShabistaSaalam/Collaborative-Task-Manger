process.env.NODE_ENV = "test";

import request from "supertest";
import app from "./src/app";
import prisma from "./prisma/client";

beforeAll(async () => {
  console.log("🔧 Running global test setup...");
  
  // Clean database
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const user = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  // Register user
  const registerRes = await request(app).post("/auth/register").send(user);
  console.log("✅ Test user registered:", registerRes.status);

  // Login and get cookie
  const loginRes = await request(app).post("/auth/login").send({
    email: user.email,
    password: user.password,
  });

  console.log("Login response status:", loginRes.status);
  console.log("Set-Cookie header:", loginRes.headers["set-cookie"]);

  if (!loginRes.headers["set-cookie"]) {
    throw new Error("Failed to get auth cookie in setup");
  }

  // Store cookie globally for all tests
  global.authCookie = loginRes.headers["set-cookie"][0];
  console.log("✅ Auth cookie stored globally");
});

afterAll(async () => {
  console.log("🧹 Cleaning up after all tests...");
  await prisma.$disconnect();
});