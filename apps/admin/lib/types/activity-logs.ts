export interface ActivityLog {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  resource: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedActivityLogsResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
