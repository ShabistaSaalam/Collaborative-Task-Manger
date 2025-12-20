import { Request, Response } from "express";
import { z, ZodError } from "zod";
import jwt from "jsonwebtoken";
import {
  registerUser,
  RegisterUserInput,
  loginUser,
  LoginUserInput,
} from "../services/auth.service";

// Schemas
const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});

// ===================== REGISTER =====================
export async function registerController(req: Request, res: Response) {
  try {
    // 1️⃣ Validate input
    const validated: RegisterUserInput = registerSchema.parse(req.body);

    // 2️⃣ Create user
    const user = await registerUser(validated);

    // 3️⃣ Generate JWT including name
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 4️⃣ Set HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5️⃣ Send response
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    return res.status(400).json({ error: error.message || "Something went wrong" });
  }
}

// ===================== LOGIN =====================
export async function loginController(req: Request, res: Response) {
  try {
    // 1️⃣ Validate input
    const validated: LoginUserInput = loginSchema.parse(req.body);

    // 2️⃣ Find user and check password
    const user = await loginUser(validated);

    // 3️⃣ Generate JWT including name
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 4️⃣ Set HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5️⃣ Send response
    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    return res.status(400).json({ error: error.message || "Something went wrong" });
  }
}

// ===================== LOGOUT =====================
export function logoutController(req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/", // must match cookie path when set
  });

  return res.status(200).json({ message: "Logged out successfully" });
}
