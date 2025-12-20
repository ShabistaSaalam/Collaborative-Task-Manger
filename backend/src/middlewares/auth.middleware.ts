import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ✅ Extend Express Request type
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Middleware to protect routes
 * Verifies JWT from HttpOnly cookie
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 1️⃣ Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
      email: string;
      name: string;
    };

    // 3️⃣ Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };

    // 4️⃣ Continue to controller
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
