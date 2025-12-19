# Clean Code Guidelines

This document outlines the clean code practices and standards for the `@apps/backend` codebase. These guidelines ensure code is maintainable, readable, and follows industry best practices.

## Table of Contents

1. [General Rules](#general-rules)
2. [Design Rules](#design-rules)
3. [Naming Conventions](#naming-conventions)
4. [Function Guidelines](#function-guidelines)
5. [Comment Guidelines](#comment-guidelines)
6. [Code Structure](#code-structure)
7. [Objects and Data Structures](#objects-and-data-structures)
8. [Testing Standards](#testing-standards)
9. [Code Smells to Avoid](#code-smells-to-avoid)

## General Rules

### 1. Follow Standard Conventions
- Use TypeScript strict mode
- Follow NestJS conventions for modules, services, and controllers
- Use consistent file naming (kebab-case for files, PascalCase for classes)
- Follow established project structure

### 2. Keep It Simple (KISS)
- Prefer simple solutions over complex ones
- Reduce complexity as much as possible
- If a solution seems too complex, there's likely a simpler way

### 3. Boy Scout Rule
- Leave the codebase cleaner than you found it
- Fix small issues when you encounter them
- Refactor incrementally

### 4. Always Find Root Cause
- Don't just fix symptoms
- Understand why a problem exists before fixing it
- Document root causes in comments when non-obvious

## Design Rules

### 1. Keep Configurable Data at High Levels
- Store configuration in environment variables or config files
- Use constants for magic numbers (see `src/common/constants/`)
- Avoid hardcoding values in business logic

### 2. Prefer Polymorphism to Conditionals
- Use strategy pattern for different behaviors
- Replace large if/else chains with polymorphic solutions
- Use enums and type guards effectively
- **Example**: Price override types use strategy pattern (see `pricing/engine/override-strategies/`)
- **Note**: Don't over-engineer - simple if/else for 2-3 cases is fine

### 3. Separate Multi-threading Code
- Use async/await consistently
- Handle concurrency explicitly
- Use proper locking mechanisms for shared resources

### 4. Prevent Over-configurability
- Don't make everything configurable
- Balance flexibility with simplicity
- Use sensible defaults

### 5. Use Dependency Injection
- All services should use NestJS DI
- Avoid creating dependencies directly
- Use interfaces for testability

### 6. Follow Law of Demeter
- A class should only know about its direct dependencies
- Avoid chaining method calls: `obj.getA().getB().doSomething()`
- Extract chained calls into service methods

## Naming Conventions

### Variables and Functions
- Use descriptive, unambiguous names
- Use verb phrases for functions: `calculateTotal()`, `validateOrder()`
- Use noun phrases for variables: `orderTotal`, `customerId`
- Avoid abbreviations unless well-known (e.g., `id`, `url`, `http`)
- Use searchable names (avoid single letters except in loops)

### Constants
- Use UPPER_SNAKE_CASE: `MAX_PAGE_SIZE`, `DEFAULT_IMAGE_QUALITY`
- Group related constants in dedicated files
- Export from `src/common/constants/index.ts`

### Classes and Interfaces
- Use PascalCase: `OrderService`, `OrderResponseDto`
- Be specific: `OrderValidationService` not `ValidationService`
- Use descriptive suffixes: `Service`, `Controller`, `Dto`, `Entity`

### Files
- Match class name: `order-service.ts` → `OrderService`
- Use kebab-case for file names
- Group related files in directories

## Function Guidelines

### Size
- **Ideal**: Less than 20 lines
- **Maximum**: 50 lines
- Extract larger functions into smaller, focused functions

### Single Responsibility
- Each function should do one thing
- If you need "and" in the function description, split it
- Functions should have a single level of abstraction

### Arguments
- Prefer fewer arguments (0-2 is ideal)
- Use objects for 3+ arguments: `createOrder({ userId, items, address })`
- Avoid flag arguments - use separate methods instead

### Side Effects
- Prefer pure functions when possible
- Document side effects clearly
- Separate queries from commands

### Early Returns
- Use early returns to reduce nesting
- Fail fast with guard clauses
- Improve readability

### Example

```typescript
// ❌ Bad: Too long, multiple responsibilities
async processOrder(orderId: string) {
  const order = await this.getOrder(orderId);
  if (!order) throw new Error('Not found');
  const customer = await this.getCustomer(order.customerId);
  const address = await this.getAddress(order.shippingAddressId);
  const items = await this.getItems(orderId);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const gst = total * 0.18;
  const finalTotal = total + gst;
  await this.updateOrder(orderId, { total: finalTotal });
  await this.sendEmail(customer.email, order);
  return { order, total: finalTotal };
}

// ✅ Good: Small, focused functions
async processOrder(orderId: string): Promise<ProcessedOrder> {
  const order = await this.validateAndGetOrder(orderId);
  const orderTotal = await this.calculateOrderTotal(orderId);
  await this.updateOrderTotal(orderId, orderTotal);
  await this.notifyCustomer(order, orderTotal);
  return { order, total: orderTotal };
}

private async validateAndGetOrder(orderId: string): Promise<Order> {
  const order = await this.getOrder(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }
  return order;
}

private async calculateOrderTotal(orderId: string): Promise<number> {
  const items = await this.getOrderItems(orderId);
  const subtotal = this.calculateSubtotal(items);
  const gst = this.calculateGst(subtotal);
  return subtotal + gst;
}
```

## Comment Guidelines

### When to Comment
- **Explain "why"**, not "what"
- Document business logic and decisions
- Warn about consequences or side effects
- Clarify complex algorithms

### When NOT to Comment
- Don't restate what the code does
- Don't comment out code (use git history)
- Don't add noise comments
- Don't use closing brace comments

### Good Comments

```typescript
// ✅ Good: Explains why
// Use in-memory cache for ultra-fast access during high-traffic periods
// Falls back to database if cache is unavailable
const bundle = this.hotReloadWatcher.getCurrentBundle();

// ✅ Good: Warns about side effects
// WARNING: This method modifies Redis state and should be called
// within a transaction or with proper error handling
async reserveInventory(variantId: string, quantity: number) {
  // ...
}

// ✅ Good: Documents business logic
// GST calculation: Intra-state transactions use CGST+SGST (9%+9%),
// Inter-state transactions use IGST (18%)
const gstBreakdown = calculateGstBreakdown(subtotal, gstRate, sellerState, buyerState);
```

### Bad Comments

```typescript
// ❌ Bad: Restates what code does
// Get order by ID
const order = await this.getOrder(orderId);

// ❌ Bad: Obvious comment
// Increment counter
counter++;

// ❌ Bad: Commented-out code
// const oldValue = await this.getOldValue();
// await this.updateValue(newValue);
```

## Code Structure

### Vertical Organization
- Related code should appear vertically dense
- Dependent functions should be close together
- Similar functions should be grouped
- Variables declared close to usage
- High-level functions first, details below

### Import Organization
1. External libraries (`@nestjs/common`, `ioredis`)
2. Internal modules (`../common/...`)
3. Relative imports (`./dto/...`)

### Example

```typescript
// ✅ Good: Well-organized
import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { PinoLogger } from "nestjs-pino";

import { ContextService } from "../../common/logging/context.service";
import { OrderValidationService } from "./services/order-validation.service";

import { CreateOrderDto } from "./dto/create-order.dto";
```

## Objects and Data Structures

### Size
- Keep classes small (ideally < 300 lines)
- Limit instance variables (ideally < 5-7)
- Each class should have a single responsibility

### Data Hiding
- Hide internal structure
- Expose only necessary methods
- Use private/protected appropriately

### Avoid Hybrids
- Don't mix data structures with objects
- Prefer data structures (DTOs) for data transfer
- Use objects (services) for behavior

## Testing Standards

### Test Structure
- One assert per test (or related asserts)
- Use Arrange-Act-Assert pattern
- Tests should be readable and self-documenting

### Test Names
- Describe what is being tested
- Use format: `should [expected behavior] when [condition]`
- Example: `should throw NotFoundException when order does not exist`

### Test Independence
- Tests should not depend on each other
- No shared state between tests
- Use proper setup/teardown

### Example

```typescript
// ✅ Good: Clear, focused test
describe('OrderValidationService', () => {
  describe('getCustomerId', () => {
    it('should return customer ID when customer exists', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedCustomerId = 'customer-456';
      mockDb.select.mockResolvedValue([{ id: expectedCustomerId }]);

      // Act
      const result = await service.getCustomerId(userId);

      // Assert
      expect(result).toBe(expectedCustomerId);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      // Arrange
      const userId = 'user-123';
      mockDb.select.mockResolvedValue([]);

      // Act & Assert
      await expect(service.getCustomerId(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
```

## Code Smells to Avoid

### 1. Rigidity
- Code is difficult to change
- Small changes cause cascading effects
- **Solution**: Reduce coupling, improve abstractions

### 2. Fragility
- Code breaks in many places due to single change
- **Solution**: Improve encapsulation, reduce dependencies

### 3. Immobility
- Cannot reuse code due to high risk/effort
- **Solution**: Extract reusable components, reduce coupling

### 4. Needless Complexity
- Over-engineering simple problems
- **Solution**: YAGNI (You Aren't Gonna Need It), keep it simple

### 5. Needless Repetition (DRY)
- Duplicate code across files
- **Solution**: Extract common functionality, use utilities

### 6. Opacity
- Code is hard to understand
- **Solution**: Improve naming, add clarifying comments, simplify logic

## Constants Usage

All magic numbers and configuration values should be extracted to constants:

```typescript
// ✅ Good: Use constants
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../common/constants";

const limit = dto.limit || DEFAULT_PAGE_SIZE;
if (limit > MAX_PAGE_SIZE) {
  throw new BadRequestException(`Limit cannot exceed ${MAX_PAGE_SIZE}`);
}

// ❌ Bad: Magic numbers
const limit = dto.limit || 10;
if (limit > 100) {
  throw new BadRequestException('Limit cannot exceed 100');
}
```

## Service Refactoring Guidelines

### When to Extract Services
- Service file exceeds 500 lines (ideally < 300)
- Service has multiple distinct responsibilities
- Methods can be logically grouped

### Extraction Strategy
1. Identify distinct responsibilities
2. Create focused service classes
3. Use dependency injection
4. Maintain backward compatibility
5. Update module providers

### Example: Order Service Refactoring

**Before**: `orders.service.ts` (2661 lines)
- Order creation
- Order validation
- Order pricing
- Order status management
- Order timeline
- GST calculations

**After**: Extracted services
- `OrderValidationService` - Customer/address validation
- `OrderPricingService` - Price calculations
- `OrderStatusService` - Status transitions
- `OrderGstService` - GST breakdown
- `OrderTimelineService` - Timeline and tracking
- `OrdersService` - Orchestration (reduced to ~2309 lines)

## Code Review Checklist

When reviewing code, check:

- [ ] Functions are small and focused
- [ ] Names are descriptive and unambiguous
- [ ] No magic numbers (use constants)
- [ ] Comments explain "why" not "what"
- [ ] Code structure is logical and readable
- [ ] Tests follow clean code principles
- [ ] No code smells present
- [ ] Proper error handling
- [ ] Consistent formatting

## Resources

- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring by Martin Fowler](https://refactoring.com/)
- [NestJS Best Practices](https://docs.nestjs.com/)

## Dependency Injection & Configuration

### Configuration Management
- **Never** access `process.env` directly in services
- Use `AppConfigService` for all configuration access
- Configuration is centralized in `common/config/app.config.service.ts`
- All configurable data should be at high levels (environment variables, config files)

### Dependency Injection
- All services must use NestJS dependency injection
- Never create dependencies with `new` (except third-party clients)
- Inject `AppConfigService` instead of accessing environment variables
- Example:
  ```typescript
  // ✅ Good: Inject config service
  constructor(
    private readonly appConfigService: AppConfigService,
  ) {}
  
  getSellerState(): string {
    return this.appConfigService.getSellerState();
  }
  
  // ❌ Bad: Direct process.env access
  getSellerState(): string {
    return process.env.SELLER_STATE || "Maharashtra";
  }
  ```

## Polymorphism Patterns

### Strategy Pattern
Use strategy pattern when you have multiple ways to perform the same operation:

```typescript
// ✅ Good: Strategy pattern for price overrides
interface PriceOverrideStrategy {
  calculate(basePrice: number, overrideValue: number): number;
}

class FixedPriceOverrideStrategy implements PriceOverrideStrategy {
  calculate(basePrice: number, overrideValue: number): number {
    return overrideValue;
  }
}

class PercentagePriceOverrideStrategy implements PriceOverrideStrategy {
  calculate(basePrice: number, overrideValue: number): number {
    return basePrice * (1 - overrideValue / 100);
  }
}

function getOverrideStrategy(type: "FIXED" | "PERCENTAGE"): PriceOverrideStrategy {
  switch (type) {
    case "FIXED": return new FixedPriceOverrideStrategy();
    case "PERCENTAGE": return new PercentagePriceOverrideStrategy();
  }
}
```

### When NOT to Use Polymorphism
- Simple if/else with 2-3 cases is fine
- Don't over-engineer simple conditionals
- Use polymorphism when:
  - You have 4+ different behaviors
  - Behavior might change or extend
  - Each behavior has complex logic

## Architectural Decisions

### Service Extraction
Services are extracted when they exceed ~500 lines or have multiple distinct responsibilities:
- **OrderValidationService**: Customer and address validation
- **OrderPricingService**: Price list resolution and pricing engine execution
- **OrderStatusService**: Order status transitions
- **OrderGstService**: GST breakdown calculations
- **OrderTimelineService**: Timeline and tracking information

### Engine Pattern
Pure, deterministic engines are used for complex calculations:
- **PricingEngine**: Pure function for price calculations (no side effects)
- **DiscountEngine**: Pure function for discount application (no side effects)
- Engines never touch DB/Redis - all data must be pre-fetched
- Same input → same output (deterministic)

### Storage Provider Pattern
Storage providers use polymorphism with a common interface:
- **StorageProvider** interface defines contract
- **AwsS3Provider**, **SupabaseProvider**, **MinioProvider** implement interface
- StorageService selects provider at runtime
- Easy to add new providers without modifying existing code

## JSDoc Examples

### Complex Functions
Always document complex functions with JSDoc:

```typescript
/**
 * Calculate GST breakdown for an order
 * 
 * Determines if transaction is intra-state or inter-state and calculates appropriate GST:
 * - Intra-state: CGST (9%) + SGST (9%) = 18% total
 * - Inter-state: IGST (18%)
 * 
 * @param orderId - Order ID
 * @param shippingAddressId - Shipping address ID
 * @returns GST breakdown with CGST, SGST, IGST, total GST, and transaction type
 * @throws NotFoundException if order or address not found
 * 
 * @example
 * ```typescript
 * const breakdown = await orderGstService.calculateOrderGstBreakdown(
 *   "order-123",
 *   "address-456"
 * );
 * // Returns: { cgst: 90, sgst: 90, igst: 0, totalGst: 180, isIntraState: true }
 * ```
 */
async calculateOrderGstBreakdown(
  orderId: string,
  shippingAddressId: string,
): Promise<GstBreakdown> {
  // Implementation...
}
```

### Pure Functions
Document pure functions with input/output contracts:

```typescript
/**
 * Pure pricing engine
 *
 * This is a deterministic function: same input → same output
 * Never touches DB/Redis - all data must be pre-fetched
 *
 * Price calculation order:
 * 1. Base price (from product variant)
 * 2. Price list override (customer-specific pricing)
 * 3. Sale price (if active and scheduled)
 *
 * Sale price takes precedence over price list overrides when active.
 *
 * @param input - Pricing engine input with variants, price lists, and current date
 * @returns Pricing result with variant prices, totals, and applied price list IDs
 *
 * @example
 * ```typescript
 * const result = runPricingEngine({
 *   variants: [{ variantId: "v1", basePrice: 100, productId: "p1" }],
 *   priceLists: [],
 *   now: new Date(),
 * });
 * ```
 */
export function runPricingEngine(
  input: PricingEngineInput,
): PricingEngineResult {
  // Implementation...
}
```

## Questions?

If you have questions about these guidelines or need clarification, please:
1. Check existing code examples in the codebase
2. Ask in code review
3. Update this document with new patterns

