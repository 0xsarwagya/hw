import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings page - Server component
 * Displays application settings (currently placeholder)
 */
export default function SettingsPage() {
  return (
    <AdminPageLayout title="Settings" description="Manage application settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure general application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Settings configuration coming soon</p>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}

