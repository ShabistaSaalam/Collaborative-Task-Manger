import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"; 

import { healthController } from "./controllers/health.controller";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import taskRoutes from "./routes/task.routes";
import notificationRoutes from "./routes/notification.routes";
const app = express();

app.use(cors({
  origin: "http://localhost:5173", // Allow requests from this origin
  credentials: true,              // Allow cookies to be sent
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