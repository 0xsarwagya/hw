"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const protectedRoutes = ["/dashboard", "/products"];
      const publicRoutes = ["/login", "/"];
      const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route),
      );
      const isPublic = publicRoutes.includes(pathname);

      // Skip auth check for public routes
      if (isPublic) {
        setIsChecking(false);
        return;
      }

      // Check authentication for protected routes
      if (isProtected && !isAuthenticated()) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
