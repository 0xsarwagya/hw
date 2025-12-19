# Backend API

NestJS REST API backend for VCEcom ecommerce platform.

## 🏗️ Architecture

### Modular Structure
The backend follows NestJS modular architecture with clear separation of concerns:

- **Modules**: Feature-based modules (orders, products, customers, etc.)
- **Services**: Business logic and orchestration
- **Controllers**: HTTP request handling and validation
- **DTOs**: Data transfer objects for request/response validation
- **Engines**: Pure, deterministic calculation engines (pricing, discounts)

### Key Architectural Patterns

#### Service Extraction
Large services are broken down into focused, single-responsibility services:
- `OrderValidationService` - Customer and address validation
- `OrderPricingService` - Price list resolution and pricing engine execution
- `OrderStatusService` - Order status transitions
- `OrderGstService` - GST breakdown calculations
- `OrderTimelineService` - Timeline and tracking information

#### Engine Pattern
Pure, deterministic engines for complex calculations:
- **PricingEngine**: Pure function for price calculations (no side effects)
- **DiscountEngine**: Pure function for discount application (no side effects)
- Engines never touch DB/Redis - all data must be pre-fetched
- Same input → same output (deterministic)

#### Strategy Pattern
Polymorphism over conditionals for extensible behavior:
- **Price Override Strategies**: Different calculation methods for FIXED vs PERCENTAGE overrides
- **Storage Providers**: Polymorphic storage implementations (AWS S3, Supabase, MinIO)
- Easy to extend without modifying existing code

#### Dependency Injection
All services use NestJS dependency injection:
- Configuration via `AppConfigService` (never access `process.env` directly)
- Services inject dependencies through constructors
- Follows Law of Demeter (services only know about direct dependencies)

## 📁 Project Structure

```
src/
├── common/                    # Shared utilities and common code
│   ├── config/               # Configuration service
│   ├── constants/            # Application constants
│   ├── logging/             # Logging utilities
│   └── utils/                # Utility functions
├── modules/                   # Feature modules
│   ├── orders/              # Order management
│   │   ├── services/        # Extracted order services
│   │   └── dto/             # Order DTOs
│   ├── products/            # Product catalog
│   ├── customers/           # Customer management
│   ├── discounts/           # Discount engine
│   │   └── engine/          # Pure discount calculation engine
│   ├── pricing/             # Pricing engine
│   │   └── engine/          # Pure pricing calculation engine
│   └── ...
└── main.ts                   # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL
- Redis (for caching and inventory management)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start:prod
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

## 📚 Code Quality

### Clean Code Guidelines
This project follows clean code principles. See [CLEAN_CODE_GUIDELINES.md](./CLEAN_CODE_GUIDELINES.md) for detailed guidelines.

Key principles:
- **Small functions**: Functions should be < 20 lines (max 50)
- **Single responsibility**: Each function/class does one thing
- **Descriptive names**: Names should be self-documenting
- **No magic numbers**: Use constants from `common/constants/`
- **Dependency injection**: Never create dependencies directly
- **Polymorphism over conditionals**: Use strategy pattern where appropriate

### Linting and Formatting

```bash
# Check code quality
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

## 🔧 Configuration

Configuration is managed through `AppConfigService` (never access `process.env` directly):

```typescript
// ✅ Good: Inject config service
constructor(private readonly appConfigService: AppConfigService) {}

getSellerState(): string {
  return this.appConfigService.getSellerState();
}

// ❌ Bad: Direct process.env access
getSellerState(): string {
  return process.env.SELLER_STATE || "Maharashtra";
}
```

### Environment Variables

Key environment variables (see `.env.example` for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `SELLER_STATE` - Seller state for GST calculations
- `STORAGE_PROVIDER` - Storage provider (aws, supabase, minio)

## 📖 API Documentation

API documentation is available via Swagger UI when running in development mode:
- Swagger UI: `http://localhost:3000/api`

## 🏛️ Key Features

### GST Integration
- Native CGST/SGST/IGST calculation
- Intra-state vs inter-state transaction detection
- GST breakdown in order responses

### Order Management
- Complete order lifecycle management
- Idempotent order creation
- Order status state machine
- Order timeline and tracking

### Pricing Engine
- Customer-specific price lists
- Price overrides (FIXED and PERCENTAGE)
- Sale price management
- Pure, deterministic calculations

### Discount Engine
- Product-level discounts
- Cart-level discounts
- Tiered pricing
- BOGO (Buy X Get Y) discounts
- Conflict resolution and stacking rules

### Inventory Management
- Redis-based inventory reservations
- Cart expiration handling
- Inventory reconciliation

## 🔍 Code Examples

### Creating a Service

```typescript
import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../common/config/app.config.service";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class MyService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly appConfigService: AppConfigService,
  ) {}

  async doSomething(): Promise<void> {
    // Use injected dependencies
    const config = this.appConfigService.getSellerState();
    this.logger.info("Doing something", { config });
  }
}
```

### Using Constants

```typescript
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../common/constants";

const limit = dto.limit || DEFAULT_PAGE_SIZE;
if (limit > MAX_PAGE_SIZE) {
  throw new BadRequestException(`Limit cannot exceed ${MAX_PAGE_SIZE}`);
}
```

### Pure Function Example

```typescript
/**
 * Pure function: same input → same output
 * Never touches DB/Redis
 */
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

## 🤝 Contributing

When contributing to this codebase:

1. Follow the [Clean Code Guidelines](./CLEAN_CODE_GUIDELINES.md)
2. Write tests for new functionality
3. Use descriptive commit messages
4. Keep functions small and focused
5. Use dependency injection
6. Document complex logic with JSDoc

## 📝 License

See [LICENSE](../../LICENSE) file.

