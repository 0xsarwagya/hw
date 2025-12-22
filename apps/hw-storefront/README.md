# HW Storefront

Modern Vite + React storefront application for VCEcom ecommerce platform.

## Features

- Product catalog with search and filtering
- Shopping cart with guest checkout support
- Multi-step checkout flow
- User authentication and account management
- Order tracking and history
- Bundle builder with custom UI
- Responsive design

## Tech Stack

- **Framework**: Vite + React 18
- **UI**: TailwindCSS, Lucide Icons
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

The storefront will be available at `http://localhost:3003`

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Razorpay Configuration (Public Key - Safe to expose)
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## Project Structure

```
apps/hw-storefront/
├── app/                    # React Router pages
│   ├── pages/              # Page components
│   └── components/         # Reusable components
├── lib/                    # Utilities and configurations
│   ├── api/               # API client
│   └── validations/       # Zod schemas
├── hooks/                 # React hooks
└── context/               # React context providers
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

# Preview production build
pnpm preview
```

## License

Private - Vestcodes
