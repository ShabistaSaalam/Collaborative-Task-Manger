import { Request } from "express";

declare global {
  var authCookie: string;

  namespace Express {
    interface Request {
      user?: {
        id: string;      
        email: string;
      };
    }
  }
}

export {};