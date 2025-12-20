import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ChargeType,
  db,
  eq,
  PaymentMethod,
  paymentMethodCharges,
} from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { PaymentChargeService } from "../payments/services/payment-charge.service";
import {
  CreatePaymentChargeDto,
  UpdatePaymentChargeDto,
} from "./dto/payment-charges.dto";

@Injectable()
export class PaymentChargesService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly paymentChargeService: PaymentChargeService,
  ) {}

  async findAll() {
    return db
      .select()
      .from(paymentMethodCharges)
      .orderBy(paymentMethodCharges.method);
  }

  async findOne(id: string) {
    const [charge] = await db
      .select()
      .from(paymentMethodCharges)
      .where(eq(paymentMethodCharges.id, id))
      .limit(1);

    if (!charge) {
      throw new NotFoundException(`Payment charge with ID ${id} not found`);
    }

    return charge;
  }

  async create(dto: CreatePaymentChargeDto) {
    // Validate charge type specific fields
    this.validateChargeType(dto);

    const [charge] = await db
      .insert(paymentMethodCharges)
      .values({
        method: dto.method as unknown as PaymentMethod,
        chargeType: dto.chargeType as unknown as ChargeType,
        flatAmount: dto.flatAmount,
        percentage: dto.percentage,
        mixCap: dto.mixCap ?? null,
        mixMin: dto.mixMin ?? null,
        isTaxable: dto.isTaxable ?? false,
        currency: dto.currency ?? "INR",
        codMaxAmount: dto.codMaxAmount ?? null,
        codDisallowHighValue: dto.codDisallowHighValue ?? false,
        codDisallowDigital: dto.codDisallowDigital ?? true,
        codDisallowPreorder: dto.codDisallowPreorder ?? true,
        active: dto.active ?? true,
      })
      .returning();

    this.logger.info(
      { chargeId: charge.id, method: charge.method },
      "Payment charge created",
    );

    return charge;
  }

  async update(id: string, dto: UpdatePaymentChargeDto) {
    const existing = await this.findOne(id);

    // If charge type is being updated, validate the new type
    if (dto.chargeType && dto.chargeType !== existing.chargeType) {
      this.validateChargeType({
        chargeType: dto.chargeType,
        flatAmount: dto.flatAmount ?? existing.flatAmount,
        percentage: dto.percentage ?? existing.percentage,
        mixCap: dto.mixCap ?? existing.mixCap ?? undefined,
        mixMin: dto.mixMin ?? existing.mixMin ?? undefined,
      } as CreatePaymentChargeDto);
    }

    const [updated] = await db
      .update(paymentMethodCharges)
      .set({
        ...(dto.chargeType && {
          chargeType: dto.chargeType as unknown as ChargeType,
        }),
        ...(dto.flatAmount !== undefined && { flatAmount: dto.flatAmount }),
        ...(dto.percentage !== undefined && { percentage: dto.percentage }),
        ...(dto.mixCap !== undefined && { mixCap: dto.mixCap }),
        ...(dto.mixMin !== undefined && { mixMin: dto.mixMin }),
        ...(dto.isTaxable !== undefined && { isTaxable: dto.isTaxable }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.codMaxAmount !== undefined && {
          codMaxAmount: dto.codMaxAmount,
        }),
        ...(dto.codDisallowHighValue !== undefined && {
          codDisallowHighValue: dto.codDisallowHighValue,
        }),
        ...(dto.codDisallowDigital !== undefined && {
          codDisallowDigital: dto.codDisallowDigital,
        }),
        ...(dto.codDisallowPreorder !== undefined && {
          codDisallowPreorder: dto.codDisallowPreorder,
        }),
        ...(dto.active !== undefined && { active: dto.active }),
        updatedAt: new Date(),
      })
      .where(eq(paymentMethodCharges.id, id))
      .returning();

    this.logger.info(
      { chargeId: id, method: updated.method },
      "Payment charge updated",
    );

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id); // Throws if not found

    await db
      .delete(paymentMethodCharges)
      .where(eq(paymentMethodCharges.id, id));

    this.logger.info({ chargeId: id }, "Payment charge deleted");

    return { success: true };
  }

  async previewFee(chargeId: string, cartTotal: number) {
    const charge = await this.findOne(chargeId);

    const { fee, breakdown } = await this.paymentChargeService.calculateFee(
      charge.method,
      cartTotal,
      charge.currency,
    );

    return {
      charge,
      cartTotal,
      fee,
      breakdown,
      feeInRupees: fee / 100,
    };
  }

  private validateChargeType(dto: {
    chargeType: string;
    flatAmount: number;
    percentage: number;
    mixCap?: number;
    mixMin?: number;
  }) {
    if (dto.chargeType === "FLAT") {
      if (dto.flatAmount <= 0) {
        throw new BadRequestException(
          "Flat amount must be greater than 0 for FLAT charge type",
        );
      }
    } else if (dto.chargeType === "PERCENTAGE") {
      if (dto.percentage <= 0) {
        throw new BadRequestException(
          "Percentage must be greater than 0 for PERCENTAGE charge type",
        );
      }
    } else if (dto.chargeType === "MIXED") {
      if (dto.percentage <= 0) {
        throw new BadRequestException(
          "Percentage must be greater than 0 for MIXED charge type",
        );
      }
      if (dto.mixCap !== undefined && dto.mixMin !== undefined) {
        if (dto.mixCap < dto.mixMin) {
          throw new BadRequestException(
            "Mix cap must be greater than or equal to mix min",
          );
        }
      }
    }
  }
}
