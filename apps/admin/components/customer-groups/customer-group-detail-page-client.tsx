"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminCustomerGroup } from "@/hooks/customer-groups/use-admin-customer-group";
import { useAdminDeleteCustomerGroup } from "@/hooks/customer-groups/use-admin-delete-customer-group";
import { useAdminUpdateCustomerGroup } from "@/hooks/customer-groups/use-admin-update-customer-group";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { UpdateCustomerGroupInput } from "@/lib/types/customer-groups";
import { CustomerGroupForm } from "./customer-group-form";
import { CustomerGroupMembersTable } from "./customer-group-members-table";
import { CustomerGroupPriceListAssignment } from "./customer-group-price-list-assignment";

export function CustomerGroupDetailPageClient() {
  const params = useParams();
  const _router = useRouter();
  const groupId = params.id as string;

  const { data: group, isLoading, error } = useAdminCustomerGroup(groupId);
  const updateGroup = useAdminUpdateCustomerGroup(groupId);
  const deleteGroup = useAdminDeleteCustomerGroup(groupId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSubmit = async (data: UpdateCustomerGroupInput) => {
    await updateGroup.mutateAsync(data);
  };

  const handleDelete = async () => {
    await deleteGroup.mutateAsync();
    setDeleteDialogOpen(false);
  };

  const queryClient = useQueryClient();

  const handlePriceListRemoved = async (priceListId: string) => {
    try {
      await api.delete<void>(
        endpoints.customerGroups.removePriceList(groupId, priceListId),
      );
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.detail(groupId)],
      });
      toast.success("Price list removed successfully");
    } catch (_error) {
      toast.error("Failed to remove price list");
    }
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="Customer Group" description="Loading...">
        <div className="space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (error || !group) {
    return (
      <AdminPageLayout title="Customer Group" description="Error">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {error?.message || "Customer group not found"}
          </p>
          <Button asChild variant="outline">
            <Link href="/customer-groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customer Groups
            </Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={
        <div className="flex items-center gap-2">
          {group.name}
          <Badge variant={group.isActive ? "default" : "secondary"}>
            {group.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      }
      description={group.description || undefined}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" asChild>
            <Link href="/customer-groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="price-lists">Price Lists</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
              <CardDescription>Update customer group details</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerGroupForm
                initialData={{
                  name: group.name,
                  description: group.description ?? undefined,
                  isActive: group.isActive,
                }}
                onSubmit={handleSubmit}
                isLoading={updateGroup.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Group Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Members
                  </span>
                  <p className="text-2xl font-bold">{group.memberCount || 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Price Lists
                  </span>
                  <p className="text-2xl font-bold">
                    {group.priceLists?.length || 0}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Created
                  </span>
                  <p className="text-sm">
                    {format(new Date(group.createdAt), "PPP")}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Updated
                  </span>
                  <p className="text-sm">
                    {format(new Date(group.updatedAt), "PPP")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-lists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price List Assignment</CardTitle>
              <CardDescription>
                Assign price lists to this customer group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerGroupPriceListAssignment
                groupId={groupId}
                priceLists={group.priceLists || []}
                onPriceListRemoved={handlePriceListRemoved}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>
                Customers assigned to this group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerGroupMembersTable groupId={groupId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Customer Group"
        description="Are you sure you want to delete this customer group? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteGroup.isPending}
      />
    </AdminPageLayout>
  );
}
