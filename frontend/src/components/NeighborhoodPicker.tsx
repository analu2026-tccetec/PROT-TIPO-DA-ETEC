import { useQuery } from "@tanstack/react-query";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { useNeighborhood } from "@/lib/neighborhood";
import { cn } from "@/lib/utils";
import type { Neighborhood } from "@/lib/types";

export default function NeighborhoodPicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { neighborhood, setNeighborhood } = useNeighborhood();
  const { data, isLoading } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: () => apiGet<Neighborhood[]>("/neighborhoods"),
  });

  const choose = (name: string) => {
    setNeighborhood(name);
    onOpenChange(false);
    toast.success(`Entregas em: ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="neighborhood-modal-select">
        <DialogHeader>
          <DialogTitle>Escolha o bairro da entrega</DialogTitle>
          <DialogDescription>
            O adicional por bairro é somado à taxa fixa de cada loja. A taxa final aparece no carrinho
            e no checkout.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {isLoading && <div className="h-40 animate-pulse rounded-xl bg-muted" />}
          {data?.map((n, i) => {
            const active = neighborhood === n.name;
            return (
              <button
                key={n.name}
                type="button"
                data-testid={`neighborhood-option-${i}`}
                onClick={() => choose(n.name)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  active ? "border-[#D9531E] bg-secondary" : "hover:bg-accent",
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{n.name}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>+ {formatBRL(n.surcharge)} sobre a taxa da loja</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} aria-hidden="true" /> {n.prazo}
                    </span>
                  </span>
                </span>
                {active && <Check size={18} className="shrink-0 text-[#D9531E]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <p className="rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs text-[#7C2D12]">
          Opção de <strong>Retirada na Loja</strong> (Click &amp; Collect, frete grátis) disponível no
          checkout para as lojas que oferecem.
        </p>
      </DialogContent>
    </Dialog>
  );
}
