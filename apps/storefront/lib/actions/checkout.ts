"use server";

/**
 * Server Actions for Checkout
 * Uses cookies for session management, similar to Medusa pattern
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isRedirectError } from "../utils/redirect-error";
import {
  applyAddressResponseSchema,
  type CheckoutAddress,
  checkoutConfirmResponseSchema,
  checkoutSessionSchema,
} from "../validations/checkout";
import { getAuthToken, serverApiClient } from "./utils";

/**
 * Start checkout session
 */
export async function startCheckout(formData: FormData) {
  const cartId = formData.get("cartId") as string;
  const guestEmail = formData.get("guestEmail") as string | null;

  if (!cartId) {
    return { error: "Cart ID is required" };
  }

  try {
    const data = await serverApiClient<unknown>("/store/checkout/start", {
      method: "POST",
      body: {
        cartId,
        guestEmail: guestEmail || undefined,
      },
    });

    const session = checkoutSessionSchema.parse(data);
    revalidatePath("/checkout");
    return { success: true, session };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to start checkout",
    };
  }
}

/**
 * Apply shipping address
 */
export async function applyAddress(formData: FormData) {
  const checkoutSessionId = formData.get("checkoutSessionId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address1 = formData.get("address1") as string;
  const address2 = formData.get("address2") as string | null;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const pincode = formData.get("pincode") as string;
  const country = formData.get("country") as string | null;

  if (!checkoutSessionId) {
    return { error: "Checkout session ID is required" };
  }

  let response: z.infer<typeof applyAddressResponseSchema>;
  try {
    const addressData: CheckoutAddress = {
      checkoutSessionId,
      name,
      email,
      phone,
      address1,
      address2: address2 || undefined,
      city,
      state,
      pincode,
      country: country || "India",
    };

    const data = await serverApiClient<unknown>("/store/checkout/address", {
      method: "POST",
      body: addressData,
    });

    response = applyAddressResponseSchema.parse(data);
  } catch (error) {
    // Re-throw redirect errors - they should not be caught
    if (isRedirectError(error)) {
      throw error;
    }

    // Handle actual errors
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save address";
    redirect(`/checkout/error?message=${encodeURIComponent(errorMessage)}`);
  }

  // Handle redirects outside try-catch (per Next.js best practices)
  if (response.success) {
    revalidatePath("/checkout");
    // Redirect based on whether shipping was auto-selected
    const sessionId = response.checkoutSessionId || checkoutSessionId;
    if (response.autoSelectedShippingMethodId) {
      redirect(`/checkout/payment?session=${sessionId}`);
    } else {
      redirect(`/checkout/shipping?session=${sessionId}`);
    }
  }

  return response;
}

/**
 * Select shipping method
 */
export async function selectShipping(formData: FormData) {
  const checkoutSessionId = formData.get("checkoutSessionId") as string;
  const shippingMethodId = formData.get("shippingMethodId") as string;

  if (!checkoutSessionId || !shippingMethodId) {
    return { error: "Checkout session ID and shipping method ID are required" };
  }

  try {
    const data = await serverApiClient<unknown>("/store/checkout/shipping", {
      method: "POST",
      body: {
        checkoutSessionId,
        shippingMethodId,
      },
    });

    checkoutSessionSchema.parse(data);
    revalidatePath("/checkout");
  } catch (error) {
    // Re-throw redirect errors - they should not be caught
    if (isRedirectError(error)) {
      throw error;
    }

    // Handle actual errors
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to select shipping method";
    redirect(`/checkout/error?message=${encodeURIComponent(errorMessage)}`);
  }

  // Redirect outside try-catch (per Next.js best practices)
  redirect(`/checkout/payment?session=${checkoutSessionId}`);
}

/**
 * Select payment method
 */
export async function selectPayment(formData: FormData) {
  const checkoutSessionId = formData.get("checkoutSessionId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  if (!checkoutSessionId || !paymentMethod) {
    return {
      error: "Checkout session ID and payment method are required",
    };
  }

  try {
    await serverApiClient<unknown>("/store/checkout/payment", {
      method: "POST",
      body: {
        checkoutSessionId,
        paymentMethod,
      },
    });

    revalidatePath("/checkout");
  } catch (error) {
    // Re-throw redirect errors - they should not be caught
    if (isRedirectError(error)) {
      throw error;
    }

    // Handle actual errors
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to select payment method";
    redirect(`/checkout/error?message=${encodeURIComponent(errorMessage)}`);
  }

  // Redirect outside try-catch (per Next.js best practices)
  redirect(`/checkout/confirm?session=${checkoutSessionId}`);
}

/**
 * Confirm checkout and create order
 */
export async function confirmCheckout(formData: FormData) {
  const checkoutSessionId = formData.get("checkoutSessionId") as string;
  const idempotencyKey = formData.get("idempotencyKey") as string | null;

  if (!checkoutSessionId) {
    return { error: "Checkout session ID is required" };
  }

  let confirmResponse: z.infer<typeof checkoutConfirmResponseSchema>;
  try {
    const data = await serverApiClient<unknown>("/store/checkout/confirm", {
      method: "POST",
      body: {
        checkoutSessionId,
        idempotencyKey: idempotencyKey || undefined,
      },
    });

    // Log the raw response for debugging
    console.log(
      "Raw checkout confirm response:",
      JSON.stringify(data, null, 2),
    );
    console.log("Response type check:", {
      isObject: typeof data === "object" && data !== null,
      hasOrderId: data && typeof data === "object" && "orderId" in data,
      orderIdValue:
        data && typeof data === "object"
          ? (data as { orderId?: unknown }).orderId
          : undefined,
      orderIdType:
        data && typeof data === "object"
          ? typeof (data as { orderId?: unknown }).orderId
          : undefined,
    });

    // Validate response structure matches backend DTO
    // Backend returns: { orderId: string | null, paymentIntentId: string | null, redirectUrl: string | null, checkoutSessionId: string }
    try {
      confirmResponse = checkoutConfirmResponseSchema.parse(data);
      console.log("Schema validation passed:", confirmResponse);
    } catch (validationError) {
      console.error("Schema validation failed:", {
        error: validationError,
        data: data,
      });
      throw validationError;
    }

    revalidatePath("/checkout");
    revalidatePath("/cart");
  } catch (error) {
    // Re-throw redirect errors - they should not be caught
    if (isRedirectError(error)) {
      throw error;
    }

    // Handle API errors (backend returns 400/404/etc)
    // serverApiClient throws Error with the backend's error message
    if (error instanceof Error) {
      console.error("Checkout confirm error:", {
        message: error.message,
        error: error,
        stack: error.stack,
      });

      // Redirect to error page with the backend's error message
      redirect(`/checkout/error?message=${encodeURIComponent(error.message)}`);
    } else {
      // Unknown error type
      console.error("Unknown checkout confirm error:", error);
      redirect(
        `/checkout/error?message=${encodeURIComponent("Failed to place order. Please try again.")}`,
      );
    }
    return; // TypeScript: ensure we don't continue after redirect
  }

  // Handle redirects outside try-catch (per Next.js best practices)
  // Log the parsed response for debugging
  console.log("Parsed confirm response:", {
    orderId: confirmResponse.orderId,
    orderIdType: typeof confirmResponse.orderId,
    orderIdIsString: typeof confirmResponse.orderId === "string",
    orderIdIsTruthy: !!confirmResponse.orderId,
    paymentIntentId: confirmResponse.paymentIntentId,
    paymentIntentIdType: typeof confirmResponse.paymentIntentId,
    checkoutSessionId: confirmResponse.checkoutSessionId,
  });

  // For COD orders, check multiple sources for orderId:
  // 1. Direct orderId field (preferred)
  // 2. Extract from paymentIntentId if it starts with "cod-" (backend fallback case)
  let orderId: string | null = null;

  if (
    confirmResponse.orderId !== null &&
    confirmResponse.orderId !== undefined
  ) {
    orderId = String(confirmResponse.orderId);
  } else if (
    confirmResponse.paymentIntentId !== null &&
    confirmResponse.paymentIntentId !== undefined &&
    String(confirmResponse.paymentIntentId).startsWith("cod-")
  ) {
    // Backend returns paymentIntentId as "cod-{orderId}" for COD orders
    // Extract the order ID by removing the "cod-" prefix
    const paymentIntentIdStr = String(confirmResponse.paymentIntentId);
    orderId = paymentIntentIdStr.replace(/^cod-/, "");
    console.log("Extracted orderId from COD paymentIntentId:", orderId);
  }

  // If we have an orderId (from either source), redirect to order page
  // Check if user is logged in to determine redirect path
  if (orderId && orderId.length > 0) {
    console.log("Redirecting to order page with orderId:", orderId);
    const token = await getAuthToken();
    if (token) {
      // User is logged in - redirect to account orders page
      redirect(`/account/orders/${orderId}`);
    } else {
      // Guest user - redirect to public order confirmation page
      redirect(`/orders/${orderId}`);
    }
  }

  // For online payment orders, paymentIntentId is present (but not placeholder COD IDs)
  // Only redirect to payment gateway if:
  // 1. No orderId was found (not COD)
  // 2. paymentIntentId is present and doesn't start with "cod-" (genuine online payment)
  if (
    !orderId &&
    confirmResponse.paymentIntentId !== null &&
    confirmResponse.paymentIntentId !== undefined
  ) {
    const paymentIntentIdStr = String(confirmResponse.paymentIntentId);
    if (paymentIntentIdStr && !paymentIntentIdStr.startsWith("cod-")) {
      console.log(
        "Redirecting to payment gateway with paymentIntentId:",
        paymentIntentIdStr,
      );
      redirect(
        `/checkout/payment-gateway?paymentIntentId=${paymentIntentIdStr}&session=${checkoutSessionId}`,
      );
    }
  }

  // Fallback error if neither valid orderId nor valid paymentIntentId is present
  // This should not happen in normal flow - log for debugging
  console.error(
    "Invalid checkout response - neither orderId nor valid paymentIntentId:",
    {
      orderId: confirmResponse.orderId,
      orderIdType: typeof confirmResponse.orderId,
      orderIdIsNull: confirmResponse.orderId === null,
      orderIdIsUndefined: confirmResponse.orderId === undefined,
      paymentIntentId: confirmResponse.paymentIntentId,
      paymentIntentIdType: typeof confirmResponse.paymentIntentId,
      paymentIntentIdIsNull: confirmResponse.paymentIntentId === null,
      paymentIntentIdIsUndefined: confirmResponse.paymentIntentId === undefined,
      checkoutSessionId: confirmResponse.checkoutSessionId,
      fullResponse: JSON.stringify(confirmResponse, null, 2),
    },
  );

  // Provide a more helpful error message
  const errorMessage =
    confirmResponse.orderId === null && confirmResponse.paymentIntentId === null
      ? "The checkout session may have expired or already been completed. Please start a new checkout."
      : `Invalid checkout response. orderId: ${confirmResponse.orderId}, paymentIntentId: ${confirmResponse.paymentIntentId}`;

  redirect(`/checkout/error?message=${encodeURIComponent(errorMessage)}`);
}
