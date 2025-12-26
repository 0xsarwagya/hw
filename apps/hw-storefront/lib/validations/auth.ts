import { z } from "zod";

/**
 * Auth validation schemas matching backend DTOs
 */

export const loginSchema = z.object({
  email: z.string().min(1, "Email or phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const registerSchema = z.object({
  email: z.string().email("Email must be a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["admin", "customer"]).optional().default("customer"),
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "customer"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
