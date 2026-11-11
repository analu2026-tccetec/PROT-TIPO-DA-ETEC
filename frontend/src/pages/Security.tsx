import { Link } from "react-router-dom";
import { BadgeCheck, Eye, Lock, ShieldCheck, Store, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ITEMS = [
  {
    icon: Lock,
    title: "HTTPS/SSL obrigatório",
    text: "Todas as transações — navegação, checkout e painel do lojista — exigem conexão criptografada HTTPS com certificado SSL/TLS válido. O cadeado na barra do navegador confirma a conexão segura.",
    testId: "security-page-ssl-card",
  },
  {
    icon: Wallet,
    title: "Pagamentos protegidos",
    text: "No Pix, confira sempre se o nome do recebedor é o da loja parceira. Cartões são processados em ambiente simulado nesta demonstração — nenhum dado real sai do seu navegador.",
  },
  {
    icon: BadgeCheck,
    title: "Lojistas verificados",
    text: "Cada loja passa por verificação de endereço em Cosmópolis-SP antes de vender. Lojas verificadas exibem o selo verde com escudo na vitrine.",
  },
  {
    icon: Eye,
    title: "Seus dados, sem cadastro",
    text: "Comprar aqui não exige criar conta: o checkout pede apenas nome, contato e endereço de entrega, usados só para o pedido.",
  },
  {
    icon: Store,
    title: "Lojas reais da cidade",
    text: "Supermercados, farmácias, tech e lojas de bairro com atendimento e entrega local — falar direto com a loja pelo WhatsApp faz parte do fluxo.",
  },
  {
    icon: ShieldCheck,
    title: "Compra garantida",
    text: "Se algo der errado, o pedido fica registrado com código e status acompanháveis até a entrega, e o contato com a loja é direto.",
  },
];

export default function Security() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="security-page">
      <header className="rounded-3xl bg-[#1E293B] px-6 py-10 text-center text-white">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#15803D]/20 text-[#4ADE80]">
          <Lock size={28} aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">Segurança para comprar e vender</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#CBD5E1]">
          A Vitrine Cosmópolis trata segurança como requisito, não como detalhe: conexão criptografada,
          lojistas verificados e pagamentos transparentes.
        </p>
        <Badge data-testid="security-ssl-badge-page" variant="secondary" className="mt-4">
          Conexão segura • HTTPS/SSL
        </Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.title} className="rounded-2xl border bg-card p-5" data-testid={item.testId ?? "security-item-card"}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F0FDF4] text-[#15803D]">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-3 font-heading text-base font-bold">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl bg-[#FFF7ED] p-5 text-sm text-[#7C2D12]" data-testid="security-simulation-note">
        <strong>Nota sobre esta demonstração:</strong> nenhum pagamento real é processado, nenhum
        dado de cartão é transmitido e os pedidos/estoques são de exemplo. Em produção, o checkout
        rodaria sobre um gateway certificado PCI-DSS, sempre atrás de HTTPS.
      </section>

      <p className="text-center text-sm">
        <Link to="/catalogo" data-testid="security-back-link" className="font-semibold text-[#C2410C] hover:underline">
          Voltar às compras seguras →
        </Link>
      </p>
    </div>
  );
}
