import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="rounded-3xl border bg-card px-4 py-16 text-center" data-testid="not-found-page">
      <p className="font-heading text-5xl font-black text-[#D9531E]">404</p>
      <h1 className="mt-2 font-heading text-xl font-bold">Página não encontrada</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        O endereço que você tentou abrir não existe nesta vitrine.
      </p>
      <Link to="/">
        <Button className="mt-5 rounded-full transition-transform active:scale-95">Voltar ao início</Button>
      </Link>
    </div>
  );
}
