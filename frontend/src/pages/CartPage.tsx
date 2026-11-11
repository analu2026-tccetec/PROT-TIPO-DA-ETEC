import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Minus, Plus, ShoppingBag, Store as StoreIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NeighborhoodPicker from "@/components/NeighborhoodPicker";
import { useState } from "react";
import { apiGet } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { useNeighborhood } from "@/lib/neighborhood";
import type { Store } from "@/lib/types";

export default function CartPage() {
  const { lines, setQty, remove, subtotal, count } = useCart();
  const { neighborhood, surcharge } = useNeighborhood();
  const [pickerOpen, setPickerOpen] = useState(false);

  const storesQ = useQuery({
    queryKey: ["stores", "all"],
    queryFn: () => apiGet<Store[]>("/stores"),
  });
  const storesById = new Map((storesQ.data ?? []).map((s) => [s.id, s]));

  const groups = useMemo(() => {
    const map = new Map<string, typeof lines>();
    for (const line of lines) {
      const arr = map.get(line.product.store_id) ?? [];
      arr.push(line);
      map.set(line.product.store_id, arr);
    }
    return Array.from(map.entries());
  }, [lines]);

  const shippingEstimate = (store: Store | undefined, storeSubtotal: number): number => {
    if (!store) return 0;
    if (store.free_delivery_min > 0 && storeSubtotal >= store.free_delivery_min) return 0;
    return store.delivery_fee + (surcharge ?? 0);
  };

  const shippingTotal = groups.reduce(
    (acc, [store_id, groupLines]) => acc + shippingEstimate(storesById.get(store_id), groupLines.reduce((s, l) => s + l.product.price * l.qty, 0)),
    0,
  );

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border bg-card px-4 py-14 text-center" data-testid="cart-empty-state">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFF1EB] text-[#D9531E]">
          <ShoppingBag size={28} aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-bold">Sua sacola está vazia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descubra o que o comércio de Cosmópolis tem para hoje.
        </p>
        <Link
          to="/catalogo"
          className="mt-5 inline-block rounded-full bg-[#D9531E] px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
          data-testid="cart-empty-cta"
        >
          Explorar o catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="cart-page-container">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Sua sacola</h1>
        <p className="text-sm text-muted-foreground">{count} {count === 1 ? "item" : "itens"} de {groups.length} {groups.length === 1 ? "loja" : "lojas"}</p>
      </header>

      {/* Bairro da entrega */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-[#7C2D12]">
        <p className="flex items-center gap-2 text-sm">
          <MapPin size={17} aria-hidden="true" />
          <span>
            Frete para <strong>{neighborhood}</strong> — troque o bairro se quiser
          </span>
        </p>
        <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} data-testid="cart-change-neighborhood">
          Trocar
        </Button>
      </div>

      {/* Lojas agrupadas */}
      <div className="space-y-4">
        {groups.map(([storeId, groupLines], gi) => {
          const store = storesById.get(storeId);
          const storeSubtotal = groupLines.reduce((s, l) => s + l.product.price * l.qty, 0);
          const fee = shippingEstimate(store, storeSubtotal);
          const belowMin = store && store.min_order > 0 && storeSubtotal < store.min_order;
          return (
            <section key={storeId} className="rounded-2xl border bg-card" data-testid={`cart-store-group-${gi}`}>
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <StoreIcon size={16} className="shrink-0 text-[#D9531E]" aria-hidden="true" />
                  {store ? (
                    <Link to={`/loja/${store.slug}`} className="truncate hover:underline">
                      {store.name}
                    </Link>
                  ) : (
                    <span className="truncate">Loja</span>
                  )}
                </p>
                {belowMin && (
                  <p className="shrink-0 text-xs font-semibold text-amber-700" data-testid={`cart-min-order-warning-${gi}`}>
                    Pedido mínimo: {formatBRL(store!.min_order)}
                  </p>
                )}
              </div>
              <ul className="divide-y">
                {groupLines.map((l) => (
                  <li key={l.product.id} className="flex items-center gap-3 px-4 py-3" data-testid={`cart-item-${l.product.id}`}>
                    <img src={l.product.image_url} alt={l.product.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/produto/${l.product.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
                        {l.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatBRL(l.product.price)}/{l.product.unit}</p>
                      <button
                        type="button"
                        onClick={() => remove(l.product.id)}
                        data-testid={`cart-item-remove-${l.product.id}`}
                        className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                      >
                        <Trash2 size={12} aria-hidden="true" /> Remover
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center rounded-full border">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          data-testid={`cart-item-qty-decrease-${l.product.id}`}
                          onClick={() => setQty(l.product.id, l.qty - 1)}
                          className="grid h-9 w-9 place-items-center transition-transform active:scale-90"
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold" data-testid={`cart-item-qty-${l.product.id}`}>
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          data-testid={`cart-item-qty-increase-${l.product.id}`}
                          onClick={() => setQty(l.product.id, l.qty + 1)}
                          className="grid h-9 w-9 place-items-center transition-transform active:scale-90"
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-amber-900">{formatBRL(l.product.price * l.qty)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
                <span>Subtotal da loja</span>
                <span data-testid={`cart-store-subtotal-${gi}`}>{formatBRL(storeSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between px-4 pb-3 text-xs text-muted-foreground">
                <span>Frete estimado ({neighborhood})</span>
                <span data-testid={`cart-store-shipping-${gi}`}>
                  {fee === 0 ? "Grátis" : formatBRL(fee)}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      {/* Resumo */}
      <section className="sticky bottom-[76px] rounded-2xl border bg-white p-4 shadow-sm md:sticky md:bottom-4" data-testid="cart-summary">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span data-testid="cart-subtotal-display">{formatBRL(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Frete estimado (todas as lojas)</span>
          <span data-testid="cart-shipping-fee-display">{shippingTotal === 0 ? "Grátis" : formatBRL(shippingTotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <span className="font-heading text-base font-bold">Total</span>
          <span className="font-heading text-xl font-black text-amber-900" data-testid="cart-total-display">
            {formatBRL(subtotal + shippingTotal)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          O frete final é calculado pelo backend no checkout, com as regras de cada loja.
        </p>
        <Link
          to="/checkout"
          data-testid="checkout-button"
          className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-[#D9531E] text-sm font-semibold text-white transition-transform active:scale-95"
        >
          Finalizar compra <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <NeighborhoodPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
