import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Grid2x2,
  Home,
  LayoutDashboard,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import NeighborhoodPicker from "@/components/NeighborhoodPicker";
import { useCart } from "@/lib/cart";
import { useNeighborhood } from "@/lib/neighborhood";
import { cn } from "@/lib/utils";

const DESKTOP_LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/catalogo?tab=lojas", label: "Lojas" },
  { to: "/parceiro/onboarding", label: "Seja Parceiro" },
  { to: "/painel-lojista", label: "Painel do Lojista" },
  { to: "/seguranca", label: "Segurança" },
];

const BOTTOM_NAV = [
  { to: "/", label: "Início", icon: Home, testId: "nav-bottom-home" },
  { to: "/catalogo", label: "Catálogo", icon: Grid2x2, testId: "nav-bottom-catalog" },
  { to: "/carrinho", label: "Sacola", icon: ShoppingBag, testId: "nav-bottom-cart" },
  { to: "/catalogo?tab=lojas", label: "Lojas", icon: Store, testId: "nav-bottom-stores" },
  { to: "/painel-lojista", label: "Painel", icon: LayoutDashboard, testId: "nav-bottom-vendor" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useCart();
  const { neighborhood, prazo } = useNeighborhood();

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/catalogo?q=${encodeURIComponent(query.trim())}` : "/catalogo");
  };

  return (
    <div className="flex min-h-svh flex-col bg-[#F8F6F2] text-[#1E2229]">
      {/* Faixa superior: bairro + selo de segurança */}
      <div className="bg-[#1E293B] text-[#F8FAFC]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-1.5 text-xs">
          <button
            type="button"
            data-testid="neighborhood-selector-trigger"
            onClick={() => setPickerOpen(true)}
            className="flex min-h-11 items-center gap-1.5 font-medium text-[#FDBA74] md:min-h-0"
          >
            <MapPin size={14} aria-hidden="true" />
            <span className="max-w-[220px] truncate">
              Entregar em: <strong>{neighborhood}</strong>
              {prazo ? <span className="text-[#CBD5E1]"> • {prazo}</span> : null}
            </span>
          </button>
          <span
            data-testid="security-ssl-badge"
            className="hidden items-center gap-1.5 text-[#CBD5E1] sm:flex"
          >
            <Lock size={12} aria-hidden="true" /> Compra 100% segura • HTTPS/SSL
          </span>
        </div>
      </div>

      {/* Cabeçalho principal */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur" data-testid="app-header">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#D9531E] text-white shadow-sm">
                <ShoppingBag size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-heading text-lg font-bold leading-none tracking-tight">
                  Vitrine Cosmópolis
                </span>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-[#5A6472]">
                  Compre em Cosmópolis-SP
                </span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
              {DESKTOP_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    location.pathname + location.search === l.to
                      ? "bg-secondary text-[#7C2D12]"
                      : "text-slate-600 hover:bg-accent",
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <Button
                size="icon"
                variant="ghost"
                aria-label="Abrir sacola"
                data-testid="header-cart-button"
                onClick={() => navigate("/carrinho")}
                className="relative ml-1"
              >
                <ShoppingBag size={20} aria-hidden="true" />
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.3 }}
                    data-testid="header-cart-count"
                    className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#D9531E] text-[10px] font-bold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </Button>
            </nav>
            <Button
              size="icon"
              variant="ghost"
              className="relative md:hidden"
              aria-label="Abrir sacola"
              data-testid="header-cart-button-mobile"
              onClick={() => navigate("/carrinho")}
            >
              <ShoppingBag size={20} aria-hidden="true" />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.3 }}
                  className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#D9531E] text-[10px] font-bold text-white"
                >
                  {count}
                </motion.span>
              )}
            </Button>
          </div>
          <form onSubmit={onSearch} className="flex gap-2 pb-3" role="search">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque em Cosmópolis: pão, fone, vestido…"
              aria-label="Buscar produtos"
              data-testid="search-input"
              className="h-11 rounded-full bg-[#F8F6F2]"
            />
            <Button type="submit" size="icon" aria-label="Buscar" className="h-11 w-11 shrink-0 rounded-full transition-transform active:scale-95">
              <Search size={18} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:pb-16">{children}</main>

      {/* Rodapé */}
      <footer className="bg-[#13171F] text-[#F8FAFC]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-heading text-lg font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#D9531E]">
                <ShoppingBag size={16} aria-hidden="true" />
              </span>
              Vitrine Cosmópolis
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              O marketplace do comércio de Cosmópolis-SP: lojas de bairro e grandes âncoras, com
              entrega rápida por bairro, Pix e retirada na loja.
            </p>
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Navegação</p>
            <ul className="mt-3 space-y-2">
              <li><Link className="text-[#FDBA74] hover:underline" to="/catalogo">Catálogo</Link></li>
              <li><Link className="text-[#FDBA74] hover:underline" to="/catalogo?tab=lojas">Lojas da cidade</Link></li>
              <li><Link className="text-[#FDBA74] hover:underline" to="/seguranca">Segurança e confiança</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Lojistas</p>
            <ul className="mt-3 space-y-2">
              <li><Link className="text-[#FDBA74] hover:underline" to="/parceiro/onboarding">Seja um lojista parceiro</Link></li>
              <li><Link className="text-[#FDBA74] hover:underline" to="/painel-lojista">Painel do lojista (demonstração)</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-[#94A3B8]">
            <p className="flex items-center gap-1.5 font-medium text-[#4ADE80]">
              <ShieldCheck size={14} aria-hidden="true" /> Conexão segura via HTTPS/SSL em todas as transações
            </p>
            <p>
              © 2025 Vitrine Cosmópolis — projeto demonstrativo. Nenhum pagamento real é processado;
              pedidos, estoque e Pix são simulados.
            </p>
          </div>
        </div>
      </footer>

      {/* Navegação inferior mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur md:hidden"
        aria-label="Navegação mobile"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to.split("?")[0]) &&
                  (item.label !== "Lojas" || location.search.includes("tab=lojas")) &&
                  (item.label !== "Catálogo" || !location.search.includes("tab=lojas"));
            return (
              <Link
                key={item.label}
                to={item.to}
                data-testid={item.testId}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                  active ? "text-[#D9531E]" : "text-slate-500",
                )}
              >
                <span className="relative">
                  <Icon size={20} aria-hidden="true" />
                  {item.label === "Sacola" && count > 0 && (
                    <span
                      data-testid="bottom-nav-cart-count"
                      className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#D9531E] px-1 text-[9px] font-bold text-white"
                    >
                      {count}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <NeighborhoodPicker open={pickerOpen} onOpenChange={setPickerOpen} />
      <Toaster />
    </div>
  );
}
