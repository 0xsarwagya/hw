import React, { lazy, Suspense, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import { ShopProvider } from "./context/ShopContext";

// Lazy loading pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutError = lazy(() => import("./pages/checkout/CheckoutError"));
const CheckoutSuccess = lazy(() => import("./pages/checkout/CheckoutSuccess"));
const PaymentGateway = lazy(() => import("./pages/checkout/PaymentGateway"));
const OrderConfirmation = lazy(
  () => import("./pages/checkout/OrderConfirmation"),
);
const Bundle = lazy(() => import("./pages/Bundle"));
const BundleNew = lazy(() => import("./pages/BundleNew"));
const BundlePrinted = lazy(() => import("./pages/BundlePrinted"));
const Bundle1 = lazy(() => import("./pages/bundle/Bundle1"));
const Bundle2 = lazy(() => import("./pages/bundle/Bundle2"));
const Bundle3 = lazy(() => import("./pages/bundle/Bundle3"));
const Account = lazy(() => import("./pages/Account"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Policies = lazy(() => import("./pages/Policies"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SizeChart = lazy(() => import("./pages/SizeChart"));
const Shipping = lazy(() => import("./pages/Shipping"));
const WashingInstructions = lazy(() => import("./pages/WashingInstructions"));
const NotFound = lazy(() => import("./pages/NotFound"));

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only scroll to top if we aren't navigating to a specific hash section (anchor)
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const App: React.FC = () => {
  return (
    <ShopProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/error" element={<CheckoutError />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route
                path="/checkout/payment-gateway"
                element={<PaymentGateway />}
              />
              <Route path="/orders/:orderId" element={<OrderConfirmation />} />
              <Route
                path="/account/orders/:orderId"
                element={<OrderConfirmation />}
              />
              <Route path="/bundles" element={<Bundle />} />
              <Route path="/bundle/:bundleSize" element={<Bundle />} />
              <Route path="/bundle/:slug" element={<Bundle1 />} />
              <Route path="/bundle-2/:slug" element={<Bundle2 />} />
              <Route path="/bundle-3/:slug" element={<Bundle3 />} />
              <Route path="/bundle-new/:bundleSize" element={<BundleNew />} />
              <Route
                path="/bundle-printed/:bundleSize"
                element={<BundlePrinted />}
              />
              <Route path="/account" element={<Account />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/size-chart" element={<SizeChart />} />
              <Route path="/shipping-policy" element={<Shipping />} />
              <Route
                path="/care-instructions"
                element={<WashingInstructions />}
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ShopProvider>
  );
};

export default App;
