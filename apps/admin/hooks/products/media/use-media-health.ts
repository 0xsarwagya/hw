import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface MediaIssue {
  type: string;
  severity: string;
  description: string;
  productId?: string;
  variantId?: string;
  imageId?: string;
  suggestedFix?: string;
  metadata?: Record<string, unknown>;
}

export interface MediaHealthStats {
  totalProducts: number;
  totalVariants: number;
  totalImages: number;
  productImages: number;
  variantImages: number;
  orphanImages: number;
  orderIndexIssues: number;
  s3ConsistencyIssues: number;
  variantInheritanceIssues: number;
  totalIssues: number;
}

export interface MediaHealthScanResult {
  issues: MediaIssue[];
  stats: MediaHealthStats;
  scannedAt: string;
}

export interface MediaFix {
  issueId: string;
  issueType: string;
  action: string;
  productId?: string;
  variantId?: string;
  imageId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  success: boolean;
  error?: string;
}

export interface MediaHealthFixResult {
  fixed: MediaFix[];
  errors: string[];
  stats: {
    totalIssues: number;
    fixedCount: number;
    errorCount: number;
  };
}

export interface MediaAuditLog {
  id: string;
  productId?: string;
  variantId?: string;
  imageId?: string;
  action: string;
  details?: Record<string, unknown>;
  performedBy: string;
  createdAt: string;
}

/**
 * Hook to scan for media consistency issues
 */
export function useMediaHealthScan() {
  return useQuery<MediaHealthScanResult>({
    queryKey: [endpoints.mediaHealth.scan],
    queryFn: async () => {
      return api.get<MediaHealthScanResult>(endpoints.mediaHealth.scan);
    },
  });
}

/**
 * Hook to fix media issues
 */
export function useMediaHealthFix() {
  const queryClient = useQueryClient();

  return useMutation<
    MediaHealthFixResult,
    Error,
    { action: string; performedBy?: string }
  >({
    mutationFn: async ({ action, performedBy }) => {
      const url = endpoints.mediaHealth.fix(action);
      const params = performedBy ? { performedBy } : undefined;
      return api.post<MediaHealthFixResult>(url, undefined, { params });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.mediaHealth.scan],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.mediaHealth.auditLogs],
      });
      toast.success("Media issues fixed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to fix media issues");
    },
  });
}

/**
 * Hook to get media audit logs
 */
export function useMediaAuditLogs(filters?: {
  productId?: string;
  variantId?: string;
  imageId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<MediaAuditLog[]>({
    queryKey: [endpoints.mediaHealth.auditLogs, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.productId) params.append("productId", filters.productId);
      if (filters?.variantId) params.append("variantId", filters.variantId);
      if (filters?.imageId) params.append("imageId", filters.imageId);
      if (filters?.action) params.append("action", filters.action);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const url = `${endpoints.mediaHealth.auditLogs}?${params.toString()}`;
      return api.get<MediaAuditLog[]>(url);
    },
    enabled: true,
  });
}
