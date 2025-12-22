"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { del, endpoints, get, patch, post, put } from "@/lib/api/client";
import {
  addressSchema,
  type CreateAddressInput,
  createAddressSchema,
  type UpdateAddressInput,
  updateAddressSchema,
} from "@/lib/validations/address";

/**
 * Get all addresses
 */
export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const data = await get(endpoints.addresses.list);
      return Array.isArray(data) ? data.map((a) => addressSchema.parse(a)) : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single address by ID
 */
export function useAddress(id: string) {
  return useQuery({
    queryKey: ["addresses", id],
    queryFn: async () => {
      const data = await get(endpoints.addresses.detail(id));
      return addressSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAddressInput) => {
      const validated = createAddressSchema.parse(input);
      const data = await post(endpoints.addresses.create, validated);
      return addressSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.setQueryData(["addresses", data.id], data);
      toast.success("Address added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add address");
    },
  });
}

/**
 * Update address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAddressInput;
    }) => {
      const validated = updateAddressSchema.parse(input);
      const data = await put(endpoints.addresses.update(id), validated);
      return addressSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.setQueryData(["addresses", data.id], data);
      toast.success("Address updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update address");
    },
  });
}

/**
 * Delete address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await del(endpoints.addresses.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete address");
    },
  });
}

/**
 * Set address as default
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const data = await patch(endpoints.addresses.setDefault(id), {});
      return addressSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.setQueryData(["addresses", data.id], data);
      toast.success("Default address updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to set default address");
    },
  });
}
