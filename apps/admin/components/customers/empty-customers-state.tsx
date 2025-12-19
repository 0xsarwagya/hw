import {
  CUSTOMER_EMPTY_STATE_TITLE,
  CUSTOMER_EMPTY_STATE_DESCRIPTION_SEARCH,
  CUSTOMER_EMPTY_STATE_DESCRIPTION_DEFAULT,
} from "@/lib/constants/customers.constants";

interface EmptyCustomersStateProps {
  hasSearchFilter: boolean;
}

/**
 * Empty state component shown when no customers are found
 */
export function EmptyCustomersState({ hasSearchFilter }: EmptyCustomersStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-lg font-medium mb-2">{CUSTOMER_EMPTY_STATE_TITLE}</p>
      <p className="text-sm">
        {hasSearchFilter
          ? CUSTOMER_EMPTY_STATE_DESCRIPTION_SEARCH
          : CUSTOMER_EMPTY_STATE_DESCRIPTION_DEFAULT}
      </p>
    </div>
  );
}

