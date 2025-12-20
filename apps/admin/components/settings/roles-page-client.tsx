"use client";

import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { PermissionsMatrix } from "./permissions-matrix";
import { RolesList } from "./roles-list";

/**
 * Roles and Permissions Management Page
 *
 * Note: Currently shows role information. Full permissions system
 * requires backend support for role/permission management APIs.
 */
export function RolesPageClient() {
  return (
    <AdminPageLayout
      title="Roles & Permissions"
      description="Manage user roles and permissions for admin access"
    >
      <div className="space-y-6">
        <RolesList />
        <PermissionsMatrix />
      </div>
    </AdminPageLayout>
  );
}
