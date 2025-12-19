/**
 * Helper functions for inventory reconciliation
 * Extracted from InventoryStore to improve readability and maintainability
 */

import { Redis } from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { KEY_PATTERNS } from "../constants/key-patterns";

export interface ReconciliationResult {
  released: number;
  inconsistencies: number;
  orphaned: number;
  negativeCorrections: number;
  variantsProcessed: number;
}

export interface ReservationInfo {
  cartId: string;
  quantity: number;
  key: string;
}

/**
 * Scan Redis for keys matching a pattern
 * Handles pagination automatically
 */
export async function scanKeys(
  client: Redis,
  pattern: string,
  count = 100,
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, foundKeys] = await client.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      count,
    );
    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== "0");

  return keys;
}

/**
 * Extract variant and cart ID from reservation key
 * Format: inventory:reservation:{cartId}:{variantId}
 */
export function parseReservationKey(key: string): {
  cartId: string;
  variantId: string;
} | null {
  const parts = key.split(":");
  if (parts.length !== 4 || parts[0] !== "inventory" || parts[1] !== "reservation") {
    return null;
  }

  return {
    cartId: parts[2],
    variantId: parts[3],
  };
}

/**
 * Extract variant ID from reserved key
 * Format: inventory:reserved:{variantId}
 */
export function parseReservedKey(key: string): string | null {
  const parts = key.split(":");
  if (parts.length !== 3 || parts[0] !== "inventory" || parts[1] !== "reserved") {
    return null;
  }

  return parts[2];
}

/**
 * Process orphaned reservations (reservations without TTL)
 * Returns map of variantId -> quantity to release
 */
export async function processOrphanedReservations(
  client: Redis,
  logger: PinoLogger,
  reservationKeys: string[],
): Promise<{ orphanedCount: number; releasesByVariant: Map<string, number> }> {
  const releasesByVariant = new Map<string, number>();
  let orphanedCount = 0;

  for (const key of reservationKeys) {
    const parsed = parseReservationKey(key);
    if (!parsed) {
      continue;
    }

    const { cartId, variantId } = parsed;
    const ttl = await client.ttl(key);

    if (ttl === -1) {
      // Orphaned reservation (no TTL)
      orphanedCount++;
      const quantityStr = await client.get(key);
      const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

      logger.warn(
        `Found orphaned reservation (no TTL): cart ${cartId}, variant ${variantId}, quantity ${quantity}`,
        {
          variantId,
          cartId,
          action: "orphaned",
          quantity,
        },
      );

      // Delete orphaned reservation
      await client.del(key);

      // Track for release
      const currentOrphaned = releasesByVariant.get(variantId) || 0;
      releasesByVariant.set(variantId, currentOrphaned + quantity);
    }
  }

  return { orphanedCount, releasesByVariant };
}

/**
 * Group valid reservations by variant ID
 */
export async function groupReservationsByVariant(
  client: Redis,
  reservationKeys: string[],
): Promise<Map<string, ReservationInfo[]>> {
  const variantReservations = new Map<string, ReservationInfo[]>();

  for (const key of reservationKeys) {
    const parsed = parseReservationKey(key);
    if (!parsed) {
      continue;
    }

    const { cartId, variantId } = parsed;
    const ttl = await client.ttl(key);

    // Skip orphaned reservations (they're handled separately)
    if (ttl === -1) {
      continue;
    }

    const quantityStr = await client.get(key);
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

    if (!variantReservations.has(variantId)) {
      variantReservations.set(variantId, []);
    }

    variantReservations.get(variantId)?.push({ cartId, quantity, key });
  }

  return variantReservations;
}

/**
 * Calculate total reserved quantity from reservations
 */
export function calculateTotalReservedFromReservations(
  reservations: ReservationInfo[],
): number {
  return reservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
}

/**
 * Reconcile variant reservations with aggregated count
 *
 * This function detects and fixes inconsistencies between:
 * - Individual reservation keys (inventory:reservation:{cartId}:{variantId})
 * - Aggregated reserved count (inventory:reserved:{variantId})
 *
 * Common causes of inconsistencies:
 * - Expired reservations that weren't properly released
 * - Redis failures during reservation release
 * - Negative counts from race conditions
 *
 * WARNING: This function modifies Redis state. Should be called within
 * a transaction or with proper error handling.
 */
