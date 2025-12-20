"use client";

import { Keyboard } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    keys: ["⌘", "K"],
    description: "Open command palette",
    category: "Navigation",
  },
  {
    keys: ["⌘", "/"],
    description: "Show keyboard shortcuts",
    category: "Navigation",
  },
  {
    keys: ["G", "D"],
    description: "Go to Dashboard",
    category: "Navigation",
  },
  {
    keys: ["G", "P"],
    description: "Go to Products",
    category: "Navigation",
  },
  {
    keys: ["G", "O"],
    description: "Go to Orders",
    category: "Navigation",
  },
  {
    keys: ["G", "C"],
    description: "Go to Customers",
    category: "Navigation",
  },
  {
    keys: ["G", "I"],
    description: "Go to Inventory",
    category: "Navigation",
  },
  // Actions
  {
    keys: ["N"],
    description: "New item (context-aware)",
    category: "Actions",
  },
  {
    keys: ["⌘", "S"],
    description: "Save current form",
    category: "Actions",
  },
  {
    keys: ["Esc"],
    description: "Close dialog/modal",
    category: "Actions",
  },
  {
    keys: ["⌘", "Enter"],
    description: "Submit form",
    category: "Actions",
  },
  // Table operations
  {
    keys: ["⌘", "A"],
    description: "Select all (in tables)",
    category: "Tables",
  },
  {
    keys: ["⌘", "F"],
    description: "Focus search/filter",
    category: "Tables",
  },
  {
    keys: ["/"],
    description: "Focus search input",
    category: "Tables",
  },
  {
    keys: ["→"],
    description: "Next page",
    category: "Tables",
  },
  {
    keys: ["←"],
    description: "Previous page",
    category: "Tables",
  },
];

/**
 * Keyboard shortcuts help dialog
 */
export function KeyboardShortcutsDialog() {
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden md:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map((shortcut) => (
                  <div
                    key={`${category}-${shortcut.description}`}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <Badge
                          key={`${category}-${shortcut.description}-${key}`}
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  enabled = true,
) {
  const keyString = keys.join("+").toLowerCase();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKeys: string[] = [];
      if (event.metaKey || event.ctrlKey) pressedKeys.push("cmd");
      if (event.shiftKey) pressedKeys.push("shift");
      if (event.altKey) pressedKeys.push("alt");
      pressedKeys.push(event.key.toLowerCase());

      const pressedKeyString = pressedKeys.join("+");

      if (pressedKeyString === keyString) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyString, callback, enabled]);
}
