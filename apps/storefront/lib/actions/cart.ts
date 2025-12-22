"use server";

/**
 * Server Actions for Cart
 */

import { cartSchema } from "../validations/cart";
import { serverApiClient } from "./utils";

/**
 * Get cart
 */
export async function getCart() {
  try {
    const data = await serverApiClient<unknown>("/store/cart");
    return cartSchema.parse(data);
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return null;
  }
}
