import express from "express";
import {
  registerUser,
  loginUser,
  verifyUser,
  logoutUser,
} from "../controllers/AuthControllers.js";
import protect from "../middlewares/Auth.js";
import { createRateLimiter } from "../middlewares/RateLimit.js";

const AuthRouter = express.Router();

// Rate limiting middleware for auth endpoints
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: "Too many login attempts, please try again later",
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 registration attempts per hour (allows legitimate retries)
  message: "Too many registration attempts, please try again later",
  // Security note: This limit is acceptable because:
  // 1. Database unique constraint on email prevents duplicate account creation
  // 2. Strong bcrypt password hashing prevents credential stuffing
  // 3. Input validation prevents injection attacks
  // 4. Rate limit still prevents rapid enumeration (max ~240 emails/day)
  // Recommendations for future hardening:
  // - Add email verification step
  // - Implement CAPTCHA after 3-5 failed attempts
  // - Increase password minimum to 8+ characters
  // - Add complexity requirements (uppercase, numbers, symbols)
});

AuthRouter.post("/register", registerLimiter, registerUser);
AuthRouter.post("/login", loginLimiter, loginUser);
AuthRouter.get("/verify", protect, verifyUser);
AuthRouter.post("/logout", protect, logoutUser);

export default AuthRouter;
