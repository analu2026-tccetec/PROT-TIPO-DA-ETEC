import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, Lock, QrCode, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { apiErrorMessage } from "@/lib/errors";
import { formatBRL } from "@/lib/format";
import { useNeighborhood } from "@/lib/neighborhood";
import { cn } from "@/lib/utils";
import type { Order, PaymentMethod, Store } from "@/lib/types";

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string; hint: string; icon: typeof QrCode; testId: string }> = [
  { id: "pix", label: "Pix", hint: "Aprovação instantânea — mais usado na região", icon: QrCode, testId: "checkout-payment-pix" },
  { id: "card", label: "Cartão de crédito", hint: "Simulação — nenhum dado real é enviado", icon: CreditCard, testId: "checkout-payment-card" },
  { id: "delivery", label: "Pagamento na entrega", hint: "Em dinheiro ou cartão, ao receber", icon: Banknote, testId: "checkout-payment-delivery" },
];

export default function Checkout() {
  const { lines, clear } = useCart();
  const { neighborhood, setNeighborhood, neighborhoods, surcharge } = useNeighborhood();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pickup, setPickup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const storesQ = useQuery({
    queryKey: ["stores", "all"],
    queryFn: () => apiGet<Store[]>("/stores"),
  });
  const storesById = new Map((storesQ.data ?? []).map((s) => [s.id, s]));

  const groups = new Map<string, number>();
  for (const l of lines) {
    groups.set(l.product.store_id, (groups.get(l.product.store_id) ?? 0) + l.product.price * l.qty);
  }
  const allStoresAllowPickup = Array.from(groups.keys()).every(
    (sid) => storesById.get(sid)?.pickup_available ?? false,
  );

  const feeFor = (storeId: string, storeSubtotal: number): number => {
    const store = storesById.get(storeId);
    if (!store) return 0;
    if (pickup) return 0;
    if (store.free_delivery_min > 0 && storeSubtotal >= store.free_delivery_min) return 0;
    return store.delivery_fee + (surcharge ?? 0);
  };

  const shippingTotal = Array.from(groups.entries()).reduce(
    (acc, [sid, sub]) => acc + feeFor(sid, sub),
    0,
  );
  const subtotal = Array.from(groups.values()).reduce((acc, v) => acc + v, 0);
  const total = subtotal + shippingTotal;

  const createOrder = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<Order>("/orders", body),
    onSuccess: (order) => {
      clear();
      if (order.payment_method === "pix") {
        toast.info("Escaneie o QR Code do Pix para liberar o preparo (simulação).");
      } else {
        toast.success(`Pedido ${order.code} confirmado!`);
      }
      navigate(`/pedido/${order.id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border bg-card px-4 py-14 text-center">
        <h1 className="font-heading text-xl font-bold">Sua sacola está vazia</h1>
        <p className="mt-1 text-sm text-muted-foreground">Adicione produtos para finalizar a compra.</p>
        <Link
          to="/catalogo"
          className="mt-5 inline-block rounded-full bg-[#D9531E] px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          Explorar o catálogo
        </Link>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return toast.error("Informe seu nome completo.");
    if (phone.replace(/\D/g, "").length < 8) return toast.error("Informe um telefone/WhatsApp válido.");
    if (!pickup && address.trim().length < 5) return toast.error("Informe o endereço de entrega.");
    if (paymentMethod === "card" && (cardNumber.replace(/\D/g, "").length < 12 || !cardExpiry || cardCvv.replace(/\D/g, "").length < 3)) {
      return toast.error("Preencha os dados do cartão (simulação).");
    }
    createOrder.mutate({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      neighborhood: pickup ? "" : neighborhood,
      address: pickup ? "" : address.trim(),
      pickup,
      payment_method: paymentMethod,
      items: lines.map((l) => ({ product_id: l.product.id, quantity: l.qty })),
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]" data-testid="checkout-page">
      <div className="space-y-6">
        <header>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Finalizar compra</h1>
          <p className="text-sm text-muted-foreground">Sem cadastro — informe só o necessário para a entrega.</p>
        </header>

        {/* Dados de entrega */}
        <section className="space-y-4 rounded-2xl border bg-card p-4">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500">Entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="co-name">Nome completo</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria da Silva" data-testid="checkout-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-phone">WhatsApp / Telefone</Label>
              <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(19) 99999-0000" inputMode="tel" data-testid="checkout-phone-input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="co-neighborhood">Bairro</Label>
              <Select value={neighborhood} onValueChange={(v) => setNeighborhood(v)} disabled={pickup}>
                <SelectTrigger data-testid="checkout-neighborhood-select" aria-label="Bairro de entrega">
                  <SelectValue>{(v: string | null) => v ?? neighborhood}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n.name} value={n.name}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-address">Endereço (rua, número, referência)</Label>
              <Input id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua dos Cedros, 145 — apto 3" disabled={pickup} data-testid="checkout-address-input" />
            </div>
          </div>
          <label className="flex items-start gap-2.5 text-sm" data-testid="checkout-pickup-row">
            <Checkbox checked={pickup} onCheckedChange={(checked) => setPickup(!!checked)} data-testid="checkout-pickup-checkbox" />
            <span>
              <span className="font-medium">Retirar na loja (Click &amp; Collect)</span>
              <span className="block text-xs text-muted-foreground">
                Frete grátis, pronto em ~1h. {allStoresAllowPickup ? "Disponível para as lojas da sua sacola." : "Indisponível: alguma loja da sacola só entrega."}
              </span>
            </span>
          </label>
        </section>

        {/* Pagamento */}
        <section className="space-y-3 rounded-2xl border bg-card p-4">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500">Pagamento</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={opt.testId}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl border p-3 text-left transition-transform active:scale-[0.98]",
                    active ? "border-[#D9531E] bg-secondary ring-2 ring-[#D9531E]/30" : "hover:bg-accent",
                  )}
                >
                  <span className={cn("flex items-center gap-1.5 text-sm font-bold", active ? "text-[#7C2D12]" : "")}>
                    <Icon size={16} aria-hidden="true" /> {opt.label}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{opt.hint}</span>
                </button>
              );
            })}
          </div>
          {paymentMethod === "card" && (
            <div className="grid gap-3 rounded-xl bg-muted/60 p-3 sm:grid-cols-2" data-testid="checkout-card-fields">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-card-number">Número do cartão (simulado)</Label>
                <Input id="co-card-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" inputMode="numeric" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-card-holder">Nome impresso no cartão</Label>
                <Input id="co-card-holder" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="MARIA S SILVA" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-card-expiry">Validade</Label>
                <Input id="co-card-expiry" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="12/28" inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-card-cvv">CVV</Label>
                <Input id="co-card-cvv" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" inputMode="numeric" />
              </div>
              <p className="text-[11px] text-muted-foreground sm:col-span-2">
                Demonstração: os dados do cartão não saem do navegador.
              </p>
            </div>
          )}
          {paymentMethod === "pix" && (
            <p className="rounded-xl bg-[#F0FDF4] p-3 text-xs text-[#14532D]" data-testid="checkout-pix-note">
              Ao confirmar, geramos um QR Code do Pix para você pagar no app do seu banco. O lojista
              libera o preparo na confirmação (simulação — nada é cobrado).
            </p>
          )}
        </section>
      </div>

      {/* Resumo */}
      <aside className="space-y-3 lg:sticky lg:top-28 lg:self-start">
        <section className="rounded-2xl border bg-card p-4" data-testid="checkout-summary">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500">Resumo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Array.from(groups.entries()).map(([sid, sub]) => {
              const fee = feeFor(sid, sub);
              return (
                <li key={sid} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-muted-foreground">{storesById.get(sid)?.name ?? "Loja"}</span>
                  <span>
                    {formatBRL(sub)} <span className="text-xs text-muted-foreground">+ frete {fee === 0 ? "grátis" : formatBRL(fee)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span data-testid="checkout-shipping-display">{shippingTotal === 0 ? "Grátis" : formatBRL(shippingTotal)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span className="font-heading text-lg font-black text-amber-900" data-testid="checkout-total-display">{formatBRL(total)}</span></div>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={createOrder.isPending}
            data-testid="checkout-submit-button"
            className="mt-4 h-12 w-full rounded-full transition-transform active:scale-95"
          >
            {createOrder.isPending ? "Enviando…" : paymentMethod === "pix" ? "Gerar Pix e confirmar pedido" : "Confirmar pedido"}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock size={11} aria-hidden="true" /> Ambiente protegido por HTTPS/SSL (simulação)
          </p>
        </section>
        <section className="rounded-2xl bg-[#FFF7ED] p-4 text-xs text-[#7C2D12]">
          <p className="flex items-center gap-1.5 font-semibold">
            <Truck size={13} aria-hidden="true" /> Entrega em {pickup ? "retirada na loja" : neighborhood}
          </p>
          <p className="mt-1">
            O frete considera a taxa fixa de cada loja + adicional do bairro. Lojas podem oferecer
            frete grátis acima de um valor mínimo.
          </p>
        </section>
      </aside>
    </form>
  );
}
