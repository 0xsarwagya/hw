"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavState } from "@/hooks/use-nav-state";
import { navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { SidebarSection } from "./sidebar-section";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed } = useNavState();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-background transition-all duration-300 lg:static lg:z-auto",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!isCollapsed && (
              <Link href="/" className="font-semibold">
                VCEcom Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav className="space-y-1 p-4">
              {navigation.map((section, sectionIndex) => (
                <div
                  key={`nav-section-${String(sectionIndex)}`}
                  className="space-y-1"
                >
                  {section.items.map((item) => (
                    <SidebarSection key={item.href} item={item} />
                  ))}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
}
