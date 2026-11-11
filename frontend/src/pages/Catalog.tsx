import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import { CategoryPills } from "@/components/CategoryPills";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, Product, Store } from "@/lib/types";

const SORT_LABELS: Record<string, string> = {
  novidades: "Novidades",
  preco_asc: "Menor preço",
  preco_desc: "Maior preço",
};

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const categoria = params.get("categoria") ?? "";
  const q = params.get("q") ?? "";
  const tab = params.get("tab") ?? "produtos";
  const [sort, setSort] = useState("novidades");
  const [search, setSearch] = useState(q);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });
  const storesQ = useQuery({
    queryKey: ["stores", "all"],
    queryFn: () => apiGet<Store[]>("/stores"),
  });

  const productsQ = useQuery({
    queryKey: ["products", { categoria, q, sort }],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (categoria) qs.set("category_id", categoria);
      if (q) qs.set("q", q);
      if (sort) qs.set("sort", sort);
      qs.set("limit", "60");
      return apiGet<Product[]>(`/products?${qs.toString()}`);
    },
  });

  const storeNames = new Map((storesQ.data ?? []).map((s) => [s.id, s.name]));

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    setParams(next);
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const activeCategory = categoriesQ.data?.find((c) => c.id === categoria);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {tab === "lojas" ? "Lojas de Cosmópolis" : activeCategory ? activeCategory.name : "Catálogo completo"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tab === "lojas"
            ? "Do comércio de bairro às lojas âncora — todas verificadas."
            : q
              ? `Resultados para “${q}”`
              : "Frete calculado por bairro no carrinho e no checkout."}
        </p>
      </header>

      {/* Alternância produtos / lojas */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border bg-card p-1">
          <button
            type="button"
            data-testid="catalog-tab-products"
            onClick={() => setParam("tab", "")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              tab !== "lojas" ? "bg-[#D9531E] text-white" : "text-slate-600",
            )}
          >
            Produtos
          </button>
          <button
            type="button"
            data-testid="catalog-tab-stores"
            onClick={() => setParam("tab", "lojas")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              tab === "lojas" ? "bg-[#D9531E] text-white" : "text-slate-600",
            )}
          >
            <StoreIcon size={14} aria-hidden="true" /> Lojas
          </button>
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]" data-testid="catalog-sort-select" aria-label="Ordenar por">
            <SelectValue>{SORT_LABELS[sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tab !== "lojas" && (
        <>
          <form onSubmit={onSearch} className="flex gap-2" role="search">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no catálogo…"
              aria-label="Buscar no catálogo"
              data-testid="catalog-search-input"
              className="h-11"
            />
            <Button type="submit" size="icon" aria-label="Buscar" className="h-11 w-11 shrink-0 transition-transform active:scale-95">
              <Search size={18} aria-hidden="true" />
            </Button>
          </form>
          {categoriesQ.data && (
            <CategoryPills categories={categoriesQ.data} activeId={categoria} onSelect={(id) => setParam("categoria", id)} />
          )}
        </>
      )}

      {/* Lista de lojas */}
      {tab === "lojas" ? (
        <div className="grid gap-3 md:grid-cols-2" data-testid="store-list">
          {storesQ.isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
          {storesQ.isError && (
            <div className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              Não foi possível carregar as lojas.
              <button onClick={() => storesQ.refetch()} className="ml-2 font-semibold text-[#C2410C] hover:underline">
                Tentar de novo
              </button>
            </div>
          )}
          {storesQ.data?.map((s) => <StoreCard key={s.id} store={s} />)}
        </div>
      ) : (
        /* Lista de produtos */
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="product-list">
          {productsQ.isLoading && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />)}
          {productsQ.isError && (
            <div className="col-span-full rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              Não foi possível carregar o catálogo.
              <button onClick={() => productsQ.refetch()} className="ml-2 font-semibold text-[#C2410C] hover:underline">
                Tentar de novo
              </button>
            </div>
          )}
          {productsQ.data?.length === 0 && (
            <div className="col-span-full rounded-2xl border bg-card px-4 py-10 text-center">
              <p className="font-heading text-lg font-bold">Nada encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente outra busca ou limpe os filtros.
              </p>
              <Button
                variant="outline"
                className="mt-4 transition-transform active:scale-95"
                data-testid="catalog-clear-filters"
                onClick={() => setParams(new URLSearchParams())}
              >
                Limpar filtros
              </Button>
            </div>
          )}
          {productsQ.data?.map((p) => (
            <ProductCard key={p.id} product={p} storeName={storeNames.get(p.store_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
