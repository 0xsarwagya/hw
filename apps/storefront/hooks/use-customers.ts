"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { endpoints, get, post, put } from "@/lib/api/client";
import {
  type ChangePasswordInput,
  type ClaimAccountInput,
  changePasswordSchema,
  claimAccountSchema,
  customerProfileSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from "@/lib/validations/customer";
import { orderSchema } from "@/lib/validations/order";

/**
 * Get customer profile
 */
export function useCustomerProfile() {
  return useQuery({
    queryKey: ["customers", "me"],
    queryFn: async () => {
      const data = await get(endpoints.customers.me);
      return customerProfileSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update customer profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const validated = updateProfileSchema.parse(input);
      const data = await put(endpoints.customers.updateProfile, validated);
      return customerProfileSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["customers", "me"], data);
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const validated = changePasswordSchema.parse(input);
      await post(endpoints.customers.changePassword, validated);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

/**
 * Claim account (convert guest to regular account)
 */
export function useClaimAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClaimAccountInput) => {
      const validated = claimAccountSchema.parse(input);
      const data = await post(endpoints.customers.claimAccount, validated);
      return customerProfileSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["customers", "me"], data);
      toast.success("Account claimed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to claim account");
    },
  });
}

/**
 * Get customer orders (alternative to useOrders)
 */
export function useCustomerOrders(status?: string) {
  return useQuery({
    queryKey: ["customers", "orders", status],
    queryFn: async () => {
      const url = status
        ? `${endpoints.customers.orders}?status=${status}`
        : endpoints.customers.orders;
      const data = await get(url);
      return Array.isArray(data) ? data.map((o) => orderSchema.parse(o)) : [];
    },
    staleTime: 1 * 60 * 1000,
  });
}
