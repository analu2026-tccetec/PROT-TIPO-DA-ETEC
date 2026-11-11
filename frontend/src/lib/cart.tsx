// Sacola do visitante (guest) — snapshot dos produtos, persistido em localStorage.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/lib/types";

export interface CartLine {
  product: Product;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  hasProduct: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "vitrine:sacola";
const MAX_QTY = 50;

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && typeof l.product?.id === "string" && l.qty > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage indisponível */
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const add = (product: Product, qty = 1) =>
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.product.id === product.id);
        if (idx === -1) return [...prev, { product, qty: Math.min(qty, MAX_QTY) }];
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(next[idx].qty + qty, MAX_QTY) };
        return next;
      });

    const setQty = (productId: string, qty: number) =>
      setLines((prev) => {
        const next = prev
          .map((l) => (l.product.id === productId ? { ...l, qty: Math.min(Math.max(qty, 1), MAX_QTY) } : l))
          .filter((l) => l.product.id !== productId || l.qty > 0);
        return next;
      });

    const remove = (productId: string) =>
      setLines((prev) => prev.filter((l) => l.product.id !== productId));

    const clear = () => setLines([]);

    return {
      lines,
      add,
      setQty,
      remove,
      clear,
      count: lines.reduce((acc, l) => acc + l.qty, 0),
      subtotal: lines.reduce((acc, l) => acc + l.product.price * l.qty, 0),
      hasProduct: (productId: string) => lines.some((l) => l.product.id === productId),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
