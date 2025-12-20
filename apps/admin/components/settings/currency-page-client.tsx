"use client";

import { DollarSign, Globe } from "lucide-react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Currency settings page
 *
 * Note: Currently displays single currency (INR).
 * Multi-currency support requires backend implementation.
 */
export function CurrencyPageClient() {
  // TODO: Replace with actual currency data from API
  const currencies = [
    { code: "INR", name: "Indian Rupee", symbol: "₹", isDefault: true },
  ];

  const _currentCurrency = currencies.find((c) => c.isDefault) || currencies[0];

  return (
    <AdminPageLayout
      title="Currency Settings"
      description="Manage store currencies and exchange rates"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Active Currencies</CardTitle>
            </div>
            <CardDescription>
              Currencies available for your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currencies.map((currency) => (
                <div
                  key={currency.code}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{currency.code}</span>
                        {currency.isDefault && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currency.name} ({currency.symbol})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Currently only INR (Indian Rupee) is
            supported. Multi-currency support will be available in a future
            update.
          </p>
        </div>
      </div>
    </AdminPageLayout>
  );
}
