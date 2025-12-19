"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButton {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "default" | "outline" | "destructive" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  title?: string;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  className?: string;
}

/**
 * Reusable action button group component
 * Provides consistent styling for groups of action buttons (e.g., Approve/Reject/Delete)
 */
export function ActionButtonGroup({ actions, className }: ActionButtonGroupProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {actions.map((action, index) => (
        <Button
          key={index}
          size={action.size || "sm"}
          variant={action.variant || "outline"}
          onClick={action.onClick}
          disabled={action.disabled || action.isLoading}
          title={action.title}
        >
          {action.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            action.icon
          )}
          {action.label && <span className={action.icon ? "ml-2" : ""}>{action.label}</span>}
        </Button>
      ))}
    </div>
  );
}

