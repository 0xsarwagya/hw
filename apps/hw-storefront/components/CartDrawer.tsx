import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { formatCurrency } from "../utils";

const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart, cart, updateQuantity, removeFromCart } =
    useShop();
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const FREE_SHIPPING_THRESHOLD = 999;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  // Close drawer on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeCart]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isCartOpen]);

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isCartOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed z-[70] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col
          /* Mobile: Bottom Sheet */
          bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl
          ${isCartOpen ? "translate-y-0" : "translate-y-full"}
          
          /* Desktop: Right Side Drawer */
          md:top-0 md:right-0 md:h-full md:w-full md:max-w-md md:rounded-none md:bottom-auto md:left-auto
          ${isCartOpen ? "md:translate-x-0" : "md:translate-x-full md:translate-y-0"}
        `}
      >
        {/* Mobile Handle */}
        <div
          className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer"
          onClick={closeCart}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Shopping Cart ({cart.reduce((a, c) => a + c.quantity, 0)})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-5 py-4 bg-secondary/20">
          {remaining > 0 ? (
            <p className="text-sm text-center mb-2 font-medium">
              Add{" "}
              <span className="font-bold text-primary">
                {formatCurrency(remaining)}
              </span>{" "}
              more for{" "}
              <span className="font-bold uppercase">Free Shipping</span>
            </p>
          ) : (
            <p className="text-sm text-center mb-2 font-bold text-green-600 flex items-center justify-center gap-1">
              <span className="material-icons text-sm">check_circle</span>{" "}
              You've unlocked Free Shipping!
            </p>
          )}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <span className="material-icons text-6xl mb-4 text-gray-200">
                shopping_cart_off
              </span>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm mb-6">
                Looks like you haven't added anything yet.
              </p>
              <button
                onClick={() => {
                  closeCart();
                  navigate("/shop");
                }}
                className="bg-black text-white px-6 py-2 rounded-lg font-bold uppercase text-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="flex gap-4 animate-[fade-in_0.3s_ease-out]"
              >
                <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-2 pr-2">
                        {item.name}
                      </h3>
                      <p className="font-bold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.selectedSize}{" "}
                      {item.selectedColor ? `• ${item.selectedColor}` : ""}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.cartId, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <span className="material-icons text-sm">remove</span>
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartId, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                      >
                        <span className="material-icons text-sm">add</span>
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-xs text-red-500 hover:text-red-700 underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50 pb-8 md:pb-5">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-400">
                Shipping & taxes calculated at checkout
              </p>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/20"
            >
              Checkout • {formatCurrency(subtotal)}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
