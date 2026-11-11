import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, ShieldCheck, Star, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import type { Product, Store } from "@/lib/types";

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();

  const storeQ = useQuery({
    queryKey: ["store", slug],
    queryFn: () => apiGet<Store>(`/stores/${slug}`),
    enabled: !!slug,
  });

  const store = storeQ.data;

  const productsQ = useQuery({
    queryKey: ["products", { store_id: store?.id }],
    queryFn: () => apiGet<Product[]>(`/products?store_id=${store?.id}&limit=60`),
    enabled: !!store,
  });

  if (storeQ.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-3xl bg-muted" />
        <div className="h-6 w-1/2 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (storeQ.isError || !store) {
    return (
      <div className="rounded-2xl border bg-card px-4 py-10 text-center">
        <p className="font-heading text-lg font-bold">Loja não encontrada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifique o endereço ou volte para a lista de lojas.
        </p>
        <Link
          to="/catalogo?tab=lojas"
          className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline"
        >
          Ver todas as lojas
        </Link>
      </div>
    );
  }

  const anchor = store.store_type === "loja_ancora";

  return (
    <div className="space-y-6">
      <Link
        to="/catalogo?tab=lojas"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-[#C2410C]"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Todas as lojas
      </Link>

      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl" data-testid="store-banner">
        <img src={store.image_url} alt={store.name} className="h-48 w-full object-cover md:h-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13171F]/85 via-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0" variant="secondary">
              {anchor ? "Loja Âncora" : "Comércio de Bairro"}
            </Badge>
            {store.verified && (
              <span className="flex items-center gap-1 rounded-full bg-[#F0FDF4]/95 px-2.5 py-0.5 text-[11px] font-semibold text-[#15803D]">
                <ShieldCheck size={12} aria-hidden="true" /> Loja verificada
              </span>
            )}
            {!store.is_open && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-semibold" data-testid="store-closed-badge">
                Fechado agora
              </span>
            )}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight md:text-3xl">{store.name}</h1>
          <p className="text-sm text-[#CBD5E1]">{store.tagline}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#FDBA74]">
            <Star size={12} fill="currentColor" aria-hidden="true" /> {store.rating.toFixed(1)}
            <span className="font-normal text-[#CBD5E1]">({store.reviews_count} avaliações)</span>
          </p>
        </div>
      </section>

      {/* Regras da loja */}
      <section className="grid gap-3 md:grid-cols-3" data-testid="store-rules">
        <div className="rounded-2xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Clock size={16} className="text-[#D9531E]" aria-hidden="true" /> Horário de funcionamento
          </p>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="store-hours-display">{store.opening_hours}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MapPin size={16} className="text-[#D9531E]" aria-hidden="true" /> Onde está
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{store.address || store.neighborhood}</p>
        </div>
        <div className="rounded-2xl bg-[#FFF7ED] p-4 text-[#7C2D12]" data-testid="store-shipping-display">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Truck size={16} aria-hidden="true" /> Regras de frete
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-[#9A3412]">
            <li>Taxa fixa da loja: {formatBRL(store.delivery_fee)} + adicional do bairro</li>
            {store.free_delivery_min > 0 && <li>Frete grátis acima de {formatBRL(store.free_delivery_min)}</li>}
            {store.min_order > 0 && <li>Pedido mínimo: {formatBRL(store.min_order)}</li>}
            <li>{store.pickup_available ? "Retirada na loja disponível (grátis)" : "Somente entrega"}</li>
          </ul>
        </div>
      </section>

      {/* Catálogo da loja */}
      <section data-testid="store-products">
        <h2 className="font-heading text-xl font-bold tracking-tight">Produtos da loja</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {productsQ.isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />)}
          {productsQ.isError && (
            <div className="col-span-full rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              Não foi possível carregar os produtos.
              <button onClick={() => productsQ.refetch()} className="ml-2 font-semibold text-[#C2410C] hover:underline">
                Tentar de novo
              </button>
            </div>
          )}
          {productsQ.data?.length === 0 && (
            <p className="col-span-full rounded-2xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Esta loja ainda não publicou produtos.
            </p>
          )}
          {productsQ.data?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
