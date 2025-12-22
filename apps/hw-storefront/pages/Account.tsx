import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { Address, Order } from "../types";

type ActiveTab = "profile" | "orders" | "addresses" | "wishlist";

const Account: React.FC = () => {
  const {
    user,
    updateUserProfile,
    addAddress,
    deleteAddress,
    toggleWishlist,
    isAuthenticated,
    logout,
  } = useShop();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    setEditingProfile(false);
  };

  const handleAddAddress = () => {
    // Mock implementation for adding address
    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      type: "Other",
      name: user.name,
      street: "New Street Address",
      city: "New City",
      state: "State",
      zip: "000000",
      phone: user.phone,
      isDefault: false,
    };
    addAddress(newAddress);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const TabButton = ({
    id,
    label,
    icon,
  }: {
    id: ActiveTab;
    label: string;
    icon: string;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
        ${
          activeTab === id
            ? "bg-primary text-white shadow-md"
            : "text-gray-600 hover:bg-gray-100"
        }`}
    >
      <span className="material-icons text-lg">{icon}</span>
      {label}
    </button>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-[fade-in_0.5s_ease-out]">
      <h1 className="text-3xl font-bold uppercase tracking-tight mb-8">
        My Account
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <span className="material-icons text-3xl">person</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-lg">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-2">
              <TabButton id="profile" label="Profile" icon="person" />
              <TabButton id="orders" label="Orders" icon="shopping_bag" />
              <TabButton id="addresses" label="Addresses" icon="location_on" />
              <TabButton id="wishlist" label="Wishlist" icon="favorite" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4"
              >
                <span className="material-icons text-lg">logout</span>
                Sign Out
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 animate-[fade-in_0.3s_ease-out]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Profile Details</h2>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="text-sm font-medium text-primary underline"
                >
                  {editingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!editingProfile}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:ring-primary focus:border-primary disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={!editingProfile}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:ring-primary focus:border-primary disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={!editingProfile}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:ring-primary focus:border-primary disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                </div>

                {editingProfile && (
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
              <h2 className="text-xl font-bold mb-4">Order History</h2>
              {user.orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <span className="material-icons text-4xl text-gray-300 mb-2">
                    shopping_bag
                  </span>
                  <p className="text-gray-500">No orders found.</p>
                </div>
              ) : (
                user.orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 md:p-6 bg-secondary/20 border-b border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex gap-8 text-sm">
                        <div>
                          <span className="block text-gray-500 uppercase text-xs">
                            Order Placed
                          </span>
                          <span className="font-medium">{order.date}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 uppercase text-xs">
                            Total
                          </span>
                          <span className="font-medium">₹{order.total}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 uppercase text-xs">
                            Order #
                          </span>
                          <span className="font-medium">{order.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                            ${
                                              order.status === "Delivered"
                                                ? "bg-green-100 text-green-700"
                                                : order.status === "Processing"
                                                  ? "bg-blue-100 text-blue-700"
                                                  : "bg-gray-100 text-gray-700"
                                            }`}
                        >
                          {order.status}
                        </span>
                        <button
                          onClick={() =>
                            setExpandedOrder(
                              expandedOrder === order.id ? null : order.id,
                            )
                          }
                          className="text-sm font-medium underline text-primary"
                        >
                          {expandedOrder === order.id
                            ? "Hide Details"
                            : "View Details"}
                        </button>
                      </div>
                    </div>
                    {expandedOrder === order.id && (
                      <div className="p-4 md:p-6 animate-[slide-down_0.3s_ease-out]">
                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-xs text-gray-500">
                                  Size: {item.selectedSize}{" "}
                                  {item.selectedColor
                                    ? `• ${item.selectedColor}`
                                    : ""}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="font-medium">₹{item.price}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-sm mb-1">
                              Shipping Address
                            </h5>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress.name}
                              <br />
                              {order.shippingAddress.street}
                              <br />
                              {order.shippingAddress.city},{" "}
                              {order.shippingAddress.state}{" "}
                              {order.shippingAddress.zip}
                              <br />
                              {order.shippingAddress.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Subtotal: ₹
                              {order.total > 999
                                ? order.total
                                : order.total - 150}
                            </p>
                            <p className="text-sm text-gray-600">
                              Shipping: {order.total > 999 ? "Free" : "₹150"}
                            </p>
                            <p className="font-bold mt-1 text-primary">
                              Grand Total: ₹{order.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Saved Addresses</h2>
                <button
                  onClick={handleAddAddress}
                  className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  + Add New Address
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border border-gray-200 rounded-xl p-6 relative group hover:border-primary transition-colors bg-white shadow-sm hover:shadow-md"
                  >
                    {address.isDefault && (
                      <span className="absolute top-4 right-4 bg-secondary text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                        Default
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-icons text-gray-400 text-sm">
                        {address.type === "Home"
                          ? "home"
                          : address.type === "Work"
                            ? "work"
                            : "place"}
                      </span>
                      <span className="font-bold text-sm uppercase">
                        {address.type}
                      </span>
                    </div>
                    <p className="font-bold mb-1">{address.name}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {address.street}
                      <br />
                      {address.city}, {address.state} {address.zip}
                      <br />
                      Phone: {address.phone}
                    </p>
                    <div className="flex gap-4 pt-4 border-t border-gray-100 text-sm font-medium">
                      <button className="text-primary hover:underline">
                        Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => deleteAddress(address.id)}
                          className="text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
              <h2 className="text-xl font-bold mb-4">My Wishlist</h2>
              {user.wishlist.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <span className="material-icons text-4xl text-gray-300 mb-2">
                    favorite_border
                  </span>
                  <p className="text-gray-500">Your wishlist is empty.</p>
                  <Link
                    to="/shop"
                    className="inline-block mt-4 text-sm font-bold underline text-primary"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white relative"
                    >
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md text-red-500 hover:scale-110 transition-transform"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                      <div className="p-4">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <p className="font-bold">₹{item.price}</p>
                        </Link>
                        <div className="mt-3">
                          <Link
                            to={`/product/${item.id}`}
                            className="block w-full bg-primary text-white text-center py-2 rounded text-xs font-bold uppercase hover:opacity-90 active:scale-95 transition-transform"
                          >
                            View Product
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;
