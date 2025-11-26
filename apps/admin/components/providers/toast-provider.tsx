"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Toaster } from "@/components/ui/toast";

type ToastVariant = "default" | "destructive" | "success";

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (props: {
    title?: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
    }: {
      title?: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastData = {
        id,
        title,
        description,
        variant,
      };
      setToasts((prev) => [...prev, newToast]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster
        toasts={toasts.map((toast) => ({
          ...toast,
          onClose: () => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          },
        }))}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
