"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";
import { useApiQuery } from "../use-api-query";

export interface JobExecution {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "success" | "failure";
  duration?: number;
  error?: string;
}

export interface JobStatus {
  name: string;
  description: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  status: "idle" | "running" | "error";
  lastDuration?: number;
  lastError?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

export interface JobsListResponse {
  jobs: JobStatus[];
}

export interface JobHistoryResponse {
  jobName: string;
  history: JobExecution[];
}

export function useBackgroundJobs() {
  return useApiQuery<JobsListResponse>(endpoints.jobs.list, {
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

export function useJobHistory(jobName: string) {
  return useApiQuery<JobHistoryResponse>(endpoints.jobs.history(jobName), {
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!jobName,
  });
}

export function useTriggerJob() {
  const queryClient = useQueryClient();

  return useApiMutation<
    { message: string; jobName: string },
    { jobName: string }
  >({
    mutationFn: async ({ jobName }) => {
      return api.post<{ message: string; jobName: string }>(
        endpoints.jobs.trigger(jobName),
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.jobs.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.jobs.history(data.jobName)],
      });
      toast.success(`Job ${data.jobName} triggered successfully`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to trigger job");
    },
  });
}
