import { Link } from "react-router-dom";
import { Clock, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Store } from "@/lib/types";

export default function StoreCard({ store }: { store: Store }) {
  const anchor = store.store_type === "loja_ancora";
  return (
    <Link
      to={`/loja/${store.slug}`}
      data-testid={`store-card-${store.slug}`}
      className="flex gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <img
        src={store.image_url}
        alt={store.name}
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            className={
              anchor
                ? "bg-slate-900 text-white border-0"
                : "bg-[#FFF1EB] text-[#C2410C] border-0"
            }
          >
            {anchor ? "Loja Âncora" : "Comércio de Bairro"}
          </Badge>
          {store.verified && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <ShieldCheck size={13} aria-hidden="true" /> Verificada
            </span>
          )}
        </div>
        <h3 className="mt-1 truncate font-heading text-sm font-bold text-slate-900">{store.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{store.tagline}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-amber-700">
            <Star size={12} fill="currentColor" aria-hidden="true" /> {store.rating.toFixed(1)} ({store.reviews_count})
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> {store.opening_hours}
          </span>
        </div>
      </div>
    </Link>
  );
}
