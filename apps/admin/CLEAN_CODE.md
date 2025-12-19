# Clean Code Guidelines for Admin App

This document outlines the folder structure, conventions, and clean code practices used in the admin application.

## Folder Structure

```
apps/admin/
├── app/                    # Next.js App Router pages
│   ├── (admin)/            # Admin route group
│   │   ├── products/       # Product-related pages
│   │   ├── orders/         # Order-related pages
│   │   └── ...             # Other feature pages
│   ├── api/                # API route handlers
│   ├── layout.tsx          # Root layout with providers
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Layout components (sidebar, topbar, etc.)
│   ├── products/           # Product-specific components
│   ├── orders/             # Order-specific components
│   ├── common/             # Shared/common components
│   └── skeletons/          # Loading skeleton components
├── hooks/                  # Custom React hooks
│   ├── products/           # Product-related hooks
│   ├── orders/             # Order-related hooks
│   └── ...                 # Other feature hooks
├── lib/                    # Utility libraries
│   ├── api.ts              # API client
│   ├── auth.ts             # Authentication utilities
│   ├── endpoints.ts        # API endpoint definitions
│   ├── types/              # TypeScript type definitions
│   └── validations/        # Zod validation schemas
└── providers/              # React context providers
```

## Naming Conventions

### Components
- Use PascalCase: `ProductCard.tsx`, `OrderHeader.tsx`
- Be descriptive: `ProductStatusBadge` not `StatusBadge`
- Prefix shared components: `AdminPageLayout`, `AdminShell`

### Hooks
- Start with `use`: `useAdminProducts`, `usePagination`
- Be specific: `useAdminProduct` not `useProduct` (to avoid conflicts)
- Group by feature: `hooks/products/`, `hooks/orders/`

### Files
- Match component/hook name: `product-card.tsx` → `ProductCard`
- Use kebab-case for file names
- Use `.ts` for utilities, `.tsx` for components

### Variables and Functions
- Use camelCase: `productFilters`, `handleStatusChange`
- Be descriptive: `fetchHomepageData` not `hp`
- Use verbs for functions: `getUser`, `updateProduct`, `deleteOrder`
- Use nouns for variables: `productList`, `orderStatus`

## Code Organization Principles

### 1. Component-Based Structure
- Each feature has its own folder under `components/`
- Components are self-contained and reusable
- Separate "dumb" (presentational) and "smart" (container) components

### 2. Custom Hooks for Reusability
- Extract repeated logic into custom hooks
- Hooks live in `hooks/` organized by feature
- Use hooks for API calls, state management, and side effects

### 3. DRY (Don't Repeat Yourself)
- Extract common patterns into reusable hooks/components
- Use shared utilities in `lib/utils.ts`
- Create common components for repeated UI patterns

### 4. TypeScript First
- All components have proper TypeScript interfaces
- Use types from `lib/types/` for API responses
- Avoid `any` types - use `unknown` if type is truly unknown

## Best Practices

### Functional Components
- Always use functional components with hooks
- Class components only for ErrorBoundary (if needed)

### Conditional Rendering
- Prefer early returns over nested ternaries
- Extract complex conditionals into separate components
- Use short-circuit evaluation for simple cases

### Code Splitting
- Use `React.lazy()` for heavy components
- Wrap lazy components in `Suspense` with fallbacks
- Lazy load routes and large feature components

### State Management
- Use React Query for server state
- Use `useState` for local component state
- Use Context API for shared state (avoid prop drilling)

### Styling
- Use Tailwind CSS utility classes
- Avoid inline styles
- Use CSS modules only if needed for complex animations

### Comments
- Add JSDoc comments to complex functions
- Comment business logic that isn't self-explanatory
- Avoid obvious comments that restate the code

## Example Patterns

### Custom Hook Pattern
```tsx
// hooks/products/use-admin-products.ts
export function useAdminProducts(params?: ProductQueryParams) {
  return useApiQuery<PaginatedProductsResponse>(endpoints.products.list, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}
```

### Component Pattern
```tsx
// components/products/product-card.tsx
interface ProductCardProps {
  product: Product;
  thumbnail?: string;
}

export function ProductCard({ product, thumbnail }: ProductCardProps) {
  return (
    <Card>
      {/* Component content */}
    </Card>
  );
}
```

### Conditional Rendering Pattern
```tsx
// Good: Early returns
if (isLoading) return <Skeleton />;
if (error) return <ErrorDisplay error={error} />;
if (!data) return <EmptyState />;
return <Content data={data} />;

// Avoid: Nested ternaries
{isLoading ? <Skeleton /> : error ? <Error /> : data ? <Content /> : <Empty />}
```

## Code Review Checklist

- [ ] Components are functional and use hooks
- [ ] TypeScript types are properly defined
- [ ] No repeated code that could be extracted
- [ ] Conditional rendering is clear and readable
- [ ] Heavy components are lazy loaded
- [ ] Variable and function names are descriptive
- [ ] Comments are minimal and meaningful
- [ ] No inline styles (use Tailwind)
- [ ] Custom hooks are used for reusable logic
- [ ] Error and loading states are handled

