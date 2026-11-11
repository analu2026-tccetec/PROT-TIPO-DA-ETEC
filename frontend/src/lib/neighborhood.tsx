// Bairro de entrega selecionado pelo visitante — persistido em localStorage.
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Neighborhood } from "@/lib/types";

const KEY = "vitrine:bairro";

interface NeighborhoodContextValue {
  neighborhood: string;
  prazo: string | undefined;
  surcharge: number | undefined;
  neighborhoods: Neighborhood[];
  setNeighborhood: (name: string) => void;
}

const NeighborhoodContext = createContext<NeighborhoodContextValue | null>(null);

export function NeighborhoodProvider({ children }: { children: ReactNode }) {
  const [neighborhood, setNeighborhoodState] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem(KEY) ?? "Centro" : "Centro"),
  );

  // Os bairros e prazos são da cidade — fonte única no backend.
  const { data } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: () => apiGet<Neighborhood[]>("/neighborhoods"),
    staleTime: 5 * 60_000,
  });

  const value = useMemo<NeighborhoodContextValue>(() => {
    const current = data?.find((n) => n.name === neighborhood);
    return {
      neighborhood,
      prazo: current?.prazo,
      surcharge: current?.surcharge,
      neighborhoods: data ?? [],
      setNeighborhood: (name: string) => {
        setNeighborhoodState(name);
        try {
          localStorage.setItem(KEY, name);
        } catch {
          /* storage indisponível: mantém só em memória */
        }
      },
    };
  }, [data, neighborhood]);

  return <NeighborhoodContext.Provider value={value}>{children}</NeighborhoodContext.Provider>;
}

export function useNeighborhood(): NeighborhoodContextValue {
  const ctx = useContext(NeighborhoodContext);
  if (!ctx) throw new Error("useNeighborhood deve ser usado dentro de NeighborhoodProvider");
  return ctx;
}
