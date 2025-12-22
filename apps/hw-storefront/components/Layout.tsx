import React from "react";
import { Outlet } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import Header from "./Header";

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      <Footer />
    </div>
  );
};

export default Layout;
