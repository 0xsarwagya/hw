"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints, post } from "../lib/api/client";
import {
  type CreateRazorpayOrderInput,
  createRazorpayOrderSchema,
  paymentVerificationResponseSchema,
  razorpayOrderResponseSchema,
  type VerifyPaymentInput,
  verifyPaymentSchema,
} from "../lib/validations/payment";
import { toast } from "../utils/toast";

/**
 * Create Razorpay order
 */
export function useCreateRazorpayOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRazorpayOrderInput) => {
      const validated = createRazorpayOrderSchema.parse(input);
      const data = await post(
        endpoints.payments.createRazorpayOrder,
        validated,
      );
      return razorpayOrderResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create payment order");
    },
  });
}

/**
 * Verify Razorpay payment
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VerifyPaymentInput) => {
      const validated = verifyPaymentSchema.parse(input);
      const data = await post(endpoints.payments.verifyPayment, validated);
      return paymentVerificationResponseSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (data.verified) {
        toast.success("Payment verified successfully");
      } else {
        toast.error("Payment verification failed");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Payment verification failed");
    },
  });
}
