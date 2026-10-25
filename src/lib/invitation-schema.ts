import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Parses YYYY-MM-DD as a UTC date, rejecting impossible dates like 2026-02-30.
function parseDay(value: string): Date | null {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export const InvitationSchema = z.object({
  name: z
    .string()
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(100, "Nome troppo lungo (max 100 caratteri)"),
  email: z
    .string()
    .email("Email non valida")
    .max(254, "Email troppo lunga"),
  church: z
    .string()
    .min(2, "Inserisci il nome della chiesa o organizzazione")
    .max(200, "Nome troppo lungo (max 200 caratteri)"),
  startDate: z
    .string()
    .regex(DATE_REGEX, "Data di inizio non valida (usa formato YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(DATE_REGEX, "Data di fine non valida (usa formato YYYY-MM-DD)"),
  location: z
    .string()
    .min(2, "Inserisci il luogo o città")
    .max(200, "Luogo troppo lungo (max 200 caratteri)"),
}).superRefine((data, ctx) => {
  // Same rules as the form enforces client-side: end not before start, at most one month long.
  const start = parseDay(data.startDate);
  const end = parseDay(data.endDate);
  if (!start || !end) {
    ctx.addIssue({ code: "custom", message: "Data non valida", path: [!start ? "startDate" : "endDate"] });
    return;
  }
  if (end < start) {
    ctx.addIssue({ code: "custom", message: "La data di fine non può precedere la data di inizio", path: ["endDate"] });
    return;
  }
  const oneMonthLater = new Date(start);
  oneMonthLater.setUTCMonth(oneMonthLater.getUTCMonth() + 1);
  if (end > oneMonthLater) {
    ctx.addIssue({ code: "custom", message: "Il periodo non può superare un mese", path: ["endDate"] });
  }
});

export type InvitationInput = z.infer<typeof InvitationSchema>;
