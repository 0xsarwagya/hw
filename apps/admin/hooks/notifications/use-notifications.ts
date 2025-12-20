"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  type:
    | "low_stock"
    | "order_created"
    | "refund_processed"
    | "review_pending"
    | "media_issue"
    | "discount_drift";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

/**
 * Hook for fetching notifications
 *
 * Note: Backend notification API needs to be implemented
 * Currently returns mock data structure
 */
export function useNotifications() {
  // TODO: Replace with actual endpoint when backend implements notifications
  // const endpoint = "/admin/notifications";

  // For now, return empty notifications until backend API is ready
  const { data, isLoading, error } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      // Mock implementation - replace with actual API call
      // return api.get<NotificationsResponse>(endpoint);
      return {
        notifications: [],
        unreadCount: 0,
        total: 0,
      };
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    total: data?.total || 0,
    isLoading,
    error,
  };
}

/**
 * Hook for marking notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_notificationId: string) => {
      // TODO: Replace with actual endpoint when backend implements notifications
      // return api.patch(`/admin/notifications/${notificationId}/read`, {});
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // TODO: Replace with actual endpoint when backend implements notifications
      // return api.post("/admin/notifications/read-all", {});
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
