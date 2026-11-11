import { ApiError } from "@/lib/api";

type FastApiDetail = string | { msg?: string }[] | null | undefined;

/** Extrai uma mensagem legível de ApiError (body {detail}) ou de qualquer Error. */
export function apiErrorMessage(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (err instanceof ApiError) {
    const detail = (err.body as { detail?: FastApiDetail } | null)?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d) => (typeof d?.msg === "string" ? d.msg : ""))
        .filter(Boolean);
      if (msgs.length) return msgs.join("; ");
    }
    if (err.status === 422) return "Verifique os campos do formulário.";
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
