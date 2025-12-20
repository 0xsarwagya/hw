import { Injectable, NotFoundException } from "@nestjs/common";
import { and, db, desc, eq, gte, lte, shipments, sql } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../../common/constants";

interface ShipmentFilters {
  orderId?: string;
  status?: string;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class ShipmentsService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Get all shipments with optional filters
   * @param filters - Filter criteria
   * @returns Paginated shipments
   */
  async findAll(filters: ShipmentFilters = {}) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;

    // Build where conditions
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle ORM condition array type
    const conditions: any[] = [];

    if (filters.orderId) {
      conditions.push(eq(shipments.orderId, filters.orderId));
    }

    if (filters.status) {
      conditions.push(eq(shipments.status, filters.status as any));
    }

    if (filters.provider) {
      conditions.push(eq(shipments.provider, filters.provider));
    }

    if (filters.startDate) {
      conditions.push(gte(shipments.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(shipments.createdAt, filters.endDate));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(whereClause);

    const total = Number(totalCount[0]?.count || 0);

    // Get shipments
    const shipmentsList = await db
      .select()
      .from(shipments)
      .where(whereClause)
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: shipmentsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get shipment by ID
   * @param id - Shipment ID
   * @returns Shipment details
   */
  async findOne(id: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id))
      .limit(1);

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    return shipment;
  }

  /**
   * Get shipments for an order
   * @param orderId - Order ID
   * @returns Array of shipments
   */
  async findByOrderId(orderId: string) {
    const shipmentsList = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .orderBy(desc(shipments.createdAt));

    return shipmentsList;
  }
}

