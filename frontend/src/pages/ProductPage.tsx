import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { useNeighborhood } from "@/lib/neighborhood";
import type { Product, ProductDetail, Store } from "@/lib/types";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { add } = useCart();
  const { neighborhood, surcharge } = useNeighborhood();
  const [qty, setQty] = useState(1);

  const productQ = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiGet<ProductDetail>(`/products/${id}`),
    enabled: !!id,
  });

  const product = productQ.data;
  const store = product?.store ?? null;

  const relatedQ = useQuery({
    queryKey: ["products", { store_id: store?.id, limit: 8 }],
    queryFn: () => apiGet<Product[]>(`/products?store_id=${store?.id}&limit=8`),
    enabled: !!store,
  });

  if (productQ.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (productQ.isError || !product) {
    return (
      <div className="rounded-2xl border bg-card px-4 py-10 text-center">
        <p className="font-heading text-lg font-bold">Produto não encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">Ele pode ter saído do catálogo.</p>
        <Button variant="outline" className="mt-4" onClick={() => productQ.refetch()}>
          Recarregar
        </Button>
      </div>
    );
  }

  const soldOut = product.stock <= 0 || !product.available;
  const baseFee = store ? store.delivery_fee + (surcharge ?? 0) : 0;
  const freeFrom = store && store.free_delivery_min > 0 ? store.free_delivery_min : null;

  const addToCart = () => {
    if (soldOut) return;
    add(product, qty);
    toast.success("Adicionado à sacola", { description: `${product.name} × ${qty}` });
  };

  return (
    <div className="space-y-8">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-[#C2410C]">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar ao catálogo
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-muted">
          <img src={product.image_url} alt={product.name} className="aspect-square h-full w-full object-cover" />
          {product.featured && (
            <Badge className="absolute left-3 top-3 border-0 bg-[#FEF3C7] text-amber-900">Destaque local</Badge>
          )}
        </div>

        <div className="space-y-5">
          <div>
            {store && (
              <Link
                to={`/loja/${store.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1EB] px-3 py-1 text-xs font-semibold text-[#C2410C]"
              >
                <StoreBadgeIcon store={store} /> {store.name} • ★ {store.rating.toFixed(1)}
              </Link>
            )}
            <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight">{product.name}</h1>
            <p className="mt-3 font-heading text-3xl font-black tracking-tight text-amber-900">
              {formatBRL(product.price)}
              <span className="text-sm font-semibold text-muted-foreground">/{product.unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              No cartão em até 3× de {formatBRL(product.price / 3)} sem juros (simulado) • Pix com confirmação na hora
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {soldOut ? (
              <Badge variant="destructive" data-testid="product-stock-badge">Esgotado</Badge>
            ) : (
              <Badge variant="secondary" data-testid="product-stock-badge">
                Em estoque: {product.stock} {product.unit}
              </Badge>
            )}
            {store && !store.is_open && (
              <Badge variant="outline">Loja fechada agora — pedidos caem na fila</Badge>
            )}
          </div>

          {/* Quantidade + adicionar (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center rounded-full border" data-testid="product-qty-stepper">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                data-testid="product-qty-decrease"
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="grid h-11 w-11 place-items-center transition-transform active:scale-90"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="w-8 text-center text-sm font-bold" data-testid="product-qty-value">{qty}</span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                data-testid="product-qty-increase"
                onClick={() => setQty((v) => Math.min(50, v + 1))}
                className="grid h-11 w-11 place-items-center transition-transform active:scale-90"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <Button
              size="lg"
              disabled={soldOut}
              onClick={addToCart}
              data-testid={`add-to-cart-btn-${product.id}`}
              className="flex-1 rounded-full transition-transform active:scale-95"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              Adicionar à sacola • {formatBRL(product.price * qty)}
            </Button>
          </div>

          {/* Frete */}
          {store && (
            <div className="rounded-2xl bg-[#FFF7ED] p-4 text-[#7C2D12]" data-testid="frete-estimate-display">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck size={16} aria-hidden="true" /> Entrega em {neighborhood}: {formatBRL(baseFee)}
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-[#9A3412]">
                <li className="flex items-center gap-1.5">
                  <Clock size={12} aria-hidden="true" /> Prazo estimado após confirmação do pagamento
                </li>
                {freeFrom ? (
                  <li>Frete grátis em compras acima de {formatBRL(freeFrom)} nesta loja</li>
                ) : (
                  <li>Taxa fixa por entrega definida pela loja</li>
                )}
                {store.pickup_available && (
                  <li>Retirada na loja (Click &amp; Collect): grátis, pronto em ~1h</li>
                )}
              </ul>
            </div>
          )}

          {/* Loja */}
          {store && (
            <Link
              to={`/loja/${store.slug}`}
              data-testid="product-store-card"
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition-shadow hover:shadow-md"
            >
              <img src={store.image_url} alt={store.name} className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-semibold">
                  {store.name}
                  {store.verified && <ShieldCheck size={14} className="text-emerald-600" aria-hidden="true" />}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  <MapPin size={11} className="mr-1 inline" aria-hidden="true" />
                  {store.neighborhood} • {store.opening_hours}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-amber-700">
                <Star size={14} fill="currentColor" aria-hidden="true" /> {store.rating.toFixed(1)}
              </span>
            </Link>
          )}

          <div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500">Sobre o produto</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{product.description || "Sem descrição."}</p>
          </div>
        </div>
      </div>

      {/* Mais desta loja */}
      {relatedQ.data && relatedQ.data.filter((p) => p.id !== product.id).length > 0 && (
        <section data-testid="related-products-section">
          <h2 className="font-heading text-xl font-bold tracking-tight">Mais desta loja</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {relatedQ.data
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}

      {/* Barra de ação fixa (mobile, acima da navegação inferior) */}
      <div className="fixed inset-x-0 bottom-[62px] z-30 border-t bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex items-center rounded-full border">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              data-testid="product-qty-decrease-mobile"
              onClick={() => setQty((v) => Math.max(1, v - 1))}
              className="grid h-10 w-10 place-items-center"
            >
              <Minus size={15} aria-hidden="true" />
            </button>
            <span className="w-7 text-center text-sm font-bold">{qty}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              data-testid="product-qty-increase-mobile"
              onClick={() => setQty((v) => Math.min(50, v + 1))}
              className="grid h-10 w-10 place-items-center"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
          </div>
          <Button
            disabled={soldOut}
            onClick={addToCart}
            data-testid="add-to-cart-sticky"
            className="flex-1 rounded-full transition-transform active:scale-95"
          >
            <ShoppingBag size={17} aria-hidden="true" />
            {soldOut ? "Esgotado" : `Adicionar • ${formatBRL(product.price * qty)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StoreBadgeIcon({ store }: { store: Store }) {
  return (
    <span>
      {store.store_type === "loja_ancora" ? "Loja Âncora" : "Comércio de Bairro"} •
    </span>
  );
}
