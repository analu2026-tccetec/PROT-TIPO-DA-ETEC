import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
  Store as StoreIcon,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import NeighborhoodPicker from "@/components/NeighborhoodPicker";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import { CategoryPills } from "@/components/CategoryPills";
import { apiGet } from "@/lib/api";
import { useNeighborhood } from "@/lib/neighborhood";
import type { Category, Product, Store } from "@/lib/types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1504281186-f427c16ed131?q=80&w=1600&auto=format&fit=crop";

function SoftError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
      Não foi possível carregar agora.
      <button onClick={onRetry} className="ml-2 font-semibold text-[#C2410C] hover:underline">
        Tentar de novo
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { neighborhood, prazo } = useNeighborhood();
  const [pickerOpen, setPickerOpen] = useState(false);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });
  const storesQ = useQuery({
    queryKey: ["stores", "all"],
    queryFn: () => apiGet<Store[]>("/stores"),
  });
  const featuredQ = useQuery({
    queryKey: ["products", { featured: true, limit: 8 }],
    queryFn: () => apiGet<Product[]>("/products?featured=true&limit=8"),
  });

  const stores = storesQ.data ?? [];
  const storeNames = new Map(stores.map((s) => [s.id, s.name]));
  const localStores = stores.filter((s) => s.store_type === "pequeno_negocio").slice(0, 6);
  const anchorStores = stores.filter((s) => s.store_type === "loja_ancora");

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-[#1E293B] text-white">
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E293B] via-[#1E293B]/85 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-xl px-6 py-10 md:px-10 md:py-14"
        >
          <Badge className="border-0 bg-white/15 text-[#FDBA74]">
            Marketplace do comércio de Cosmópolis-SP
          </Badge>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Tudo da nossa cidade, entregue rápido na sua porta
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1] md:text-base">
            Do hortifrúti da esquina às grandes lojas da avenida: frete por bairro, Pix na hora e
            retirada na loja (click &amp; collect).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/catalogo"
              data-testid="hero-cta-catalog"
              className={buttonVariants({ size: "lg" }) + " transition-transform active:scale-95"}
            >
              Ver catálogo <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/parceiro/onboarding"
              data-testid="hero-cta-vendor"
              className={
                buttonVariants({ variant: "outline", size: "lg" }) +
                " border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-transform active:scale-95"
              }
            >
              Sou lojista — quero vender
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#CBD5E1]">
            <span className="flex items-center gap-1.5">
              <StoreIcon size={14} aria-hidden="true" /> Lojas de bairro e âncoras da cidade
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={14} aria-hidden="true" /> 9 bairros atendidos
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" /> Entrega a partir de 30 min
            </span>
          </div>
        </motion.div>
      </section>

      {/* Barra do bairro */}
      <section
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-[#7C2D12]"
        data-testid="neighborhood-bar"
      >
        <div className="flex items-center gap-2.5">
          <MapPin size={20} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Entregar em: {neighborhood}</p>
            <p className="text-xs text-[#9A3412]">
              {prazo ? `Prazo estimado: ${prazo}` : "Escolha seu bairro para estimar o frete"} • Retirada na loja disponível
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-testid="neighborhood-bar-change"
          onClick={() => setPickerOpen(true)}
          className="transition-transform active:scale-95"
        >
          Trocar bairro
        </Button>
      </section>

      {/* Categorias */}
      <section>
        <h2 className="font-heading text-xl font-bold tracking-tight">Categorias</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Do varejo de grande porte ao negócio da esquina, tudo em um só lugar.
        </p>
        {categoriesQ.data ? (
          <CategoryPills
            categories={categoriesQ.data}
            onSelect={(id) => navigate(id ? `/catalogo?categoria=${id}` : "/catalogo")}
          />
        ) : (
          <div className="h-11 animate-pulse rounded-full bg-muted" />
        )}
      </section>

      {/* Destaques do Comércio Local */}
      <section data-testid="small-business-section">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Badge className="border-0 bg-[#FFF1EB] text-[#C2410C]">Destaques do Comércio Local</Badge>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">
              Pequenos negócios que fazem a cidade girar
            </h2>
            <p className="text-sm text-muted-foreground">
              Hortifrúti, padarias, ateliês e serviços — entrega rápida e quem atende é o próprio dono.
            </p>
          </div>
          <Link to="/catalogo?tab=lojas" className="hidden shrink-0 text-sm font-semibold text-[#C2410C] hover:underline md:block">
            Ver todas as lojas
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {storesQ.isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
          {storesQ.isError && <SoftError onRetry={() => storesQ.refetch()} />}
          {localStores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </section>

      {/* Ofertas em destaque */}
      <section data-testid="featured-products-section">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-xl font-bold tracking-tight">Ofertas em destaque</h2>
          <Link to="/catalogo" className="text-sm font-semibold text-[#C2410C] hover:underline">
            Ver catálogo completo
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {featuredQ.isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />)}
          {featuredQ.isError && <SoftError onRetry={() => featuredQ.refetch()} />}
          {featuredQ.data?.map((p) => (
            <ProductCard key={p.id} product={p} storeName={storeNames.get(p.store_id)} />
          ))}
        </div>
      </section>

      {/* Lojas Parceiras */}
      <section
        data-testid="anchor-stores-section"
        className="rounded-3xl bg-[#13171F] p-6 text-white md:p-8"
      >
        <Badge className="border-0 bg-white/10 text-[#FDBA74]">Lojas Parceiras</Badge>
        <h2 className="mt-2 font-heading text-xl font-bold tracking-tight md:text-2xl">
          Grandes marcas de Cosmópolis, com a entrega da cidade
        </h2>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Supermercados, farmácias, tecnologia e moda — estoque grande, prazo curto.
        </p>
        <div className="no-scrollbar -mx-6 mt-4 flex gap-3 overflow-x-auto px-6 pb-1 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {storesQ.isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="h-40 min-w-[220px] animate-pulse rounded-2xl bg-white/10" />)}
          {storesQ.isError && <SoftError onRetry={() => storesQ.refetch()} />}
          {anchorStores.map((s) => (
            <Link
              key={s.id}
              to={`/loja/${s.slug}`}
              data-testid={`anchor-card-${s.slug}`}
              className="group min-w-[220px] overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition-transform active:scale-[0.98]"
            >
              <div className="h-28 overflow-hidden">
                <img
                  src={s.image_url}
                  alt={s.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="truncate font-heading text-sm font-bold">{s.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-[#94A3B8]">{s.tagline}</p>
                <p className="mt-1.5 text-[11px] font-semibold text-[#FDBA74]">Loja âncora • ★ {s.rating.toFixed(1)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Faixa de segurança */}
      <section
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-4"
        data-testid="home-security-strip"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0FDF4] text-[#15803D]">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Compras protegidas de ponta a ponta</p>
            <p className="text-xs text-muted-foreground">
              HTTPS/SSL obrigatório, Pix identificado no nome da loja e lojistas verificados pela Vitrine.
            </p>
          </div>
        </div>
        <Link to="/seguranca" data-testid="home-security-link" className="text-sm font-semibold text-[#C2410C] hover:underline">
          Saiba mais sobre segurança
        </Link>
      </section>

      {/* CTA lojista */}
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#D9531E] px-6 py-7 text-white"
        data-testid="home-vendor-cta"
      >
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">Tem uma loja em Cosmópolis?</h2>
          <p className="mt-1 max-w-md text-sm text-white/85">
            Cadastre sua loja, publique produtos e receba pedidos com frete por bairro — a Vitrine cuida
            do digital, você cuida do balcão.
          </p>
        </div>
        <Link
          to="/parceiro/onboarding"
          className={
            buttonVariants({ variant: "outline", size: "lg" }) +
            " border-white bg-white text-[#7C2D12] hover:bg-white/90 transition-transform active:scale-95"
          }
        >
          Quero vender na Vitrine <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <NeighborhoodPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
