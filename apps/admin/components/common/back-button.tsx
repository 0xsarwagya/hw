"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  className?: string;
}

/**
 * Reusable back button component
 * Provides consistent back navigation button styling
 */
export function BackButton({
  href,
  label = "Back",
  variant = "outline",
  className,
}: BackButtonProps) {
  return (
    <Button asChild variant={variant} className={cn(className)}>
      <Link href={href}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

