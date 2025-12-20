"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/realtime/use-realtime-updates";

/**
 * Real-time connection indicator
 * Shows connection status for WebSocket/SSE
 */
export function RealtimeIndicator() {
  const { isConnected } = useRealtimeUpdates();

  return (
    <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      )}
    </Badge>
  );
}
