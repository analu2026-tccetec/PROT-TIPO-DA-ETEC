import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductPage from "@/pages/ProductPage";
import StorePage from "@/pages/StorePage";
import CartPage from "@/pages/CartPage";
import Checkout from "@/pages/Checkout";
import OrderStatusPage from "@/pages/OrderStatus";
import VendorPanel from "@/pages/VendorPanel";
import Onboarding from "@/pages/Onboarding";
import Security from "@/pages/Security";
import NotFound from "@/pages/NotFound";
import { CartProvider } from "@/lib/cart";
import { NeighborhoodProvider } from "@/lib/neighborhood";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <CartProvider>
      <NeighborhoodProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/produto/:id" element={<ProductPage />} />
            <Route path="/loja/:slug" element={<StorePage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:id" element={<OrderStatusPage />} />
            <Route path="/painel-lojista" element={<VendorPanel />} />
            <Route path="/parceiro/onboarding" element={<Onboarding />} />
            <Route path="/seguranca" element={<Security />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </NeighborhoodProvider>
    </CartProvider>
  );
}
