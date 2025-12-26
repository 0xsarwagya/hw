"use client";

import React from "react";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import Header from "./Header";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />

      <main className="flex-grow">{children}</main>

      {/* Cart Drawer */}
      <CartDrawer />

      <Footer />
    </div>
  );
}
