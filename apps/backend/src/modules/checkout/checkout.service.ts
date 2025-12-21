import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { addresses, db, eq } from "@vcecom/db";
import {
  formatPincode,
  isValidPincodeFormat,
  ServiceabilityResult,
} from "../../common/utils/pincode.utils";
import { CartsService } from "../carts/carts.service";
import { AddressesService } from "../customers/addresses.service";
import { CreateOrderDto } from "../orders/dto/create-order.dto";
import { OrdersService } from "../orders/orders.service";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import { CheckoutMetadata } from "../redis-store/dto/checkout-metadata.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import {
  ShippingCalculation,
  ShippingRulesService,
} from "../shipping/shipping-rules.service";
import {
  CheckoutAddressDto,
  CheckoutConfirmDto,
  CheckoutShippingDto,
  StartCheckoutDto,
} from "./dto/checkout.dto";

/**
 * Extended checkout metadata with custom fields for guest checkout
 * These fields are stored in Redis but not part of the base CheckoutMetadata interface
 */
interface ExtendedCheckoutMetadata extends CheckoutMetadata {
  _shippingAddress?: {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  _guestEmail?: string;
  _serviceability?: ServiceabilityResult;
  _shippingMethodId?: string;
  _shippingCalculation?: ShippingCalculation;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartsService: CartsService,
    private readonly checkoutStore: CheckoutStore,
    private readonly shippingRulesService: ShippingRulesService,
    private readonly addressesService: AddressesService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Start checkout - creates session, freezes cart, validates availability
   */
  async startCheckout(
    userId: string | null,
    sessionId: string | null,
    dto: StartCheckoutDto,
  ) {
    // Get cart
    const cart = await this.cartsService.getCart(userId, sessionId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Validate cart ID matches
    if (cart.id !== dto.cartId) {
      throw new BadRequestException("Cart ID mismatch");
    }

    // Check if cart is already locked
    const isLocked = await this.checkoutStore.isCheckoutLocked(cart.id);
    if (isLocked) {
      throw new ConflictException("Cart is already being checked out");
    }

    // Create checkout session
    const { sessionId: checkoutSessionId } =
      await this.checkoutStore.createSession(cart.id);

    // Acquire checkout lock to freeze cart
    const lockAcquired = await this.checkoutStore.acquireCheckoutLock(cart.id);
    if (!lockAcquired) {
      // Clean up session if lock failed
      await this.checkoutStore.failSession(checkoutSessionId);
      throw new ConflictException("Failed to lock cart for checkout");
    }

    // Store initial metadata (will be extended as checkout progresses)
    // Note: CheckoutMetadata requires customerId, so we'll create a guest customer later if needed
    // For now, store minimal metadata
    const initialMetadata: ExtendedCheckoutMetadata = {
      customerId: cart.customerId || "temp", // Will be replaced with actual guest customer ID
      userId: userId || null,
      shippingAddressId: "temp",
      billingAddressId: "temp",
      shippingCost: 0,
      discountSnapshot: null,
      pricingSnapshot: null,
      createdAt: new Date().toISOString(),
      // Store guest email in a custom field (will be handled during order creation)
      _guestEmail: dto.guestEmail,
    };
    await this.checkoutStore.storeCheckoutMetadata(
      checkoutSessionId,
      initialMetadata,
    );

    // Transition session to LOCKED state
    const currentSession =
      await this.checkoutStore.getSession(checkoutSessionId);
    if (currentSession) {
      await this.checkoutStore.transitionState(
        checkoutSessionId,
        currentSession.state,
        CheckoutState.LOCKED,
      );
    }

    return {
      checkoutSessionId,
      cartId: cart.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      totals: {
        subtotal: cart.subtotal,
        discount: cart.discountAmount || 0,
        total: cart.total,
      },
    };
  }

  /**
   * Apply shipping address to checkout
   */
  async applyAddress(
    userId: string | null,
    sessionId: string | null,
    dto: CheckoutAddressDto,
  ) {
    // Get checkout session
    const session = await this.checkoutStore.getSession(dto.checkoutSessionId);
    if (!session) {
      throw new NotFoundException("Checkout session not found");
    }

    // Assert session is in LOCKED state
    await this.checkoutStore.assertState(
      dto.checkoutSessionId,
      CheckoutState.LOCKED,
    );

    // Validate PIN code format
    const formattedPincode = formatPincode(dto.pincode);
    if (!isValidPincodeFormat(formattedPincode)) {
      throw new BadRequestException(
        "Invalid PIN code format. PIN code must be exactly 6 digits",
      );
    }

    // Check serviceability via Shiprocket/database
    const serviceability =
      await this.shippingRulesService.checkServiceability(formattedPincode);
    if (!serviceability.isValid || !serviceability.isServiceable) {
      throw new BadRequestException(
        `PIN code ${formattedPincode} is not serviceable`,
      );
    }

    // Create or get address
    let addressId: string | null = null;
    if (userId) {
      // For authenticated users, create address
      const address = await this.addressesService.create(userId, {
        type: "shipping",
        street: `${dto.address1}${dto.address2 ? `, ${dto.address2}` : ""}`,
        city: dto.city,
        state: dto.state,
        pincode: formattedPincode,
        district: dto.city,
        country: dto.country || "India",
      });
      addressId = address.id;
    }

    // Store address in checkout metadata
    // Extend metadata with address data (stored as custom fields for guest checkout)
    const metadata = await this.checkoutStore.getCheckoutMetadata(
      dto.checkoutSessionId,
    );
    if (!metadata) {
      throw new BadRequestException("Checkout metadata not found");
    }

    const updatedMetadata: ExtendedCheckoutMetadata = {
      ...metadata,
      shippingAddressId: addressId || metadata.shippingAddressId,
      billingAddressId: addressId || metadata.billingAddressId,
      // Store guest address data in custom fields
      _shippingAddress: userId
        ? undefined
        : {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            address1: dto.address1,
            address2: dto.address2,
            city: dto.city,
            state: dto.state,
            pincode: formattedPincode,
            country: dto.country || "India",
          },
      _serviceability: serviceability,
    };
    await this.checkoutStore.storeCheckoutMetadata(
      dto.checkoutSessionId,
      updatedMetadata,
    );

    return {
      success: true,
      addressId: userId ? addressId : undefined,
      serviceability,
    };
  }

  /**
   * Select shipping method
   */
  async selectShipping(
    userId: string | null,
    sessionId: string | null,
    dto: CheckoutShippingDto,
  ) {
    // Get checkout session
    const session = await this.checkoutStore.getSession(dto.checkoutSessionId);
    if (!session) {
      throw new NotFoundException("Checkout session not found");
    }

    // Assert session is in LOCKED state
    await this.checkoutStore.assertState(
      dto.checkoutSessionId,
      CheckoutState.LOCKED,
    );

    // Get checkout metadata to get address
    const metadata = await this.checkoutStore.getCheckoutMetadata(
      dto.checkoutSessionId,
    );
    if (!metadata) {
      throw new BadRequestException("Checkout metadata not found");
    }

    // Get address pincode (from stored address or guest address)
    let pincode: string;
    if (metadata.shippingAddressId && metadata.shippingAddressId !== "temp") {
      // Get address from database
      const [address] = await db
        .select({ pincode: addresses.pincode })
        .from(addresses)
        .where(eq(addresses.id, metadata.shippingAddressId))
        .limit(1);
      if (!address) {
        throw new BadRequestException("Shipping address not found");
      }
      pincode = address.pincode;
    } else {
      // Get from guest address stored in metadata
      const extendedMetadata = metadata as ExtendedCheckoutMetadata;
      const guestAddress = extendedMetadata._shippingAddress;
      if (!guestAddress) {
        throw new BadRequestException(
          "Shipping address not set. Please set address first.",
        );
      }
      pincode = guestAddress.pincode;
    }

    // Get cart to calculate weight and total
    const cart = await this.cartsService.getCart(userId, sessionId);
    if (!cart) {
      throw new BadRequestException("Cart not found");
    }

    // Calculate cart weight (simplified - sum of item weights, default 0.5kg per item)
    const cartWeight = cart.items.reduce((total, item) => {
      return total + item.quantity * 0.5; // Default 0.5kg per item
    }, 0);

    // Calculate shipping rate
    const shippingRate = await this.shippingRulesService.calculateShippingRate({
      pincode,
      weight: cartWeight,
      isCod: false, // Will be determined by payment method
    });

    // Store shipping method and cost in metadata
    const updatedMetadata: ExtendedCheckoutMetadata = {
      ...metadata,
      shippingCost: shippingRate.totalRate,
      _shippingMethodId: dto.shippingMethodId,
      _shippingCalculation: shippingRate,
    };
    await this.checkoutStore.storeCheckoutMetadata(
      dto.checkoutSessionId,
      updatedMetadata,
    );

    return {
      success: true,
      shippingCost: shippingRate.totalRate,
      estimatedDays: shippingRate.estimatedDays,
      codAvailable: shippingRate.isCodAvailable,
    };
  }

  /**
   * Confirm checkout and create order
   */
  async confirmCheckout(
    userId: string | null,
    sessionId: string | null,
    dto: CheckoutConfirmDto,
  ) {
    // Get checkout session
    const session = await this.checkoutStore.getSession(dto.checkoutSessionId);
    if (!session) {
      throw new NotFoundException("Checkout session not found");
    }

    // Assert session is in LOCKED state
    await this.checkoutStore.assertState(
      dto.checkoutSessionId,
      CheckoutState.LOCKED,
    );

    // Get checkout metadata
    const metadata = await this.checkoutStore.getCheckoutMetadata(
      dto.checkoutSessionId,
    );
    if (!metadata) {
      throw new BadRequestException("Checkout metadata not found");
    }

    if (!metadata.shippingCost) {
      throw new BadRequestException("Shipping method not selected");
    }

    if (!metadata.paymentMethod) {
      throw new BadRequestException("Payment method not selected");
    }

    // Get address data (from database or guest address)
    let createOrderDto: CreateOrderDto;
    const extendedMetadata = metadata as ExtendedCheckoutMetadata;
    if (
      extendedMetadata.shippingAddressId &&
      extendedMetadata.shippingAddressId !== "temp"
    ) {
      // Authenticated user - use address ID
      createOrderDto = {
        shippingAddressId: extendedMetadata.shippingAddressId,
        billingAddressId:
          extendedMetadata.billingAddressId ||
          extendedMetadata.shippingAddressId,
        shippingCost: extendedMetadata.shippingCost,
        idempotencyKey: dto.idempotencyKey,
      };
    } else {
      // Guest checkout - use address data from metadata
      const guestAddress = extendedMetadata._shippingAddress;
      const guestEmail = extendedMetadata._guestEmail;
      if (!guestAddress) {
        throw new BadRequestException("Shipping address not set");
      }
      createOrderDto = {
        email: guestEmail || guestAddress.email,
        name: guestAddress.name,
        phone: guestAddress.phone,
        address: {
          type: "shipping" as const,
          street: guestAddress.address1,
          city: guestAddress.city,
          state: guestAddress.state,
          pincode: guestAddress.pincode,
          district: guestAddress.city,
          country: guestAddress.country || "India",
        },
        shippingCost: extendedMetadata.shippingCost,
        idempotencyKey: dto.idempotencyKey,
      };
    }

    // Create order (this will handle payment intent creation)
    const paymentIntent = await this.ordersService.create(
      userId,
      createOrderDto,
      sessionId,
    );

    // Update checkout session with payment intent ID
    await this.checkoutStore.setPaymentIntent(
      dto.checkoutSessionId,
      paymentIntent.paymentIntent.paymentIntentId,
    );

    // Transition to PAYMENT_PENDING state
    await this.checkoutStore.transitionState(
      dto.checkoutSessionId,
      CheckoutState.LOCKED,
      CheckoutState.PAYMENT_PENDING,
    );

    return {
      orderId: null, // Will be created after payment confirmation
      paymentIntentId: paymentIntent.paymentIntent.paymentIntentId,
      redirectUrl: null, // Payment gateway URL will be generated by payment provider
      checkoutSessionId: dto.checkoutSessionId,
    };
  }
}
