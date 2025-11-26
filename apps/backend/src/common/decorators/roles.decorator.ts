import { SetMetadata } from "@nestjs/common";

export const Roles = (role: "admin" | "customer") => SetMetadata("roles", role);
