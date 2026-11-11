import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, storeName }: { product: Product; storeName?: string }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0 || !product.available;

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      data-testid={`product-card-${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <Link to={`/produto/${product.id}`} className="block" aria-label={`Ver ${product.name}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.featured && !soldOut && (
            <Badge className="absolute left-2 top-2 bg-[#FEF3C7] text-amber-900 border-0">Destaque</Badge>
          )}
          {soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Esgotado
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to={`/produto/${product.id}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {product.name}
        </Link>
        {storeName && <span className="truncate text-xs text-muted-foreground">{storeName}</span>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="font-heading text-base font-black tracking-tight text-amber-900">
            {formatBRL(product.price)}
            <span className="text-[11px] font-semibold text-muted-foreground">/{product.unit}</span>
          </p>
          <Button
            size="icon-sm"
            disabled={soldOut}
            data-testid={`add-to-cart-btn-${product.id}`}
            aria-label={`Adicionar ${product.name} à sacola`}
            className="transition-transform active:scale-90"
            onClick={() => {
              add(product, 1);
              toast.success("Adicionado à sacola", { description: product.name });
            }}
          >
            <Plus size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
