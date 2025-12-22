"use server";

/**
 * Server Actions for fetching checkout data
 * These are used in Server Components to fetch data before rendering
 */

import {
  paymentMethodSchema,
  shippingMethodSchema,
} from "../validations/checkout";
import { serverApiClient } from "./utils";

/**
 * Get available shipping methods
 */
export async function getShippingMethods(params: {
  checkoutSessionId?: string;
  pincode?: string;
  state?: string;
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params.checkoutSessionId)
      searchParams.set("checkoutSessionId", params.checkoutSessionId);
    if (params.pincode) searchParams.set("pincode", params.pincode);
    if (params.state) searchParams.set("state", params.state);

    const queryString = searchParams.toString();
    const url = queryString
      ? `/store/checkout/shipping-methods?${queryString}`
      : "/store/checkout/shipping-methods";

    const data = await serverApiClient<unknown[]>(url);
    return Array.isArray(data)
      ? data.map((m) => shippingMethodSchema.parse(m))
      : [];
  } catch (error) {
    console.error("Failed to fetch shipping methods:", error);
    return [];
  }
}

/**
 * Get available payment methods
 */
export async function getPaymentMethods(params: {
  checkoutSessionId?: string;
  shippingAddressId?: string;
  country?: string;
  state?: string;
  pincode?: string;
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params.checkoutSessionId)
      searchParams.set("checkoutSessionId", params.checkoutSessionId);
    if (params.shippingAddressId)
      searchParams.set("shippingAddressId", params.shippingAddressId);
    if (params.country) searchParams.set("country", params.country);
    if (params.state) searchParams.set("state", params.state);
    if (params.pincode) searchParams.set("pincode", params.pincode);

    const queryString = searchParams.toString();
    const url = queryString
      ? `/store/checkout/payment-methods?${queryString}`
      : "/store/checkout/payment-methods";

    const data = await serverApiClient<{ methods: unknown[] }>(url);
    return data.methods.map((m) => paymentMethodSchema.parse(m));
  } catch (error) {
    console.error("Failed to fetch payment methods:", error);
    // Re-throw the error so the page can handle it appropriately
    // This allows the page to show a proper error message instead of silently failing
    throw error;
  }
}
