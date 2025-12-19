"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface CommandKContextValue {
  isOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

const CommandKContext = createContext<CommandKContextValue | undefined>(
  undefined,
);

export function CommandKProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCommandPalette = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        toggleCommandPalette();
      }
      // Escape to close
      if (event.key === "Escape" && isOpen) {
        closeCommandPalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, toggleCommandPalette, closeCommandPalette]);

  return (
    <CommandKContext.Provider
      value={{
        isOpen,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
      }}
    >
      {children}
    </CommandKContext.Provider>
  );
}

export function useCommandK(): CommandKContextValue {
  const context = useContext(CommandKContext);
  if (context === undefined) {
    throw new Error("useCommandK must be used within a CommandKProvider");
  }
  return context;
}
