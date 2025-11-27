"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { decodeJWT } from "@/lib/jwt";

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string; role: string } | null>(
    null,
  );

  useEffect(() => {
    // Get user info from cookie (decode JWT from cookie)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const token = getCookie("admin_access_token");
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        setUser({ email: decoded.email, role: decoded.role });
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "success",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">VCEcom Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
              <span className="text-xs">({user.role})</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
