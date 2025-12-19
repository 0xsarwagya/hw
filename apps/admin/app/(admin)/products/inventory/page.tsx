import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Inventory page - Server component
 * Displays inventory management interface (currently placeholder)
 */
export default function InventoryPage() {
  return (
    <AdminPageLayout
      title="Inventory"
      description="Manage product inventory levels"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>
              View and manage inventory across all products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium mb-2">
                Inventory management coming soon
              </p>
              <p className="text-sm">
                Advanced inventory features will be available here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
