"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminCustomerGroups } from "@/hooks/customer-groups/use-admin-customer-groups";

export function CustomerGroupsPageClient() {
  const { data: groups, isLoading, error } = useAdminCustomerGroups();

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Customer Groups"
        description="Manage customer groups and assign price lists"
        actions={
          <Button asChild>
            <Link href="/customer-groups/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Link>
          </Button>
        }
      >
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Price Lists</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, i) => (
                <TableRow key={`customer-group-list-skeleton-row-${String(i)}`}>
                  <TableCell colSpan={6}>
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout
        title="Customer Groups"
        description="Error loading groups"
      >
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
          Error loading customer groups: {error.message}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Customer Groups"
      description="Manage customer groups and assign price lists"
      actions={
        <Button asChild>
          <Link href="/customer-groups/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Link>
        </Button>
      }
    >
      <div className="border rounded-lg">
        {!groups || groups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No customer groups found
            </p>
            <Button asChild variant="outline">
              <Link href="/customer-groups/create">
                <Plus className="mr-2 h-4 w-4" />
                Create First Group
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Price Lists</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/customer-groups/${group.id}`}
                      className="hover:underline"
                    >
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.description || "—"}
                  </TableCell>
                  <TableCell>{group.memberCount || 0}</TableCell>
                  <TableCell>
                    {group.priceLists && group.priceLists.length > 0 ? (
                      <Badge variant="secondary">
                        {group.priceLists.length} list
                        {group.priceLists.length !== 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={group.isActive ? "default" : "secondary"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(group.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminPageLayout>
  );
}
