"use client";

import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Permission categories and actions
 */
const PERMISSIONS = [
  {
    category: "Products",
    actions: [
      { id: "products:read", name: "View Products" },
      { id: "products:create", name: "Create Products" },
      { id: "products:update", name: "Update Products" },
      { id: "products:delete", name: "Delete Products" },
      { id: "products:bulk", name: "Bulk Operations" },
    ],
  },
  {
    category: "Orders",
    actions: [
      { id: "orders:read", name: "View Orders" },
      { id: "orders:update", name: "Update Orders" },
      { id: "orders:refund", name: "Process Refunds" },
      { id: "orders:mark-paid", name: "Mark as Paid" },
      { id: "orders:notes", name: "Add Notes" },
    ],
  },
  {
    category: "Inventory",
    actions: [
      { id: "inventory:read", name: "View Inventory" },
      { id: "inventory:adjust", name: "Adjust Inventory" },
      { id: "inventory:bulk-adjust", name: "Bulk Adjust" },
      { id: "inventory:settings", name: "Manage Settings" },
    ],
  },
  {
    category: "Discounts",
    actions: [
      { id: "discounts:read", name: "View Discounts" },
      { id: "discounts:create", name: "Create Discounts" },
      { id: "discounts:update", name: "Update Discounts" },
      { id: "discounts:delete", name: "Delete Discounts" },
    ],
  },
  {
    category: "Price Lists",
    actions: [
      { id: "price-lists:read", name: "View Price Lists" },
      { id: "price-lists:create", name: "Create Price Lists" },
      { id: "price-lists:update", name: "Update Price Lists" },
      { id: "price-lists:delete", name: "Delete Price Lists" },
    ],
  },
  {
    category: "Customers",
    actions: [
      { id: "customers:read", name: "View Customers" },
      { id: "customers:update", name: "Update Customers" },
    ],
  },
  {
    category: "Reviews",
    actions: [
      { id: "reviews:read", name: "View Reviews" },
      { id: "reviews:approve", name: "Approve Reviews" },
      { id: "reviews:reject", name: "Reject Reviews" },
      { id: "reviews:delete", name: "Delete Reviews" },
    ],
  },
  {
    category: "Media & Storage",
    actions: [
      { id: "storage:read", name: "View Files" },
      { id: "storage:upload", name: "Upload Files" },
      { id: "storage:delete", name: "Delete Files" },
    ],
  },
] as const;

/**
 * Role permissions mapping
 * Currently hardcoded - will be dynamic when backend adds permissions API
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.flatMap((p) => p.actions.map((a) => a.id)),
  support: [
    "orders:read",
    "orders:update",
    "orders:notes",
    "customers:read",
    "customers:update",
  ],
  reviewer: [
    "reviews:read",
    "reviews:approve",
    "reviews:reject",
    "reviews:delete",
  ],
  marketing: [
    "discounts:read",
    "discounts:create",
    "discounts:update",
    "discounts:delete",
    "price-lists:read",
    "price-lists:create",
    "price-lists:update",
    "price-lists:delete",
    "products:read",
  ],
};

const ROLES = ["admin", "support", "reviewer", "marketing"] as const;

/**
 * Permissions matrix component
 * Shows which permissions each role has
 */
export function PermissionsMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions Matrix</CardTitle>
        <CardDescription>
          View which permissions are available for each role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold">Permission</th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="text-center p-2 font-semibold min-w-[100px]"
                  >
                    <Badge variant="outline" className="capitalize">
                      {role}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr key={permission.category} className="border-b">
                  <td
                    colSpan={ROLES.length + 1}
                    className="p-2 font-semibold bg-muted/50"
                  >
                    {permission.category}
                  </td>
                </tr>
              ))}
              {PERMISSIONS.flatMap((permission) =>
                permission.actions.map((action) => (
                  <tr key={action.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 pl-6 text-sm">{action.name}</td>
                    {ROLES.map((role) => {
                      const hasPermission = ROLE_PERMISSIONS[role]?.includes(
                        action.id,
                      );
                      return (
                        <td key={role} className="p-2 text-center">
                          {hasPermission ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-md bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a preview of the permissions system
            structure. Full role and permission management will be available
            when backend APIs are implemented.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
