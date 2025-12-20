import { Request, Response } from "express";
import { getHealthStatus } from "../services/health.service";

export const healthController = (
  req: Request,
  res: Response
) => {
  const message = getHealthStatus();
  res.status(200).json({ message });
};
