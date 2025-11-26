"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  onClose?: () => void;
};

export function Toast({
  id: _id,
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
        variant === "destructive" &&
          "border-destructive bg-destructive text-destructive-foreground",
        variant === "success" &&
          "border-green-500 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50",
        variant === "default" && "bg-background text-foreground",
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className={cn(
          "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100",
          variant === "destructive" &&
            "text-destructive-foreground/50 hover:text-destructive-foreground",
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster({ toasts }: { toasts: ToastProps[] }) {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
