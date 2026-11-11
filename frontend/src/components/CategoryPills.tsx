import { Apple, Lamp, Scissors, Shirt, Smartphone, Sparkles, Store, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  hortifruti: Apple,
  moda: Shirt,
  beleza: Sparkles,
  casa: Lamp,
  eletronicos: Smartphone,
  artesanato: Scissors,
  servicos: Wrench,
};

const PILL =
  "flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-transform active:scale-95";
const ACTIVE = "border-transparent bg-[#D9531E] text-white shadow-none";

export function CategoryPills({
  categories,
  activeId,
  onSelect,
}: {
  categories: Category[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1" role="tablist" aria-label="Categorias">
      <button
        type="button"
        data-testid="category-pill-all"
        onClick={() => onSelect("")}
        className={cn(PILL, !activeId && ACTIVE)}
      >
        Tudo
      </button>
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c.id] ?? Store;
        const active = activeId === c.id;
        return (
          <button
            key={c.id}
            type="button"
            data-testid={`category-pill-${c.id}`}
            aria-pressed={active}
            onClick={() => onSelect(c.id)}
            className={cn(PILL, active && ACTIVE)}
          >
            <Icon size={15} aria-hidden="true" />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
