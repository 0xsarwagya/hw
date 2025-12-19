"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { ActivityLog } from "@/lib/types/activity-logs";

interface AdminUser {
  id: string;
  email: string;
}

/**
 * Hook to fetch unique admin users from activity logs
 * Used for populating the admin filter dropdown
 */
export function useAdminFetchAdmins() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch a large number of activity logs to get unique admins
      const response = await api.get<{ data: ActivityLog[] }>(
        endpoints.activityLogs.list,
        {
          params: { limit: 1000 }, // Get enough to find unique admins
        },
      );

      // Extract unique admin users
      const adminMap = new Map<string, AdminUser>();
      response.data.forEach((log) => {
        if (log.adminId && log.adminEmail && !adminMap.has(log.adminId)) {
          adminMap.set(log.adminId, {
            id: log.adminId,
            email: log.adminEmail,
          });
        }
      });

      return Array.from(adminMap.values()).sort((a, b) =>
        a.email.localeCompare(b.email),
      );
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
