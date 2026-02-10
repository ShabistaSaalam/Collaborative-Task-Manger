import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config/env";

import { healthController } from "./controllers/health.controller";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import taskRoutes from "./routes/task.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();

// CORS Configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/health", healthController);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;