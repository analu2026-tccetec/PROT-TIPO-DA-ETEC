import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Info, Pencil, Plus, Store as StoreIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import { formatBRL, formatDateTime } from "@/lib/format";
import type { Order, OrderStatus, Product, Store } from "@/lib/types";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  preparando: "Preparando",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  delivery: "Na entrega",
};

const STORE_KEY = "vitrine:loja";

export default function VendorPanel() {
  const queryClient = useQueryClient();
  const [storeId, setStoreId] = useState<string>(() => localStorage.getItem(STORE_KEY) ?? "");
  const [tab, setTab] = useState("produtos");

  // Form de produto
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", price: "", stock: "", unit: "un", description: "", image_url: "", featured: false });

  // Form de configurações
  const [settings, setSettings] = useState({ delivery_fee: "", free_delivery_min: "", min_order: "", opening_hours: "", tagline: "", pickup_available: true, is_open: true });

  const storesQ = useQuery({
    queryKey: ["vendor-stores"],
    queryFn: () => apiGet<Store[]>("/vendor/stores"),
  });
  const stores = storesQ.data ?? [];

  useEffect(() => {
    if (stores.length > 0 && !stores.some((s) => s.id === storeId)) {
      setStoreId(stores[0].id);
    }
  }, [stores, storeId]);

  const store = stores.find((s) => s.id === storeId);

  const productsQ = useQuery({
    queryKey: ["vendor-products", storeId],
    queryFn: () => apiGet<Product[]>(`/vendor/${storeId}/products`),
    enabled: !!storeId,
  });

  const ordersQ = useQuery({
    queryKey: ["vendor-orders", storeId],
    queryFn: () => apiGet<Order[]>(`/vendor/${storeId}/orders`),
    enabled: !!storeId,
  });

  const selectStore = (id: string) => {
    setStoreId(id);
    try {
      localStorage.setItem(STORE_KEY, id);
    } catch { /* ignore */ }
  };

  const invalidate = (key: unknown[]) => queryClient.invalidateQueries({ queryKey: key });

  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price.replace(",", ".")),
        stock: Math.max(0, Number(form.stock || "0")),
        unit: form.unit || "un",
        image_url: form.image_url.trim(),
        featured: form.featured,
        available: editing ? editing.available : true,
      };
      if (editing) {
        return apiPatch<Product>(`/vendor/${storeId}/products/${editing.id}`, payload);
      }
      return apiPost<Product>(`/vendor/${storeId}/products`, payload);
    },
    onSuccess: (_data, _vars) => {
      toast.success(editing ? "Produto atualizado" : "Produto publicado");
      setDialogOpen(false);
      invalidate(["vendor-products", storeId]);
      invalidate(["products"]);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const patchProduct = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      apiPatch<Product>(`/vendor/${storeId}/products/${id}`, patch),
    onSuccess: () => {
      invalidate(["vendor-products", storeId]);
      invalidate(["products"]);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => apiDelete(`/vendor/${storeId}/products/${id}`),
    onSuccess: () => {
      toast.success("Produto removido do catálogo");
      invalidate(["vendor-products", storeId]);
      invalidate(["products"]);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const setOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      apiPatch<Order>(`/vendor/${storeId}/orders/${orderId}`, { status }),
    onSuccess: (o) => {
      toast.success(`Pedido ${o.code}: ${ORDER_STATUS_LABELS[o.status]}`);
      invalidate(["vendor-orders", storeId]);
      invalidate(["order"]);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const saveSettings = useMutation({
    mutationFn: () =>
      apiPatch<Store>(`/vendor/${storeId}`, {
        delivery_fee: Number(settings.delivery_fee.replace(",", ".")),
        free_delivery_min: Number(settings.free_delivery_min.replace(",", ".")),
        min_order: Number(settings.min_order.replace(",", ".")),
        opening_hours: settings.opening_hours,
        tagline: settings.tagline,
        pickup_available: settings.pickup_available,
        is_open: settings.is_open,
      }),
    onSuccess: () => {
      toast.success("Configurações da loja salvas");
      invalidate(["vendor-stores"]);
      invalidate(["stores"]);
      invalidate(["store"]);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price: "", stock: "", unit: "un", description: "", image_url: "", featured: false });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price).replace(".", ","),
      stock: String(p.stock),
      unit: p.unit,
      description: p.description,
      image_url: p.image_url,
      featured: p.featured,
    });
    setDialogOpen(true);
  };

  const syncSettingsFromStore = (s: Store) => {
    setSettings({
      delivery_fee: String(s.delivery_fee).replace(".", ","),
      free_delivery_min: String(s.free_delivery_min).replace(".", ","),
      min_order: String(s.min_order).replace(".", ","),
      opening_hours: s.opening_hours,
      tagline: s.tagline,
      pickup_available: s.pickup_available,
      is_open: s.is_open,
    });
  };

  useEffect(() => {
    if (store) syncSettingsFromStore(store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, stores.length]);

  return (
    <div className="space-y-5" data-testid="vendor-panel">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Painel do Lojista</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre produtos, acompanhe pedidos e ajuste frete e horários da sua loja.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 border-amber-300 bg-[#FEF3C7] text-amber-900">
          <Info size={13} aria-hidden="true" /> Modo demonstração — sem login
        </Badge>
      </header>

      {/* Seletor de loja */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <StoreIcon size={16} className="text-[#D9531E]" aria-hidden="true" /> Loja gerenciada:
        </span>
        <Select value={storeId} onValueChange={selectStore}>
          <SelectTrigger className="w-full max-w-xs" data-testid="vendor-panel-store-select" aria-label="Escolher loja">
            <SelectValue>{(v: string | null) => stores.find((s) => s.id === (v ?? storeId))?.name ?? "Carregando…"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {store && (
          <Badge variant="secondary" data-testid="vendor-panel-store-type">
            {store.store_type === "loja_ancora" ? "Loja Âncora" : "Comércio de Bairro"} • {store.neighborhood}
          </Badge>
        )}
      </section>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="produtos" data-testid="vendor-tab-products">Produtos</TabsTrigger>
          <TabsTrigger value="pedidos" data-testid="vendor-tab-orders">Pedidos</TabsTrigger>
          <TabsTrigger value="loja" data-testid="vendor-tab-settings">Minha loja</TabsTrigger>
        </TabsList>

        {/* PRODUTOS */}
        <TabsContent value="produtos" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {productsQ.data?.length ?? 0} produtos publicados
            </p>
            <Button onClick={openCreate} data-testid="vendor-panel-add-product-btn" className="rounded-full transition-transform active:scale-95">
              <Plus size={16} aria-hidden="true" /> Novo produto
            </Button>
          </div>
          <div className="rounded-2xl border bg-card" data-testid="vendor-products-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>À venda</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQ.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="h-24 animate-pulse rounded-xl bg-muted" />
                    </TableCell>
                  </TableRow>
                )}
                {productsQ.data?.map((p) => (
                  <TableRow key={p.id} data-testid={`vendor-product-row-${p.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-medium">{p.name}</p>
                          {p.featured && <Badge variant="secondary" className="mt-0.5">Destaque</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-bold text-amber-900">
                      {formatBRL(p.price)}
                      <span className="text-xs font-normal text-muted-foreground">/{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          aria-label="Diminuir estoque"
                          data-testid={`vendor-product-stock-dec-${p.id}`}
                          onClick={() => patchProduct.mutate({ id: p.id, patch: { stock: Math.max(0, p.stock - 1) } })}
                        >
                          −
                        </Button>
                        <span className="w-8 text-center text-sm font-bold" data-testid={`vendor-product-stock-${p.id}`}>
                          {p.stock}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          aria-label="Aumentar estoque"
                          data-testid={`vendor-product-stock-inc-${p.id}`}
                          onClick={() => patchProduct.mutate({ id: p.id, patch: { stock: p.stock + 1 } })}
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={p.available}
                        onCheckedChange={(checked) => patchProduct.mutate({ id: p.id, patch: { available: !!checked } })}
                        aria-label="Produto à venda"
                        data-testid={`vendor-product-available-${p.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" aria-label="Editar produto" data-testid={`vendor-product-edit-${p.id}`} onClick={() => openEdit(p)}>
                          <Pencil size={14} aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label="Excluir produto" data-testid={`vendor-product-delete-${p.id}`} className="text-red-600" onClick={() => deleteProduct.mutate(p.id)}>
                          <Trash2 size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* PEDIDOS */}
        <TabsContent value="pedidos" className="space-y-3" data-testid="vendor-orders-list">
          {ordersQ.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-muted" />}
          {ordersQ.data?.length === 0 && (
            <p className="rounded-2xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum pedido ainda. Quando um cliente comprar dos seus produtos, ele aparece aqui.
            </p>
          )}
          {ordersQ.data?.map((o) => (
            <article key={o.id} className="rounded-2xl border bg-card p-4" data-testid={`vendor-order-card-${o.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-heading text-sm font-bold">{o.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customer_name} • {formatDateTime(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{PAYMENT_LABELS[o.payment_method]}</Badge>
                  <Select
                    value={o.status === "aguardando_pagamento" ? "preparando" : o.status}
                    onValueChange={(v) => setOrderStatus.mutate({ orderId: o.id, status: v as OrderStatus })}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="vendor-panel-order-status-toggle" aria-label="Status do pedido">
                      <SelectValue>{(v: string | null) => ORDER_STATUS_LABELS[(v ?? o.status) as OrderStatus]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(["preparando", "saiu_para_entrega", "entregue", "cancelado"] as OrderStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.items
                  .filter((it) => it.store_id === storeId)
                  .map((it) => (
                    <li key={it.product_id} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">
                        {it.quantity}× {it.name}
                      </span>
                      <span className="shrink-0 font-medium text-foreground">{formatBRL(it.price * it.quantity)}</span>
                    </li>
                  ))}
              </ul>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                <span>
                  {o.pickup ? "Retirada na loja" : `Entrega: ${o.neighborhood}`}
                  {o.payment_status === "aguardando" ? " • aguardando Pix" : o.payment_status === "na_entrega" ? " • pagar na entrega" : " • pago"}
                </span>
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <CircleDollarSign size={13} aria-hidden="true" /> {formatBRL(o.total)}
                </span>
              </div>
            </article>
          ))}
        </TabsContent>

        {/* MINHA LOJA */}
        <TabsContent value="loja" data-testid="vendor-settings-form">
          <div className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vp-fee">Taxa fixa de entrega (R$)</Label>
              <Input
                id="vp-fee"
                value={settings.delivery_fee}
                onChange={(e) => setSettings((s) => ({ ...s, delivery_fee: e.target.value }))}
                inputMode="decimal"
                data-testid="vendor-panel-shipping-rate-input"
              />
              <p className="text-[11px] text-muted-foreground">Somada ao adicional por bairro na hora do checkout.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-free">Frete grátis acima de (R$) — 0 desativa</Label>
              <Input
                id="vp-free"
                value={settings.free_delivery_min}
                onChange={(e) => setSettings((s) => ({ ...s, free_delivery_min: e.target.value }))}
                inputMode="decimal"
                data-testid="vendor-panel-free-min-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-min">Pedido mínimo (R$)</Label>
              <Input
                id="vp-min"
                value={settings.min_order}
                onChange={(e) => setSettings((s) => ({ ...s, min_order: e.target.value }))}
                inputMode="decimal"
                data-testid="vendor-panel-min-order-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-hours">Horário de funcionamento</Label>
              <Input
                id="vp-hours"
                value={settings.opening_hours}
                onChange={(e) => setSettings((s) => ({ ...s, opening_hours: e.target.value }))}
                placeholder="Seg a Sáb, 8h às 18h"
                data-testid="vendor-panel-hours-input"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="vp-tagline">Frase da vitrine</Label>
              <Input
                id="vp-tagline"
                value={settings.tagline}
                onChange={(e) => setSettings((s) => ({ ...s, tagline: e.target.value }))}
                data-testid="vendor-panel-tagline-input"
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm" data-testid="vendor-panel-pickup-row">
              <Checkbox
                checked={settings.pickup_available}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, pickup_available: !!checked }))}
                data-testid="vendor-panel-pickup-checkbox"
              />
              Aceito retirada na loja (Click &amp; Collect)
            </label>
            <label className="flex items-center gap-2.5 text-sm" data-testid="vendor-panel-open-row">
              <Checkbox
                checked={settings.is_open}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, is_open: !!checked }))}
                data-testid="vendor-panel-open-checkbox"
              />
              Loja aberta agora
            </label>
            <div className="md:col-span-2">
              <Button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending || !storeId}
                data-testid="vendor-panel-save-settings"
                className="rounded-full transition-transform active:scale-95"
              >
                {saveSettings.isPending ? "Salvando…" : "Salvar configurações"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="vendor-product-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do produto da sua loja." : "Publique um produto na vitrine da sua loja."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vp-name">Nome</Label>
              <Input id="vp-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} data-testid="vendor-product-form-name" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vp-price">Preço (R$)</Label>
                <Input id="vp-price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} inputMode="decimal" data-testid="vendor-product-form-price" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vp-stock">Estoque</Label>
                <Input id="vp-stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} inputMode="numeric" data-testid="vendor-product-form-stock" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vp-unit">Unidade</Label>
                <Input id="vp-unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="un, kg, serviço" data-testid="vendor-product-form-unit" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-desc">Descrição</Label>
              <Input id="vp-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} data-testid="vendor-product-form-description" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-img">URL da imagem (opcional)</Label>
              <Input id="vp-img" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://…" data-testid="vendor-product-form-image" />
            </div>
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={form.featured} onCheckedChange={(checked) => setForm((f) => ({ ...f, featured: !!checked }))} data-testid="vendor-product-form-featured" />
              Destacar na vitrine (aparece na home)
            </label>
            <Button
              onClick={() => saveProduct.mutate()}
              disabled={saveProduct.isPending}
              data-testid="vendor-product-form-submit"
              className="rounded-full transition-transform active:scale-95"
            >
              {saveProduct.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Publicar produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
