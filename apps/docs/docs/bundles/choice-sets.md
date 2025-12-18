# Choice Sets

## Overview

Choice sets define groups of products that customers can choose from when building a bundle. Each bundle can have multiple choice sets.

## Choice Set Structure

```typescript
interface BundleSet {
  id: string;
  bundleId: string;
  title: string;
  description?: string;
  minQuantity: number; // Required picks (0-15)
  maxQuantity: number; // Allowed picks (1-15)
  sortOrder: number; // Display order
  items: BundleSetItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Quantity Constraints

### Min Quantity

- **Minimum**: 0 (optional set)
- **Maximum**: 15
- **Purpose**: Number of items customer must select

### Max Quantity

- **Minimum**: 1
- **Maximum**: 15
- **Purpose**: Maximum items customer can select
- **Constraint**: `maxQuantity >= minQuantity`

## Set Types

### Required Set

When `minQuantity > 0`:
- Customer must select at least `minQuantity` items
- Example: "Choose at least 1 T-shirt"

### Optional Set

When `minQuantity = 0`:
- Customer can skip this set
- Example: "Add a gift (optional)"

### Single Choice Set

When `minQuantity = maxQuantity = 1`:
- Customer must select exactly 1 item
- Also called "Option Set"
- Example: "Choose your size"

### Multiple Choice Set

When `maxQuantity > 1`:
- Customer can select multiple items
- Example: "Choose up to 3 accessories"

## Creating a Choice Set

```http
POST /admin/bundles/:bundleId/sets
Content-Type: application/json

{
  "title": "Choose your T-shirt",
  "description": "Select one T-shirt from the options",
  "minQuantity": 1,
  "maxQuantity": 1
}
```

## Adding Items to a Set

```http
POST /admin/bundles/:bundleId/sets/:setId/items
Content-Type: application/json

{
  "variantId": "tshirt-red-m"
}
```

## Selection Validation

When customer selects items, validation checks:

1. **Set Presence**: All sets with `minQuantity > 0` must have selections
2. **Quantity Range**: Selections must be between min and max
3. **Item Validity**: Selected items must exist in the set
4. **No Duplicates**: Same item can't be selected twice (unless `allowMixAndMatch: true`)

## Example: T-Shirt Bundle

```json
{
  "bundle": {
    "title": "Custom T-Shirt Bundle",
    "sets": [
      {
        "title": "Choose your T-shirt",
        "minQuantity": 1,
        "maxQuantity": 1,
        "items": [
          { "variantId": "tshirt-red-m" },
          { "variantId": "tshirt-blue-m" },
          { "variantId": "tshirt-green-m" }
        ]
      },
      {
        "title": "Add accessories (optional)",
        "minQuantity": 0,
        "maxQuantity": 3,
        "items": [
          { "variantId": "cap-black" },
          { "variantId": "socks-white" },
          { "variantId": "bag-red" }
        ]
      }
    ]
  }
}
```

**Valid Selections**:
- T-shirt: 1 item (required)
- Accessories: 0-3 items (optional)

**Invalid Selections**:
- T-shirt: 0 items ❌ (minQuantity = 1)
- Accessories: 4 items ❌ (maxQuantity = 3)

## Sort Order

Sets are displayed in `sortOrder` order:

- Lower numbers appear first
- Default: Sets created later have higher sortOrder
- Can be updated to reorder sets

## API Endpoints

- `POST /admin/bundles/:bundleId/sets` - Create choice set
- `GET /admin/bundles/:bundleId/sets` - List sets for bundle
- `GET /admin/bundles/:bundleId/sets/:setId` - Get set
- `PATCH /admin/bundles/:bundleId/sets/:setId` - Update set
- `DELETE /admin/bundles/:bundleId/sets/:setId` - Delete set
- `POST /admin/bundles/:bundleId/sets/:setId/items` - Add item to set
- `DELETE /admin/bundles/:bundleId/sets/:setId/items/:itemId` - Remove item from set

## Limits

- **Max Sets per Bundle**: 15
- **Max Items per Set**: No hard limit (but keep reasonable)
- **Min/Max Quantity**: 0-15

## Best Practices

1. **Clear Titles**: Use descriptive titles for each set
2. **Reasonable Limits**: Keep quantities reasonable (1-5 for most cases)
3. **Logical Ordering**: Order sets logically (required first, optional last)
4. **Test Validation**: Test all quantity combinations
5. **Document Rules**: Document set rules clearly

## Edge Cases

- **Empty Set**: Set must have at least one item
- **Invalid Quantity Range**: `maxQuantity < minQuantity` is invalid
- **Zero Max Quantity**: Not allowed (minimum is 1)
- **Large Quantities**: Keep maxQuantity reasonable for UX

