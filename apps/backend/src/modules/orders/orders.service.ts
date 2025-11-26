import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  addresses,
  and,
  cartItems,
  customers,
  db,
  desc,
  eq,
  ilike,
  inArray,
  orderItems,
  orders,
  products,
  productVariants,
  sql,
} from "@vcecom/db";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { CartsService } from "../carts/carts.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly cartsService: CartsService) {}

  /**
   * Generate unique order number
   * Format: ORD-YYYY-NNNNNN (e.g., ORD-2025-001234)
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    // Get the latest order number for this year
    const latestOrders = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(ilike(orders.orderNumber, `${prefix}%`))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    let sequence = 1;
    if (latestOrders.length > 0) {
      const latestNumber = latestOrders[0].orderNumber;
      const sequenceStr = latestNumber.replace(prefix, "");
      const parsedSequence = parseInt(sequenceStr, 10);
      if (!Number.isNaN(parsedSequence)) {
        sequence = parsedSequence + 1;
      }
    }

    // Format sequence as 6-digit number
    const formattedSequence = sequence.toString().padStart(6, "0");
    return `${prefix}${formattedSequence}`;
  }

  /**
   * Get customer ID from user ID
   */
  private async getCustomerId(userId: string): Promise<string> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      throw new NotFoundException("Customer profile not found");
    }

    return customer.id;
  }

  /**
   * Get seller state (default to Maharashtra)
   */
  private getSellerState(): string {
    return process.env.SELLER_STATE || "Maharashtra";
  }

  /**
   * Validate that addresses belong to the customer
   */
  private async validateAddresses(
    customerId: string,
    shippingAddressId: string,
    billingAddressId: string,
  ) {
    // Check shipping address
    const [shippingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, shippingAddressId),
          eq(addresses.customerId, customerId),
        ),
      )
      .limit(1);

    if (!shippingAddress) {
      throw new NotFoundException(
        "Shipping address not found or does not belong to customer",
      );
    }

    // Check billing address
    const [billingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, billingAddressId),
          eq(addresses.customerId, customerId),
        ),
      )
      .limit(1);

    if (!billingAddress) {
      throw new NotFoundException(
        "Billing address not found or does not belong to customer",
      );
    }

    return { shippingAddress, billingAddress };
  }

  /**
   * Create order from cart
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    const customerId = await this.getCustomerId(userId);

    // Validate addresses
    const { shippingAddress } = await this.validateAddresses(
      customerId,
      createOrderDto.shippingAddressId,
      createOrderDto.billingAddressId,
    );

    // Get customer cart
    const cart = await this.cartsService.getCart(userId, null);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Get cart items with product variant details
    const cartItemIds = cart.items.map((item) => item.id);
    const cartItemsWithVariants = await db
      .select({
        cartItemId: cartItems.id,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        price: cartItems.price,
        variantInventory: productVariants.inventory,
        productGstRate: products.gstRate,
      })
      .from(cartItems)
      .innerJoin(
        productVariants,
        eq(cartItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(cartItems.id, cartItemIds));

    // Validate inventory
    for (const item of cartItemsWithVariants) {
      if (item.variantInventory < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for product variant ${item.productVariantId}. Available: ${item.variantInventory}, Requested: ${item.quantity}`,
        );
      }
    }

    // Calculate totals
    const sellerState = this.getSellerState();
    const buyerState = shippingAddress.state;

    let subtotal = 0;
    let totalGstAmount = 0;

    // Calculate subtotal and GST for each item
    for (const item of cartItemsWithVariants) {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      // Calculate GST breakdown
      const gstBreakdown = calculateGstBreakdown(
        itemSubtotal,
        item.productGstRate,
        sellerState,
        buyerState,
      );
      totalGstAmount += gstBreakdown.totalGst;
    }

    const shippingCost = createOrderDto.shippingCost || 0;
    const total = subtotal + totalGstAmount + shippingCost;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        customerId,
        orderNumber,
        status: "pending",
        subtotal,
        gstAmount: totalGstAmount,
        shippingCost,
        total,
        shippingAddressId: createOrderDto.shippingAddressId,
        billingAddressId: createOrderDto.billingAddressId,
      })
      .returning();

    // Create order items
    const orderItemsToInsert = cartItemsWithVariants.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      const gstBreakdown = calculateGstBreakdown(
        itemSubtotal,
        item.productGstRate,
        sellerState,
        buyerState,
      );

      return {
        orderId: order.id,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: item.price,
        gstRate: item.productGstRate,
        gstAmount: gstBreakdown.totalGst,
      };
    });

    const insertedOrderItems = await db
      .insert(orderItems)
      .values(orderItemsToInsert)
      .returning();

    // Update inventory (reduce stock)
    for (const item of cartItemsWithVariants) {
      await db
        .update(productVariants)
        .set({
          inventory: sql`${productVariants.inventory} - ${item.quantity}`,
        })
        .where(eq(productVariants.id, item.productVariantId));
    }

    // Clear cart
    await this.cartsService.clearCart(userId, null);

    // Return order with items
    return {
      ...order,
      items: insertedOrderItems,
    } as OrderResponseDto;
  }

  /**
   * Get order by ID (for authenticated customer)
   */
  async findOne(userId: string, orderId: string) {
    const customerId = await this.getCustomerId(userId);

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return {
      ...order,
      items,
    } as OrderResponseDto;
  }

  /**
   * Get all orders for authenticated customer
   */
  async findAll(userId: string) {
    const customerId = await this.getCustomerId(userId);

    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    // Get items for each order
    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        } as OrderResponseDto;
      }),
    );

    return ordersWithItems;
  }
}
