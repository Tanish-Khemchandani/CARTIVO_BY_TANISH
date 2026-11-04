import { Routes, Route } from "react-router-dom";
import StorefrontLayout from "./components/layout/StorefrontLayout";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import CategoryPage from "./pages/CategoryPage";
import SearchResults from "./pages/SearchResults";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import AccountProfile from "./pages/AccountProfile";
import AccountOrders from "./pages/AccountOrders";
import AccountAddresses from "./pages/AccountAddresses";
import Wishlist from "./pages/Wishlist";
import TrackOrder from "./pages/TrackOrder";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Faqs from "./pages/Faqs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingDelivery from "./pages/ShippingDelivery";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import AdminThemeWrapper from "./admin/components/layout/AdminThemeWrapper";
import AdminLayout from "./admin/components/layout/AdminLayout";
import AdminLogin from "./admin/pages/Login";
import { RequireAdmin } from "./admin/context/AdminAuthContext";
import Dashboard from "./admin/pages/Dashboard";
import AdminsAdmin from "./admin/pages/AdminsAdmin";
import UsersAdmin from "./admin/pages/UsersAdmin";
import ContactInquiriesAdmin from "./admin/pages/ContactInquiriesAdmin";
import GstAdmin from "./admin/pages/GstAdmin";
import ProductsAdmin from "./admin/pages/ProductsAdmin";
import CategoriesAdmin from "./admin/pages/CategoriesAdmin";
import InventoryAdmin from "./admin/pages/InventoryAdmin";
import OrdersAdmin from "./admin/pages/OrdersAdmin";
import ReviewsAdmin from "./admin/pages/ReviewsAdmin";
import SettingsAdmin from "./admin/pages/SettingsAdmin";
import ExportsAdmin from "./admin/pages/ExportsAdmin";

export default function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/profile" element={<AccountProfile />} />
        <Route path="/account/orders" element={<AccountOrders />} />
        <Route path="/account/addresses" element={<AccountAddresses />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-delivery" element={<ShippingDelivery />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* admin section: same app, separate dark theme, no shared layout with the storefront */}
      <Route path="/admin" element={<AdminThemeWrapper />}>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="admins" element={<AdminsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="contact-inquiries" element={<ContactInquiriesAdmin />} />
            <Route path="gst" element={<GstAdmin />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="inventory" element={<InventoryAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="reviews" element={<ReviewsAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
            <Route path="exports" element={<ExportsAdmin />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
