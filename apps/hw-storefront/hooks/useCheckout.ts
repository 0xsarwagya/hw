"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints, get, post } from "../lib/api/client";
import {
  applyAddressResponseSchema,
  type CheckoutAddress,
  checkoutConfirmResponseSchema,
  checkoutSessionSchema,
  paymentMethodSchema,
  selectShippingResponseSchema,
  shippingMethodSchema,
} from "../lib/validations/checkout";
import { orderSchema } from "../lib/validations/order";
import { toast } from "../utils/toast";

/**
 * Start checkout session
 */
export function useStartCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { cartId: string; guestEmail?: string }) => {
      console.log("🔄 useStartCheckout: Calling API with input:", input);
      try {
        const data = await post(endpoints.checkout.start, input);
        console.log("✅ useStartCheckout: API response:", data);
        const parsed = checkoutSessionSchema.parse(data);
        console.log("✅ useStartCheckout: Parsed response:", parsed);
        return parsed;
      } catch (error) {
        console.error("❌ useStartCheckout: Error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ useStartCheckout: onSuccess called with:", data);
      queryClient.setQueryData(["checkout", "session"], data);
    },
    onError: (error: Error) => {
      console.error("❌ useStartCheckout: onError called:", error);
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

      try {
        const data = await get<{ methods?: unknown[] } | unknown[]>(url);

        // Handle both response formats: { methods: [...] } or direct array
        if (
          data &&
          typeof data === "object" &&
          "methods" in data &&
          Array.isArray(data.methods)
        ) {
          return data.methods.map((m) => shippingMethodSchema.parse(m));
        } else if (Array.isArray(data)) {
          return data.map((m) => shippingMethodSchema.parse(m));
        }

        console.warn("Unexpected shipping methods response format:", data);
        return [];
      } catch (error) {
        console.error("Failed to fetch shipping methods:", error);
        throw error;
      }
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
      return selectShippingResponseSchema.parse(data);
    },
    onSuccess: (data) => {
      // Don't update checkout session cache - selectShipping doesn't return full session
      // Just invalidate payment methods to refetch with shipping cost
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

      try {
        const data = await get<{ methods?: unknown[] } | unknown[]>(url);

        // Handle response format: { methods: [...] }
        if (
          data &&
          typeof data === "object" &&
          "methods" in data &&
          Array.isArray(data.methods)
        ) {
          return data.methods.map((m) => paymentMethodSchema.parse(m));
        } else if (Array.isArray(data)) {
          // Handle direct array format (fallback)
          return data.map((m) => paymentMethodSchema.parse(m));
        }

        console.warn("Unexpected payment methods response format:", data);
        return [];
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        throw error;
      }
    },
    enabled: !!params, // Only fetch when params are provided
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
      return checkoutConfirmResponseSchema.parse(data);
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
