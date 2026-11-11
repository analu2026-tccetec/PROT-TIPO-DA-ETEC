import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheck, Camera, HandCoins, PackagePlus, Store } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import { useNeighborhood } from "@/lib/neighborhood";
import type { Category, Lead } from "@/lib/types";

const STEPS = [
  {
    icon: Store,
    title: "Cadastre sua loja",
    text: "Informe o nome, o bairro e o tipo (loja de bairro ou grande estabelecimento). Verificamos os dados e publicamos sua vitrine em até 1 dia útil.",
  },
  {
    icon: Camera,
    title: "Publique produtos e estoque",
    text: "No painel do lojista, cadastre produtos com foto, preço e estoque. Atualize a disponibilidade em um toque — tudo pelo celular.",
  },
  {
    icon: HandCoins,
    title: "Defina frete e horários",
    text: "Escolha sua taxa fixa de entrega, o valor mínimo para frete grátis e se aceita retirada na loja (Click & Collect).",
  },
  {
    icon: PackagePlus,
    title: "Receba e entregue",
    text: "Pedidos chegam no painel com pagamento em Pix, cartão ou na entrega. Acompanhe o status até a entrega no bairro do cliente.",
  },
];

const FAQ = [
  {
    q: "Quanto custa vender na Vitrine?",
    a: "Na demonstração, nada: cadastro gratuito, sem mensalidade e sem taxa sobre as vendas nos primeiros 90 dias (simulação).",
  },
  {
    q: "Como recebo o dinheiro dos pedidos?",
    a: "Pix cai direto na hora; cartão e pagamento na entrega são liquidados com a plataforma (simulação — nenhum pagamento real é processado).",
  },
  {
    q: "Preciso de CNPJ?",
    a: "Pequenos produtores e autônomos podem começar com CPF. Lojas âncora com CNPJ têm catálogo ampliado e destaque na seção Lojas Parceiras.",
  },
  {
    q: "Como funciona a verificação?",
    a: "Conferimos dados da loja e endereço em Cosmópolis-SP. Lojas verificadas recebem o selo verde e priorizadas nas buscas do bairro.",
  },
];

export default function Onboarding() {
  const { neighborhoods } = useNeighborhood();
  const [form, setForm] = useState({ business_name: "", owner_name: "", phone: "", category_id: "", neighborhood: "Centro", message: "" });

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });

  const submit = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<Lead>("/leads", body),
    onSuccess: () => {
      toast.success("Cadastro recebido! Nossa equipe fala com você pelo WhatsApp em até 1 dia útil.");
      setForm({ business_name: "", owner_name: "", phone: "", category_id: "", neighborhood: "Centro", message: "" });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.business_name.trim().length < 2) return toast.error("Informe o nome do negócio.");
    if (form.owner_name.trim().length < 2) return toast.error("Informe o nome do responsável.");
    if (form.phone.replace(/\D/g, "").length < 8) return toast.error("Informe um telefone válido.");
    submit.mutate({
      business_name: form.business_name.trim(),
      owner_name: form.owner_name.trim(),
      phone: form.phone.trim(),
      category_id: form.category_id || "hortifruti",
      neighborhood: form.neighborhood || "Centro",
      message: form.message.trim(),
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-3xl bg-[#1E293B] px-6 py-10 text-white md:px-10">
        <Badge className="border-0 bg-white/15 text-[#FDBA74]">Para lojistas de Cosmópolis-SP</Badge>
        <h1 className="mt-4 max-w-xl font-heading text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Venda na Vitrine Cosmópolis — do mercadinho à loja âncora
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[#CBD5E1] md:text-base">
          Um único ecossistema digital para o comércio da cidade: painel próprio, frete por bairro,
          Pix na hora e retirada na loja. Cadastro gratuito, sem burocracia.
        </p>
      </section>

      {/* Passos */}
      <section data-testid="onboarding-steps">
        <h2 className="font-heading text-xl font-bold tracking-tight">Como começa a vender em 4 passos</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-4 rounded-2xl border bg-card p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF1EB] font-heading text-sm font-black text-[#C2410C]">
                  {i + 1}
                </span>
                <div>
                  <p className="flex items-center gap-2 font-heading text-sm font-bold">
                    <Icon size={16} className="text-[#D9531E]" aria-hidden="true" /> {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Formulário de lead */}
      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold tracking-tight">Cadastre seu negócio</h2>
          <p className="text-sm text-muted-foreground">
            Preencha e nossa equipe entra em contato pelo WhatsApp para finalizar a verificação da loja.
          </p>
          <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-2" data-testid="onboarding-lead-form">
            <div className="space-y-1.5">
              <Label htmlFor="ld-business">Nome do negócio</Label>
              <Input id="ld-business" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} placeholder="Padaria Vila Real" data-testid="onboarding-lead-form-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-owner">Responsável</Label>
              <Input id="ld-owner" value={form.owner_name} onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))} placeholder="Seu nome" data-testid="onboarding-lead-form-owner" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-phone">WhatsApp / Telefone</Label>
              <Input id="ld-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(19) 99999-0000" inputMode="tel" data-testid="onboarding-lead-form-phone" />
            </div>
            <div className="space-y-1.5">
              <Label>Ramo principal</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
                <SelectTrigger data-testid="onboarding-lead-form-category" aria-label="Categoria">
                  <SelectValue>{(v: string | null) => categoriesQ.data?.find((c) => c.id === (v ?? form.category_id))?.name ?? "Escolha o ramo"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categoriesQ.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bairro da loja</Label>
              <Select value={form.neighborhood} onValueChange={(v) => setForm((f) => ({ ...f, neighborhood: v }))}>
                <SelectTrigger data-testid="onboarding-lead-form-neighborhood" aria-label="Bairro">
                  <SelectValue>{(v: string | null) => v ?? form.neighborhood}</SelectValue>
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ld-msg">Conte um pouco sobre sua loja (opcional)</Label>
              <Textarea id="ld-msg" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={3} data-testid="onboarding-lead-form-message" />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submit.isPending}
              data-testid="onboarding-lead-form-submit"
              className="h-12 rounded-full transition-transform active:scale-95 sm:col-span-2"
            >
              {submit.isPending ? "Enviando…" : "Quero vender na Vitrine"}
            </Button>
          </form>
        </div>

        {/* FAQ */}
        <aside className="space-y-2" data-testid="onboarding-faq">
          <h2 className="font-heading text-lg font-bold tracking-tight">Perguntas frequentes</h2>
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border bg-card p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-2">
                  {item.q}
                  <span className="text-[#D9531E] transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
          <p className="flex items-start gap-2 rounded-2xl bg-[#FFF7ED] p-4 text-xs text-[#7C2D12]">
            <BadgeCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Lojas verificadas recebem o selo verde, aparecem nas buscas do bairro e podem entrar na
            seção “Destaques do Comércio Local”.
          </p>
        </aside>
      </section>
    </div>
  );
}
