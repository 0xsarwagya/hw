import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <AdminPageLayout
      title="Dashboard"
      description="Welcome to the admin panel. Manage your e-commerce store from here."
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Quick Action
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </AdminPageLayout>
  );
}

