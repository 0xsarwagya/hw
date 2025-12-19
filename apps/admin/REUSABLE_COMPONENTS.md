# Reusable Components and Constants

This document outlines all reusable components and constants created to follow clean code principles and reduce duplication across the admin application.

## Reusable Components

### Common Components (`components/common/`)

#### 1. `SearchInput`
Reusable search input component with icon.

**Usage:**
```tsx
<SearchInput
  placeholder="Search customers..."
  value={searchInput}
  onChange={handleSearchChange}
  maxWidth="sm" // "sm" | "md" | "lg" | "full"
/>
```

#### 2. `TableActionsDropdown`
Reusable dropdown menu for table row actions (edit/delete).

**Usage:**
```tsx
<TableActionsDropdown
  editHref="/products/123/edit"
  onDelete={() => handleDelete(id)}
  editLabel="Edit"
  deleteLabel="Delete"
/>
```

#### 3. `CreateButton`
Reusable create button with consistent styling.

**Usage:**
```tsx
<CreateButton
  href="/products/create"
  label="Create Product"
  variant="default" // "default" | "outline"
/>
```

#### 4. `TableSkeleton`
Reusable table loading skeleton.

**Usage:**
```tsx
<TableSkeleton
  columns={5}
  rows={5}
  headers={["Name", "Email", "Phone", "Created", "Actions"]}
  showActions={true}
/>
```

#### 5. `EmptyState`
Reusable empty state component.

**Usage:**
```tsx
<EmptyState
  title="No products found"
  description="Create your first product to get started"
  actionLabel="Create Product"
  actionHref="/products/create"
/>
```

#### 6. `PaginationControls`
Reusable pagination controls (already existed, documented here).

**Usage:**
```tsx
<PaginationControls
  paginationInfo={paginationInfo}
  onPreviousPage={handlePrevious}
  onNextPage={handleNext}
  canGoPrevious={canGoPrevious}
  canGoNext={canGoNext}
  isLoading={isLoading}
  itemLabel="products"
/>
```

#### 7. `QueryState`
Reusable component for handling loading, error, and empty states (already existed, documented here).

**Usage:**
```tsx
<QueryState
  isLoading={isLoading}
  error={error}
  data={data}
  loadingComponent={<TableSkeleton columns={5} />}
  emptyComponent={<EmptyState title="No data" />}
>
  <DataTable data={data} />
</QueryState>
```

#### 8. `ActionButtonGroup`
Reusable component for groups of action buttons (e.g., Approve/Reject/Delete).

**Usage:**
```tsx
<ActionButtonGroup
  actions={[
    {
      icon: <Check className="h-4 w-4" />,
      onClick: () => handleApprove(id),
      isLoading: isApproving,
      disabled: isProcessing,
      title: "Approve",
    },
    {
      icon: <X className="h-4 w-4" />,
      onClick: () => handleReject(id),
      isLoading: isRejecting,
      disabled: isProcessing,
      title: "Reject",
    },
  ]}
/>
```

#### 9. `StatusBadge`
Reusable status badge component with automatic variant mapping.

**Usage:**
```tsx
<StatusBadge status="active" />
<StatusBadge status="pending" variant="secondary" />
```

#### 10. `RatingDisplay`
Reusable star rating display component.

**Usage:**
```tsx
<RatingDisplay rating={4.5} maxRating={5} showValue={true} />
```

#### 11. `LoadingButton`
Reusable button component with loading state.

**Usage:**
```tsx
<LoadingButton
  isLoading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save
</LoadingButton>
```

#### 12. `BackButton`
Reusable back navigation button.

**Usage:**
```tsx
<BackButton href="/products" label="Back to Products" />
```

## Reusable Hooks

### Custom Hooks (`hooks/`)

#### 1. `useDebounce`
Hook for debouncing values (useful for search inputs).

**Usage:**
```tsx
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // API call with debouncedSearch
}, [debouncedSearch]);
```

#### 2. `useDeleteConfirmation`
Hook for managing delete confirmation dialog state.

**Usage:**
```tsx
const deleteMutation = useAdminDeleteProduct();
const {
  deleteDialogOpen,
  itemToDelete,
  handleDeleteClick,
  handleDeleteConfirm,
  handleDeleteCancel,
} = useDeleteConfirmation(async (id) => {
  await deleteMutation.mutateAsync(id);
});

<ConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={handleDeleteCancel}
  onConfirm={handleDeleteConfirm}
  ...
/>
```

