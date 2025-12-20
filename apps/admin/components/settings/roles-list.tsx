"use client";

import { Eye, ShieldCheck, Tag, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Available roles in the system
 */
const ROLES = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to all features and settings",
    icon: ShieldCheck,
    color: "destructive",
    permissions: ["all"],
  },
  {
    id: "support",
    name: "Support",
    description: "Access to orders, customers, and customer support features",
    icon: UserCheck,
    color: "default",
    permissions: ["orders", "customers", "abandoned-checkouts"],
  },
  {
    id: "reviewer",
    name: "Reviewer",
    description: "Access to review moderation and management",
    icon: Eye,
    color: "secondary",
    permissions: ["reviews"],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Access to discounts, price lists, and marketing features",
    icon: Tag,
    color: "outline",
    permissions: ["discounts", "price-lists", "customer-groups"],
  },
] as const;

/**
 * Roles list component
 * Displays available roles and their descriptions
 */
export function RolesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Roles</CardTitle>
        <CardDescription>
          Roles define what features and data a user can access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="rounded-full bg-muted p-2">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{role.name}</h3>
                    <Badge
                      variant={
                        role.color as
                          | "default"
                          | "secondary"
                          | "destructive"
                          | "outline"
                      }
                    >
                      {role.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {role.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-md bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Role management APIs are not yet available in
            the backend. Roles are currently assigned during user creation. Full
            role and permission management will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
