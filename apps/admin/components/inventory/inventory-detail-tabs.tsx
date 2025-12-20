"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryLogs } from "@/hooks/inventory/use-inventory-logs";
import { useInventoryReservations } from "@/hooks/inventory/use-inventory-reservations";
import type { InventoryItem } from "@/lib/types/inventory";
import { AdjustInventoryPanel } from "./adjust-inventory-panel";
import { InventoryLogsTable } from "./inventory-logs-table";
import { InventoryReservationsTable } from "./inventory-reservations-table";

interface InventoryDetailTabsProps {
  variantId: string;
  item: InventoryItem;
}

/**
 * Tab navigation component for inventory detail page
 */
export function InventoryDetailTabs({
  variantId,
  item,
}: InventoryDetailTabsProps) {
  const { data: logsData } = useInventoryLogs(variantId, { limit: 50 });
  const { data: reservationsData } = useInventoryReservations(variantId);

  return (
    <Tabs defaultValue="adjustments" className="space-y-4">
      <TabsList>
        <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="reservations">Reservations</TabsTrigger>
        <TabsTrigger value="product">Product Info</TabsTrigger>
      </TabsList>

      <TabsContent value="adjustments" className="space-y-4">
        <AdjustInventoryPanel variantId={variantId} />
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        {logsData && <InventoryLogsTable logs={logsData.data} />}
      </TabsContent>

      <TabsContent value="reservations" className="space-y-4">
        {reservationsData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Reserved: {reservationsData.reserved}
                </p>
                {reservationsData.expired > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Expired: {reservationsData.expired}
                  </p>
                )}
              </div>
            </div>
            <InventoryReservationsTable
              reservations={reservationsData.activeReservations}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="product" className="space-y-4">
        <div className="rounded-lg border p-4 space-y-2">
          <div>
            <p className="text-sm font-medium">Product ID</p>
            <p className="text-sm text-muted-foreground font-mono">
              {item.productId}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Variant ID</p>
            <p className="text-sm text-muted-foreground font-mono">
              {item.variantId}
            </p>
          </div>
          {item.description && (
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
