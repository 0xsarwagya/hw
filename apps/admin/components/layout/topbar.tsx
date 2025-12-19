"use client";

import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommandK } from "@/hooks/use-command-k";
import { useAdminSession } from "@/providers/session-provider";

interface TopbarProps {
  onSearchClick?: () => void;
}

export function Topbar({ onSearchClick }: TopbarProps) {
  const { session, logout } = useAdminSession();
  const { openCommandPalette } = useCommandK();

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      openCommandPalette();
    }
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const getEnvironmentBadge = () => {
    const env = process.env.NEXT_PUBLIC_ENV || "development";
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      production: "destructive",
      staging: "secondary",
      development: "default",
    };
    return (
      <Badge variant={variants[env] || "default"} className="text-xs">
        {env}
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSearchClick}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Environment badge */}
        {getEnvironmentBadge()}

        {/* Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {session?.email ? getInitials(session.email) : "A"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium">
                  {session?.email?.split("@")[0] || "Admin"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session?.role || "admin"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.email || "Admin"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.role || "admin"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
