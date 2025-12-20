"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface CourierServiceability {
  courierId: number;
  courierName: string;
  estimatedDeliveryDays: number | null;
  rate: number;
  codAvailable: boolean;
  codCharges: number;
  totalRate: number;
}

export interface CourierServiceabilityResponse {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  orderValue: number;
  codAmount: number | null;
  couriers: CourierServiceability[];
}

interface CourierServiceabilityParams {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  orderValue: number;
  codAmount?: number;
}

export function useShiprocketCouriers(params?: CourierServiceabilityParams) {
  return useApiQuery<CourierServiceabilityResponse>(
    endpoints.shipping.courierServiceability,
    {
      enabled: !!params,
      params: params as Record<string, string | number | boolean | undefined>,
    },
  );
}

