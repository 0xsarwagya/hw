import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});
