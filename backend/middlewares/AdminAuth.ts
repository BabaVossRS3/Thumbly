import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AdminRequest extends Request {
  admin?: { id: string; email: string; role: string };
}

// Validate JWT_SECRET at module load time
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const protectAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    // Safely extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== "string") {
      return res
        .status(401)
        .json({ message: "No token provided. Please login first." });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res
        .status(401)
        .json({ message: "Invalid authorization header format. Expected 'Bearer <token>'." });
    }

    const token = parts[1];
    if (!token || token.trim() === "") {
      return res
        .status(401)
        .json({ message: "No token provided. Please login first." });
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as { id: string; email: string; role: string };

    req.admin = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please login again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token. Please login again." });
    }
    return res.status(401).json({ message: "Authentication failed. Please login again." });
  }
};

const requireSuperAdmin = (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.admin?.role !== "super_admin") {
    return res
      .status(403)
      .json({ message: "Only super admins can access this resource" });
  }
  next();
};

export { protectAdmin, requireSuperAdmin };
