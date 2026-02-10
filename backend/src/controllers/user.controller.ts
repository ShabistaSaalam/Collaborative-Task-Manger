import { Request, Response } from "express";
import { z, ZodError } from "zod";
import * as userService from "../services/user.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

// 🔹 GET PROFILE
export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = await userService.getUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

// 🔹 UPDATE PROFILE
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const validated = updateProfileSchema.parse(req.body);

    const updatedUser = await userService.updateUserProfile(
      req.user!.id,
      validated
    );

    // 🔁 Re-issue JWT so name/email stay in sync
    const token = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as any
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "strict",
    });

    return res.json({ user: updatedUser });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.issues });
    }

    return res.status(500).json({ message: "Server error" });
  }
}

// 🔹 GET ALL USERS (for assignment dropdown)
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const users = await userService.getAllUsers();

    return res.json({ users });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}