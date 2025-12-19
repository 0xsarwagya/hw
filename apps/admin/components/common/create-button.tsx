"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateButtonProps {
  href: string;
  label: string;
  variant?: "default" | "outline";
  className?: string;
}

/**
 * Reusable create button component with consistent styling
 * Provides a standardized way to create new resources
 */
export function CreateButton({
  href,
  label,
  variant = "default",
  className,
}: CreateButtonProps) {
  return (
    <Button asChild variant={variant} className={cn(className)}>
      <Link href={href}>
        <Plus className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

