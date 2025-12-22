"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { endpoints, get, post } from "@/lib/api/client";
import {
  applyAddressResponseSchema,
  type CheckoutAddress,
  checkoutSessionSchema,
  paymentMethodSchema,
  shippingMethodSchema,
} from "@/lib/validations/checkout";
import { orderSchema } from "@/lib/validations/order";

/**
 * Start checkout session
 */
export function useStartCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { cartId: string; guestEmail?: string }) => {
      const data = await post(endpoints.checkout.start, input);
      return checkoutSessionSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["checkout", "session"], data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start checkout");
    },
  });
}

/**
 * Apply shipping address
 */
export function useApplyAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CheckoutAddress) => {
      const data = await post(endpoints.checkout.address, input);
      return applyAddressResponseSchema.parse(data);
    },
    onSuccess: () => {
      // Invalidate shipping methods to refetch with new address
      queryClient.invalidateQueries({
        queryKey: ["checkout", "shipping-methods"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save address");
    },
  });
}

/**
 * Get shipping methods
 */
export function useShippingMethods(params?: {
  checkoutSessionId?: string;
  pincode?: string;
  state?: string;
}) {
  return useQuery({
    queryKey: ["checkout", "shipping-methods", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.checkoutSessionId)
        searchParams.set("checkoutSessionId", params.checkoutSessionId);
      if (params?.pincode) searchParams.set("pincode", params.pincode);
      if (params?.state) searchParams.set("state", params.state);

      const queryString = searchParams.toString();
      const url = queryString
        ? `${endpoints.checkout.shippingMethods}?${queryString}`
        : endpoints.checkout.shippingMethods;
      const data = await get(url);
      return Array.isArray(data)
        ? data.map((m) => shippingMethodSchema.parse(m))
        : [];
    },
    enabled: !!(params?.checkoutSessionId || params?.pincode),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Select shipping method
 */
export function useSelectShipping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      checkoutSessionId: string;
      shippingMethodId: string;
    }) => {
      const data = await post(endpoints.checkout.shipping, input);
      return checkoutSessionSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["checkout", "session"], data);
      // Invalidate payment methods to refetch with shipping cost
      queryClient.invalidateQueries({
        queryKey: ["checkout", "payment-methods"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to select shipping method");
    },
  });
}

/**
 * Get payment methods with fees
 */
export function usePaymentMethods(params?: {
  checkoutSessionId?: string;
  shippingAddressId?: string;
  country?: string;
  state?: string;
  pincode?: string;
}) {
  return useQuery({
    queryKey: ["checkout", "payment-methods", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.checkoutSessionId)
        searchParams.set("checkoutSessionId", params.checkoutSessionId);
      if (params?.shippingAddressId)
        searchParams.set("shippingAddressId", params.shippingAddressId);
      if (params?.country) searchParams.set("country", params.country);
      if (params?.state) searchParams.set("state", params.state);
      if (params?.pincode) searchParams.set("pincode", params.pincode);

      const queryString = searchParams.toString();
      const url = queryString
        ? `${endpoints.checkout.paymentMethods}?${queryString}`
        : endpoints.checkout.paymentMethods;
      const data = await get<{ methods: unknown[] }>(url);
      return data.methods.map((m) => paymentMethodSchema.parse(m));
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Select payment method
 */
export function useSelectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      checkoutSessionId: string;
      paymentMethod: string;
    }) => {
      const data = await post(endpoints.checkout.payment, input);
      return data as { success: boolean; fee: number; breakdown: unknown };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout", "session"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to select payment method");
    },
  });
}

/**
 * Confirm checkout and create order
 */
export function useConfirmCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { checkoutSessionId: string }) => {
      const data = await post(endpoints.checkout.confirm, input);
      return orderSchema.parse(data);
    },
    onSuccess: (data) => {
      // Clear checkout session
      queryClient.removeQueries({ queryKey: ["checkout"] });
      // Clear cart
      queryClient.removeQueries({ queryKey: ["cart"] });
      // Invalidate orders
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully!");
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place order");
    },
  });
}
