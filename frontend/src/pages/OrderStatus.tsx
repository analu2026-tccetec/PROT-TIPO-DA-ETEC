import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Copy, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FakeQR from "@/components/FakeQR";
import { apiGet, apiPost } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import { formatBRL, formatDateTime } from "@/lib/format";
import type { Order, OrderStatus, Store } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  preparando: "Em preparo",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const orderQ = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    enabled: !!id,
  });

  const storesQ = useQuery({
    queryKey: ["stores", "all"],
    queryFn: () => apiGet<Store[]>("/stores"),
  });

  const order = orderQ.data;

  const paySimulate = useMutation({
    mutationFn: () => apiPost<Order>(`/orders/${order?.id}/pay`),
    onSuccess: (o) => {
      toast.success("Pagamento Pix confirmado (simulação) — a loja já pode preparar!");
      queryClient.invalidateQueries({ queryKey: ["order", o.id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const pixCode = useMemo(() => {
    if (!order?.pix_txid) return "";
    return (
      `00020126580014BR.GOV.BCB.PIX0136${order.pix_txid}5204000053039865` +
      `5802BR5915VITRINE COSMOPOLIS6009COSMOPOLIS62070503***6304${order.code}`
    );
  }, [order?.pix_txid, order?.code]);

  if (orderQ.isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  }
  if (orderQ.isError || !order) {
    return (
      <div className="rounded-2xl border bg-card px-4 py-10 text-center">
        <p className="font-heading text-lg font-bold">Pedido não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => orderQ.refetch()}>
          Recarregar
        </Button>
      </div>
    );
  }

  const canceled = order.status === "cancelado";
  const stepIndex: Record<string, number> = {
    aguardando_pagamento: 1,
    preparando: 2,
    saiu_para_entrega: 3,
    entregue: 4,
  };
  const currentStep = canceled ? -1 : (stepIndex[order.status] ?? 1);

  const steps = [
    { label: "Pedido recebido" },
    { label: order.payment_method === "pix" ? "Pagamento Pix" : "Pagamento" },
    { label: "Em preparo" },
    { label: order.pickup ? "Pronto para retirada" : "Saiu para entrega" },
    { label: order.pickup ? "Retirado" : "Entregue" },
  ];

  const firstStore = storesQ.data?.find((s) => s.id === order.items[0]?.store_id);
  const waLink = firstStore
    ? `https://wa.me/${firstStore.phone}?text=${encodeURIComponent(`Olá! Fiz o pedido ${order.code} na Vitrine Cosmópolis.`)}`
    : null;

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      toast.success("Código Pix copiado (simulação)");
    } catch {
      toast.error("Não foi possível copiar agora");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5" data-testid="order-status-page">
      <header className="rounded-3xl border bg-card p-6 text-center">
        {canceled ? (
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600 text-2xl font-black">!</span>
        ) : (
          <CheckCircle2 size={56} className="mx-auto text-[#15803D]" aria-hidden="true" />
        )}
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight">
          {canceled ? "Pedido cancelado" : `Pedido confirmado!`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {order.code} • {formatDateTime(order.created_at)}
        </p>
        <Badge
          variant="secondary"
          data-testid="order-status-badge"
          className={cn("mt-3", canceled && "bg-red-50 text-red-700")}
        >
          {STATUS_LABELS[order.status]}
        </Badge>
      </header>

      {/* Bloco Pix pendente */}
      {order.payment_method === "pix" && order.payment_status === "aguardando" && !canceled && (
        <section className="rounded-3xl border bg-[#F0FDF4] p-5" data-testid="pix-payment-block">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-[#14532D]">
            Pague com Pix para liberar o preparo
          </h2>
          <p className="mt-1 text-xs text-[#166534]">
            Escaneie o QR Code no app do seu banco ou use o Pix Copia e Cola. Simulação — nenhum valor
            é cobrado.
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <FakeQR seed={order.pix_txid ?? order.code} className="h-40 w-40" />
            </div>
            <div className="w-full flex-1 space-y-2">
              <p className="rounded-xl border bg-white p-3 font-mono text-[11px] break-all text-slate-600" data-testid="pix-paste-code">
                {pixCode}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={copyPix} data-testid="pix-copy-key-button" className="transition-transform active:scale-95">
                  <Copy size={14} aria-hidden="true" /> Copiar código Pix
                </Button>
                <Button
                  size="sm"
                  onClick={() => paySimulate.mutate()}
                  disabled={paySimulate.isPending}
                  data-testid="pay-simulate-button"
                  className="bg-[#15803D] transition-transform active:scale-95"
                >
                  {paySimulate.isPending ? "Confirmando…" : "Já paguei — confirmar (simulação)"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Linha do tempo */}
      <section className="rounded-3xl border bg-card p-5" data-testid="order-timeline">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500">Acompanhamento</h2>
        <ol className="mt-4 space-y-0">
          {steps.map((step, i) => {
            const done = !canceled && i < currentStep;
            const current = !canceled && i === currentStep;
            const isPaymentStep = i === 1;
            const paymentDone =
              isPaymentStep && (order.payment_status === "pago" || order.payment_status === "na_entrega");
            return (
              <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
                {i < steps.length - 1 && <span className="absolute left-[11px] top-6 h-full w-0.5 bg-border" aria-hidden="true" />}
                <span
                  className={cn(
                    "z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold",
                    done || paymentDone
                      ? "border-[#15803D] bg-[#15803D] text-white"
                      : current
                        ? "border-[#D9531E] bg-white text-[#D9531E]"
                        : "border-border bg-white text-muted-foreground",
                  )}
                >
                  {done || paymentDone ? <Check size={12} aria-hidden="true" /> : i + 1}
                </span>
                <div>
                  <p className={cn("text-sm font-semibold", !done && !current && !paymentDone && "text-muted-foreground")}>
                    {step.label}
                    {current && <span className="ml-2 text-xs font-medium text-[#D9531E]">• agora</span>}
                  </p>
                  {isPaymentStep && (
                    <p className="text-xs text-muted-foreground">
                      {order.payment_status === "pago"
                        ? order.payment_method === "pix"
                          ? "Pix confirmado (simulação)"
                          : "Cartão aprovado (simulação)"
                        : order.payment_status === "na_entrega"
                          ? "Pagamento na entrega"
                          : "Aguardando o Pix (simulação)"}
                  </p>
                )}
                </div>
              </li>
            );
          })}
        </ol>
        {canceled && (
          <p className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            Este pedido foi cancelado pelo lojista. O estoque foi devolvido e nenhum valor é cobrado (simulação).
          </p>
        )}
      </section>

      {/* Itens e entrega */}
      <section className="rounded-3xl border bg-card p-5" data-testid="order-details">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500">Itens do pedido</h2>
        <ul className="mt-3 divide-y">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-3 py-2.5">
              <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.store_name} • {item.quantity} × {formatBRL(item.price)}
                </p>
              </div>
              <p className="text-sm font-bold text-amber-900">{formatBRL(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatBRL(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground">
            <span>Frete {order.pickup ? "(retirada na loja)" : ""}</span>
            <span data-testid="order-shipping-display">{order.shipping_total === 0 ? "Grátis" : formatBRL(order.shipping_total)}</span>
          </div>
          <div className="flex justify-between font-bold"><span>Total</span><span data-testid="order-total-display">{formatBRL(order.total)}</span></div>
        </div>
        <div className="mt-3 grid gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground sm:grid-cols-2">
          <p>
            <strong className="text-foreground">Entrega:</strong>{" "}
            {order.pickup ? "Retirada na loja (Click & Collect)" : `${order.address} — ${order.neighborhood}`}
          </p>
          <p>
            <strong className="text-foreground">Pagamento:</strong>{" "}
            {order.payment_method === "pix" ? "Pix" : order.payment_method === "card" ? "Cartão de crédito" : "Na entrega"}
          </p>
          <p><strong className="text-foreground">Cliente:</strong> {order.customer_name}</p>
          <p><strong className="text-foreground">Contato:</strong> {order.customer_phone}</p>
        </div>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="order-whatsapp-link"
            className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full border border-[#15803D]/30 bg-[#F0FDF4] text-sm font-semibold text-[#15803D] transition-transform active:scale-95"
          >
            <MessageCircle size={16} aria-hidden="true" /> Falar com a loja no WhatsApp
          </a>
        )}
      </section>

      <div className="flex justify-center gap-3 pb-2">
        <Link to="/catalogo" data-testid="order-continue-shopping" className="text-sm font-semibold text-[#C2410C] hover:underline">
          Continuar comprando
        </Link>
        <Link to="/painel-lojista" data-testid="order-go-vendor-panel" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:underline">
          <PackageCheck size={14} aria-hidden="true" /> Ver no painel do lojista
        </Link>
      </div>
    </div>
  );
}
