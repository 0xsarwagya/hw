"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface PickupLocation {
  id: number;
  name: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
}

export function useShiprocketPickupLocations() {
  return useApiQuery<PickupLocation[]>(endpoints.shipping.pickupLocations);
}