export async function reconcileVariantReservations(
  client: Redis,
  logger: PinoLogger,
  variantId: string,
  reservations: ReservationInfo[],
  aggregatedReserved: number,
): Promise<{
  released: number;
  inconsistencies: number;
  negativeCorrections: number;
}> {
  let released = 0;
  let inconsistencies = 0;
  let negativeCorrections = 0;

  const totalFromReservations = calculateTotalReservedFromReservations(reservations);
  const reservationDifference = aggregatedReserved - totalFromReservations;

  if (reservationDifference > 0) {
    // Aggregated count is higher than sum of active reservations
    // This indicates expired reservations that weren't properly released
    // We need to decrement the aggregated count to match reality
    inconsistencies++;
    logger.warn(
      `Inconsistency detected for variant ${variantId}: aggregated=${aggregatedReserved}, reservations=${totalFromReservations}, difference=${reservationDifference}`,
      {
        variantId,
        aggregatedReserved,
        totalFromReservations,
        difference: reservationDifference,
        action: "correcting",
      },
    );

    // Decrement aggregated count to match actual reservations
    // This releases inventory that was incorrectly reserved
    await client.decrby(`inventory:reserved:${variantId}`, reservationDifference);
    released += reservationDifference;
  } else if (reservationDifference < 0) {
    // Aggregated count is lower than sum of reservations
    // This is unusual but can happen due to race conditions or manual adjustments
    // We increment to match the actual reservation count
    negativeCorrections++;
    const correction = Math.abs(reservationDifference);
    logger.warn(
      `Negative inconsistency for variant ${variantId}: correcting by ${correction}`,
      {
        variantId,
        aggregatedReserved,
        totalFromReservations,
        difference: correction,
        action: "negative_correction",
      },
    );

    await client.incrby(`inventory:reserved:${variantId}`, correction);
  }

  return { released, inconsistencies, negativeCorrections };
}

/**
 * Fix negative reserved count for a variant
 * Returns the number of corrections made
 */
export async function fixNegativeReservedCount(
  client: Redis,
  logger: PinoLogger,
  variantId: string,
  actualReserved: number,
): Promise<number> {
  if (actualReserved >= 0) {
    return 0;
  }

  await client.set(KEY_PATTERNS.INVENTORY_RESERVED(variantId), "0");
  logger.warn(
    `Fixed negative reserved count for variant ${variantId}: ${actualReserved} -> 0`,
    {
      variantId,
      action: "negative_correction",
      before: actualReserved,
      after: 0,
    },
  );

  return 1;
}

/**
 * Fix impossible state where reserved > total inventory
 * Returns the number of corrections made
 */
export async function fixImpossibleReservedState(
  client: Redis,
  logger: PinoLogger,
  variantId: string,
  actualReserved: number,
  totalInventory: number,
): Promise<number> {
  if (actualReserved <= totalInventory || totalInventory < 0) {
    return 0;
  }

  const after = totalInventory;
  await client.set(KEY_PATTERNS.INVENTORY_RESERVED(variantId), after.toString());
  logger.warn(
    `Fixed impossible state for variant ${variantId}: reserved ${actualReserved} > total ${totalInventory}, set to ${after}`,
    {
      variantId,
      action: "negative_correction",
      before: actualReserved,
      after,
    },
  );

  return 1;
}

/**
 * Fix inconsistency between expected and actual reserved counts
 * Returns reconciliation metrics
 */
export async function fixReservationInconsistency(
  client: Redis,
  logger: PinoLogger,
  variantId: string,
  expectedReserved: number,
  actualReserved: number,
): Promise<{ released: number; inconsistencies: number }> {
  if (expectedReserved === actualReserved) {
    return { released: 0, inconsistencies: 0 };
  }

  const delta = expectedReserved - actualReserved;
  await client.incrby(KEY_PATTERNS.INVENTORY_RESERVED(variantId), delta);
  const after = parseInt(
    (await client.get(KEY_PATTERNS.INVENTORY_RESERVED(variantId))) || "0",
    10,
  );

  const released = delta < 0 ? Math.abs(delta) : 0;

  logger.warn(
    `Fixed reservation inconsistency for variant ${variantId}: expected ${expectedReserved}, actual ${actualReserved}, corrected to ${after}`,
    {
      variantId,
      action: "fixed_inconsistency",
      before: actualReserved,
      after,
    },
  );

  return { released, inconsistencies: 1 };
}

/**
 * Release orphaned reservations for a variant
 * Returns the quantity released
 */
export async function releaseOrphanedReservations(
  client: Redis,
  logger: PinoLogger,
  variantId: string,
  orphanedQuantity: number,
  releaseInventoryFn: (variantId: string, quantity: number) => Promise<void>,
): Promise<number> {
  if (orphanedQuantity <= 0) {
    return 0;
  }

  const before = parseInt(
    (await client.get(KEY_PATTERNS.INVENTORY_RESERVED(variantId))) || "0",
    10,
  );
  await releaseInventoryFn(variantId, orphanedQuantity);
  const after = parseInt(
    (await client.get(KEY_PATTERNS.INVENTORY_RESERVED(variantId))) || "0",
    10,
  );

  logger.debug(
    `Released ${orphanedQuantity} orphaned reservation units for variant ${variantId}: ${before} -> ${after}`,
    {
      variantId,
      action: "released",
      before,
      after,
      quantity: orphanedQuantity,
    },
  );

  return orphanedQuantity;
}

