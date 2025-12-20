"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { QueryState } from "@/components/common/query-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/notifications/use-notifications";
import { FetchError } from "@/lib/api";

/**
 * Notifications page
 * Displays all notifications with filters and actions
 */
export function NotificationsPageClient() {
  const { notifications, unreadCount, isLoading, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <AdminPageLayout
      title="Notifications"
      description="View and manage your notifications"
      actions={
        unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )
      }
    >
      <QueryState
        isLoading={isLoading}
        error={error ? (error as FetchError) : null}
        data={notifications}
        emptyComponent={
          <EmptyState
            type="default"
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
            icon={<Bell className="h-12 w-12" />}
          />
        }
      >
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Unread</h2>
                <Badge variant="secondary">{unreadNotifications.length}</Badge>
              </div>
              <div className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => markRead.mutate(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Read</h2>
                <Badge variant="outline">{readNotifications.length}</Badge>
              </div>
              <div className="space-y-2">
                {readNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => markRead.mutate(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </QueryState>
    </AdminPageLayout>
  );
}

interface NotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date | string;
    link?: string;
  };
  onMarkRead: () => void;
}

function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const getTypeIcon = (_type: string) => {
    // Icons will be added based on notification type
    return <Bell className="h-5 w-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      low_stock: "text-orange-600",
      order_created: "text-blue-600",
      refund_processed: "text-green-600",
      review_pending: "text-yellow-600",
      media_issue: "text-red-600",
      discount_drift: "text-purple-600",
    };
    return colors[type] || "text-muted-foreground";
  };

  const content = (
    <div
      className={`flex items-start gap-4 rounded-lg border p-4 ${
        !notification.read ? "bg-muted/50 border-primary/20" : ""
      }`}
    >
      <div className={`${getTypeColor(notification.type)}`}>
        {getTypeIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{notification.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onMarkRead();
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <a href={notification.link} className="block">
        {content}
      </a>
    );
  }

  return content;
}
