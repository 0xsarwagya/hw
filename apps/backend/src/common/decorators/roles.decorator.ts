import { SetMetadata } from "@nestjs/common";

export const Roles = (
  ...roles: ("admin" | "customer" | "support" | "reviewer" | "marketing")[]
) => SetMetadata("roles", roles);
