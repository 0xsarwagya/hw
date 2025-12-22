import { z } from "zod";

/**
 * Checkout validation schemas matching backend DTOs
 */

// Form input schema - matches backend CheckoutAddressDto
export const checkoutAddressInputSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().min(1).max(20),
    address1: z.string().min(1).max(255),
    address2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    pincode: z.string().min(1).max(10),
    country: z.string().max(100).optional(),
    createAccount: z.boolean().optional(), // Checkbox to create account
    password: z.string().min(8).optional(), // Password for account creation
  })
  .refine(
    (data) => {
      // If createAccount is checked, password is required
      if (data.createAccount && (!data.password || data.password.length < 8)) {
        return false;
      }
      return true;
    },
    {
      message:
        "Password must be at least 8 characters when creating an account",
      path: ["password"],
    },
  );

// API schema - includes checkoutSessionId, excludes createAccount checkbox
export const checkoutAddressSchema = checkoutAddressInputSchema
  .omit({ createAccount: true })
  .extend({
    checkoutSessionId: z.string().uuid(),
    country: z.string().max(100).optional(),
    password: z.string().min(8).optional(), // Password is optional in API
  });

export const shippingMethodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  cost: z.number(),
  estimatedDays: z.number().nullable(),
  codAvailable: z.boolean(),
});

export const paymentFeeBreakdownSchema = z.object({
  method: z.string(),
  chargeType: z.enum(["FLAT", "PERCENTAGE", "MIXED"]),
  calculatedFee: z.number(),
  flatAmount: z.number().optional(),
  percentage: z.number().optional(),
  mixMin: z.number().optional(),
  mixCap: z.number().optional(),
});

export const paymentMethodSchema = z.object({
  method: z.string(),
  label: z.string(), // Backend returns 'label', not 'displayName'
  available: z.boolean(),
  fee: z.number(),
  breakdown: paymentFeeBreakdownSchema, // Backend returns 'breakdown', not 'feeBreakdown'
  unavailableReason: z.string().optional(),
  // Optional fields that may not be present
  description: z.string().nullable().optional(),
  restrictions: z
    .object({
      minOrderValue: z.number().optional(),
      maxOrderValue: z.number().optional(),
      allowedStates: z.array(z.string()).optional(),
      blockedStates: z.array(z.string()).optional(),
      allowedPincodes: z.array(z.string()).optional(),
      blockedPincodes: z.array(z.string()).optional(),
    })
    .optional(),
});

export const checkoutSessionSchema = z.object({
  checkoutSessionId: z.string().uuid(),
  cartId: z.string().uuid(),
  expiresAt: z.string().datetime().or(z.date()),
  totals: z
    .object({
      subtotal: z.number(),
      discount: z.number(),
      total: z.number(),
    })
    .optional(),
});

export const applyAddressResponseSchema = z.object({
  success: z.boolean(),
  addressId: z.string().uuid().optional(),
  serviceability: z.object({
    isValid: z.boolean(),
    isServiceable: z.boolean(),
  }),
  autoSelectedShippingMethodId: z.string().uuid().optional(),
  checkoutSessionId: z.string().uuid().optional(), // May be different if cart was reinitialized
});

// Checkout confirm response schema - matches backend response structure
// Backend returns: { orderId: string | null, paymentIntentId: string | null, redirectUrl: string | null, checkoutSessionId: string }
// - For COD: { orderId: string, paymentIntentId: null, redirectUrl: null, checkoutSessionId: string }
// - For online payments: { orderId: null, paymentIntentId: string | null, redirectUrl: null, checkoutSessionId: string }
export const checkoutConfirmResponseSchema = z.object({
  orderId: z.string().uuid().nullable(), // Present for COD orders, null for online payments
  paymentIntentId: z.string().nullable(), // Present for online payment orders, null for COD (may be placeholder "cod-..." from ordersService)
  redirectUrl: z.string().nullable(), // Payment gateway URL (currently always null)
  checkoutSessionId: z.string().uuid(), // Always present
});

// Input type for forms (country optional)
export type CheckoutAddressInput = z.infer<typeof checkoutAddressInputSchema>;
// Output type for API (country required with default)
export type CheckoutAddress = z.output<typeof checkoutAddressSchema>;
export type ShippingMethod = z.infer<typeof shippingMethodSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentFeeBreakdown = z.infer<typeof paymentFeeBreakdownSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type CheckoutConfirmResponse = z.infer<
  typeof checkoutConfirmResponseSchema
>;