#### 3. `usePagination`
Hook for pagination logic (already existed, documented here).

**Usage:**
```tsx
const pagination = usePagination(data, handlePageChange);
```

#### 4. `useFilterSync`
Hook for synchronizing filters with URL (already existed, documented here).

**Usage:**
```tsx
useFilterSync(filters, router, "/products");
```

## Constants

### Common Constants (`lib/constants/common.constants.ts`)

```typescript
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_LIMIT_LARGE = 20;
export const DEBOUNCE_DELAY_MS = 300;
export const SKELETON_ROW_COUNT = 5;
export const URL_TRUNCATE_LENGTH = 50;
```

### Page-Specific Constants

#### Products (`products.constants.ts`)
- Product-related constants
- Wizard steps and messages

#### Orders (`orders.constants.ts`)
- Order-related constants
- Order status labels

#### Customers (`customers.constants.ts`)
- Customer pagination defaults
- Empty state messages

#### Reviews (`reviews.constants.ts`)
- Review pagination defaults
- Empty state messages
- Delete dialog messages
- Max rating constant

#### Bundles (`bundles.constants.ts`)
- Bundle pagination defaults
- Empty state messages
- Delete dialog messages

#### Price Lists (`price-lists.constants.ts`)
- Empty state messages
- Delete dialog messages

#### Storage (`storage.constants.ts`)
- Debounce delay
- URL truncate length
- Image extensions
- Empty state messages
- Delete dialog messages

#### Categories (`categories.constants.ts`)
- Empty state messages
- Delete dialog messages

#### Discounts (`discounts.constants.ts`)
- Discount pagination defaults
- Empty state messages
- Delete dialog messages

## Benefits

1. **Consistency** - All pages use the same components and styling
2. **Maintainability** - Changes to common patterns only need to be made once
3. **Reusability** - Components can be easily reused across pages
4. **Type Safety** - All components are fully typed with TypeScript
5. **Clean Code** - Follows DRY principle and single responsibility
6. **Performance** - Optimized components reduce bundle size

## Usage Examples

### Example: Refactored Customers Page

**Before:**
```tsx
<div className="relative flex-1 max-w-sm">
  <Search className="absolute left-2 top-2.5 h-4 w-4" />
  <Input
    placeholder="Search customers..."
    value={search}
    onChange={(e) => handleSearch(e.target.value)}
    className="pl-8"
  />
</div>
```

**After:**
```tsx
<SearchInput
  placeholder="Search customers..."
  value={searchInput}
  onChange={handleSearchChange}
/>
```

### Example: Delete Confirmation Pattern

**Before:**
```tsx
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<string | null>(null);

const handleDeleteClick = (id: string) => {
  setItemToDelete(id);
  setDeleteDialogOpen(true);
};

const handleDeleteConfirm = async () => {
  if (itemToDelete) {
    await deleteMutation.mutateAsync(itemToDelete);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }
};
```

**After:**
```tsx
const {
  deleteDialogOpen,
  itemToDelete,
  handleDeleteClick,
  handleDeleteConfirm,
  handleDeleteCancel,
} = useDeleteConfirmation(async (id) => {
  await deleteMutation.mutateAsync(id);
});
```

### Example: Action Buttons

**Before:**
```tsx
<div className="flex gap-2">
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleApprove(id)}
    disabled={isProcessing}
  >
    {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
  </Button>
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleReject(id)}
    disabled={isProcessing}
  >
    {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
  </Button>
</div>
```

**After:**
```tsx
<ActionButtonGroup
  actions={[
    {
      icon: <Check className="h-4 w-4" />,
      onClick: () => handleApprove(id),
      isLoading: isApproving,
      disabled: isProcessing,
    },
    {
      icon: <X className="h-4 w-4" />,
      onClick: () => handleReject(id),
      isLoading: isRejecting,
      disabled: isProcessing,
    },
  ]}
/>
```

## Import Paths

### Components
```tsx
import {
  SearchInput,
  TableActionsDropdown,
  CreateButton,
  TableSkeleton,
  EmptyState,
  PaginationControls,
  QueryState,
  ActionButtonGroup,
  StatusBadge,
  RatingDisplay,
  LoadingButton,
  BackButton,
} from "@/components/common";
```

### Constants
```tsx
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/lib/constants";
import { CUSTOMER_DEFAULT_PAGE } from "@/lib/constants/customers.constants";
```

### Hooks
```tsx
import { useDebounce } from "@/hooks/use-debounce";
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation";
```
