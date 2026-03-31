import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
});

export type InvitationInput = z.infer<typeof InvitationSchema>;
