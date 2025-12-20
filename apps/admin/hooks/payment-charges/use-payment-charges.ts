import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  CreatePaymentChargeInput,
  PaymentFeePreview,
  PaymentMethodChargeConfig,
  UpdatePaymentChargeInput,
} from "@/lib/types/payment-charges";

export function usePaymentCharges() {
  return useQuery<PaymentMethodChargeConfig[], FetchError>({
    queryKey: ["payment-charges"],
    queryFn: () => api.get(endpoints.paymentCharges.list),
  });
}

export function usePaymentCharge(id: string) {
  return useQuery<PaymentMethodChargeConfig, FetchError>({
    queryKey: ["payment-charges", id],
    queryFn: () => api.get(endpoints.paymentCharges.detail(id)),
    enabled: !!id,
  });
}

export function useCreatePaymentCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentChargeInput) =>
      api.post<PaymentMethodChargeConfig>(
        endpoints.paymentCharges.create,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-charges"] });
    },
  });
}

export function useUpdatePaymentCharge(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePaymentChargeInput) =>
      api.patch<PaymentMethodChargeConfig>(
        endpoints.paymentCharges.update(id),
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-charges"] });
      queryClient.invalidateQueries({ queryKey: ["payment-charges", id] });
    },
  });
}

export function useDeletePaymentCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(endpoints.paymentCharges.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-charges"] });
    },
  });
}

export function usePreviewPaymentFee() {
  return useMutation({
    mutationFn: ({
      chargeId,
      cartTotal,
    }: {
      chargeId: string;
      cartTotal: number;
    }) =>
      api.post<PaymentFeePreview>(endpoints.paymentCharges.preview, {
        chargeId,
        cartTotal,
      }),
  });
}
