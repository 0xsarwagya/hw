"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminCustomerGroupMembers } from "@/hooks/customer-groups/use-admin-customer-group-members";

interface CustomerGroupMembersTableProps {
  groupId: string;
}

export function CustomerGroupMembersTable({
  groupId,
}: CustomerGroupMembersTableProps) {
  const {
    data: members,
    isLoading,
    error,
  } = useAdminCustomerGroupMembers(groupId);

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }, (_, i) => (
              <TableRow key={`customer-group-member-skeleton-row-${String(i)}`}>
                <TableCell colSpan={5}>
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
        Error loading members: {error.message}
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          No members in this group
        </p>
      </div>
    );
  }

  const handleRemoveMember = (memberId: string) => {
    // TODO: Implement remove member mutation when backend endpoint is available
    if (confirm("Remove this member from the group?")) {
      console.log("Remove member:", memberId);
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.email}</TableCell>
              <TableCell>{member.name || "—"}</TableCell>
              <TableCell>{member.phone || "—"}</TableCell>
              <TableCell>
                {format(new Date(member.joinedAt), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
