import { Injectable, Logger } from "@nestjs/common";
import { and, db, desc, eq, gte } from "@vcecom/db";
import {
  pincodes,
  shippingRules,
  shippingZoneRates,
  stateShippingRules,
} from "@vcecom/db/src/schema";
import {
  checkPincodeServiceability,
  getShippingRateByZone,
  ServiceabilityResult,
} from "../../common/utils/pincode.utils";

export interface ShippingCalculation {
  baseRate: number;
  additionalCharges: number;
  codCharge?: number;
  totalRate: number;
  estimatedDays: number;
  isCodAvailable: boolean;
  zone: string;
}

export interface ShippingRateRequest {
  pincode: string;
  weight: number; // in grams
  isCod?: boolean;
}

@Injectable()
export class ShippingRulesService {
  private readonly logger = new Logger(ShippingRulesService.name);

  /**
   * Check if a PIN code is serviceable and get shipping details
   */
  async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    try {
      // First try to get data from database
      const pincodeData = await db
        .select({
          pincode: pincodes.pincode,
          state: pincodes.state,
          district: pincodes.district,
          city: pincodes.officeName,
          isServiceable: pincodes.isServiceable,
          codAvailable: pincodes.codAvailable,
          shippingZone: pincodes.shippingZone,
          estimatedDeliveryDays: pincodes.estimatedDeliveryDays,
        })
        .from(pincodes)
        .where(eq(pincodes.pincode, pincode))
        .limit(1);

      if (pincodeData.length > 0) {
        const data = pincodeData[0];
        return {
          isValid: true,
          isServiceable: data.isServiceable,
          codAvailable: data.codAvailable,
          shippingZone: data.shippingZone,
          state: data.state,
          district: data.district,
          city: data.city,
        };
      }

      // Fallback to utility function if not in database
      this.logger.warn(
        `PIN code ${pincode} not found in database, using fallback logic`,
      );
      return await checkPincodeServiceability(pincode);
    } catch (error) {
      this.logger.error(
        `Error checking serviceability for PIN code ${pincode}:`,
        error,
      );
      // Fallback to utility function on error
      return await checkPincodeServiceability(pincode);
    }
  }

  /**
   * Calculate shipping rates based on PIN code and weight
   */
  async calculateShippingRate(
    request: ShippingRateRequest,
  ): Promise<ShippingCalculation> {
    const { pincode, weight, isCod = false } = request;

    // Check serviceability first
    const serviceability = await this.checkServiceability(pincode);

    if (!serviceability.isValid || !serviceability.isServiceable) {
      throw new Error(`PIN code ${pincode} is not serviceable`);
    }

    const zone = serviceability.shippingZone;

    // Get zone-based rates from database
    const zoneRates = await db
      .select()
      .from(shippingZoneRates)
      .where(
        and(
          eq(shippingZoneRates.zone, zone),
          eq(shippingZoneRates.isActive, true),
          gte(shippingZoneRates.minWeight, 0),
        ),
      )
      .orderBy(desc(shippingZoneRates.minWeight))
      .limit(1);

    let baseRate: number;
    let additionalPerKg: number;
    let estimatedDays: number;
    let codCharge: number | undefined;

    if (zoneRates.length > 0) {
      const rate = zoneRates[0];
      baseRate = rate.baseRate;
      additionalPerKg = rate.additionalPerKg || 0;
      estimatedDays = rate.estimatedDays;
      codCharge = rate.codCharge ?? undefined;

      // Check if weight exceeds max weight for this rate
      if (rate.maxWeight && weight > rate.maxWeight) {
        // Calculate additional charges
        const excessWeight = weight - rate.maxWeight;
        const additionalCharges =
          Math.ceil(excessWeight / 1000) * additionalPerKg;
        baseRate += additionalCharges;
      }
    } else {
      // Fallback to utility function
      baseRate = getShippingRateByZone(zone, weight) || 100;
      estimatedDays = zone === "metro" ? 2 : zone === "zone_a" ? 3 : 5;
    }

    // Check state-specific rules
    const stateRules = await db
      .select()
      .from(stateShippingRules)
      .where(
        and(
          eq(stateShippingRules.state, serviceability.state || ""),
          eq(stateShippingRules.isActive, true),
        ),
      )
      .limit(1);

    let additionalDays = 0;
    if (stateRules.length > 0) {
      additionalDays = stateRules[0].additionalDays;
      if (isCod && stateRules[0].codCharge) {
        codCharge = stateRules[0].codCharge;
      }
      // Override COD availability if state rule specifies it
      if (!stateRules[0].codAvailable) {
        serviceability.codAvailable = false;
      }
    }

    // Calculate total
    const codChargeAmount =
      isCod && serviceability.codAvailable && codCharge ? codCharge : 0;
    const totalRate = baseRate + codChargeAmount;

    return {
      baseRate,
      additionalCharges: 0, // Additional charges are already included in baseRate
      codCharge: codChargeAmount,
      totalRate,
      estimatedDays: estimatedDays + additionalDays,
      isCodAvailable: serviceability.codAvailable,
      zone,
    };
  }

  /**
   * Get all active shipping rules
   */
  async getShippingRules() {
    return await db
      .select()
      .from(shippingRules)
      .where(eq(shippingRules.isActive, true))
      .orderBy(desc(shippingRules.priority));
  }

  /**
   * Get shipping zone rates
   */
  async getShippingZoneRates() {
    return await db
      .select()
      .from(shippingZoneRates)
      .where(eq(shippingZoneRates.isActive, true))
      .orderBy(shippingZoneRates.zone, shippingZoneRates.minWeight);
  }

  /**
   * Get state shipping rules
   */
  async getStateShippingRules() {
    return await db
      .select()
      .from(stateShippingRules)
      .where(eq(stateShippingRules.isActive, true))
      .orderBy(stateShippingRules.state);
  }

  /**
   * Bulk check serviceability for multiple PIN codes
   */
  async checkBulkServiceability(
    pincodeList: string[],
  ): Promise<Map<string, ServiceabilityResult>> {
    const results = new Map<string, ServiceabilityResult>();

    // Get data from database first
    const dbResults = await db
      .select({
        pincode: pincodes.pincode,
        state: pincodes.state,
        district: pincodes.district,
        city: pincodes.officeName,
        isServiceable: pincodes.isServiceable,
        codAvailable: pincodes.codAvailable,
        shippingZone: pincodes.shippingZone,
      })
      .from(pincodes)
      .where(and(...pincodeList.map((pin) => eq(pincodes.pincode, pin))));

    // Create map of database results
    const dbMap = new Map(dbResults.map((result) => [result.pincode, result]));

    // Process each PIN code
    for (const pincode of pincodeList) {
      if (dbMap.has(pincode)) {
        const data = dbMap.get(pincode) as NonNullable<
          ReturnType<typeof dbMap.get>
        >;
        results.set(pincode, {
          isValid: true,
          isServiceable: data.isServiceable,
          codAvailable: data.codAvailable,
          shippingZone: data.shippingZone,
          state: data.state,
          district: data.district,
          city: data.city,
        });
      } else {
        // Fallback to utility function
        const result = await checkPincodeServiceability(pincode);
        results.set(pincode, result);
      }
    }

    return results;
  }

  /**
   * Validate PIN code format and basic rules
   */
  validatePincodeFormat(pincode: string): boolean {
    if (!pincode || typeof pincode !== "string") {
      return false;
    }

    const cleaned = pincode.trim().replace(/\s+/g, "");

    // Must be exactly 6 digits
    if (cleaned.length !== 6) {
      return false;
    }

    // Must be all digits
    const pincodePattern = /^\d{6}$/;
    return pincodePattern.test(cleaned);
  }

  /**
   * Get shipping zones available
   */
  getAvailableShippingZones(): string[] {
    return ["metro", "zone_a", "zone_b", "zone_c", "zone_d", "zone_e"];
  }
}
