# VCEcom Storefront

Modern Next.js 15 storefront application for VCEcom ecommerce platform.

## Features

- Product catalog with search and filtering
- Shopping cart with guest checkout support
- Multi-step checkout flow
- User authentication and account management
- Order tracking and history
- Responsive design with dark mode support

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TailwindCSS v4, Shadcn/UI
- **State Management**: React Query (TanStack Query)
- **Validation**: Zod
- **API**: REST API integration with backend

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The storefront will be available at `http://localhost:3002`

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Razorpay Configuration (Public Key - Safe to expose)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
```

**Note**: The Razorpay key ID is the public key and is safe to expose in the frontend. The secret key and webhook secret are configured in the backend only.

## Project Structure

```
apps/storefront/
├── app/                    # Next.js App Router pages
│   ├── products/          # Product listing and detail
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── auth/              # Authentication pages
│   └── account/           # User account pages
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── products/         # Product-related components
│   ├── cart/             # Cart components
│   └── layout/           # Layout components
├── hooks/                # React hooks
├── lib/                  # Utilities and configurations
│   ├── api/             # API client
│   └── validations/      # Zod schemas
└── public/              # Static assets
```

## API Integration

All API calls are made to `/store/*` endpoints on the backend (port 3001).

The API client automatically:
- Adds JWT tokens from localStorage for authenticated requests
- Adds guest session ID header for cart/checkout operations
- Validates responses with Zod schemas

## Development

```bash
# Type checking
pnpm check-types

# Build for production
pnpm build

# Start production server
pnpm start
```

## License

Private - Vestcodes

