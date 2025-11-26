import { SetMetadata } from "@nestjs/common";

export const Roles = (...roles: ("admin" | "customer")[]) =>
  SetMetadata("roles", roles);
