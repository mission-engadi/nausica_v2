"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { submitInvitationAction } from "@/lib/actions";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";

export default function InvitationForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        church: "",
        startDate: "",
        endDate: "",
        location: ""
    });

    // Helper: Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Date Range
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
            toast.error("Errore date", {
                description: "La data di fine non può essere precedente alla data di inizio."
            });
            return;
        }

        const oneMonthLater = new Date(start);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        if (end > oneMonthLater) {
            toast.error("Periodo troppo lungo", {
                description: "Il periodo dell'evento non può superare un mese di durata."
            });
            return;
        }

        setLoading(true);
        try {
            const result = await submitInvitationAction(formData, turnstileToken ?? "");

            if (result.success) {
                toast.success("Richiesta inviata con successo!");
                setSuccess(true);
                setFormData({ name: "", email: "", church: "", startDate: "", endDate: "", location: "" });
            } else {
                toast.error("Errore di invio", {
                    description: result.error ?? "Si è verificato un errore. Controlla la tua connessione e riprova."
                });
            }
        } catch (error) {
            console.error("Error submitting invitation:", error);
            toast.error("Errore di invio", {
                description: "Si è verificato un errore. Controlla la tua connessione e riprova."
            });
        }
        setLoading(false);
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-navy rounded-[32px] lg:rounded-[40px] p-8 lg:p-12 text-center space-y-5 lg:space-y-6 text-white max-w-lg mx-auto shadow-2xl"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                >
                    <CheckCircle2 className="w-12 lg:w-16 h-12 lg:h-16 text-secondary mx-auto" />
                </motion.div>
                <h3 className="text-2xl lg:text-3xl font-black italic">Richiesta Inviata!</h3>
                <p className="opacity-70 text-sm lg:text-base">
                    Grazie per averci contattato. Prenderemo in visione la tua richiesta e ti risponderemo il prima possibile.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-secondary font-bold hover:underline text-sm lg:text-base"
                >
                    Invia un'altra richiesta
                </button>
            </motion.div>
        );
    }

    return (
            <section className="py-16 lg:py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6 lg:space-y-8 order-2 lg:order-1"
                    >
                        <div className="space-y-3 lg:space-y-4">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy uppercase tracking-tighter leading-none">
                                Invita <span className="text-secondary">Nausica</span>
                            </h2>
                            <p className="text-base lg:text-lg text-slate-500 max-w-md">
                                Se desideri invitare Nausica per un evento, una conferenza o un incontro, compila il modulo sottostante con tutti i dettagli necessari.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:gap-6">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-100 italic"
                            >
                                <span className="text-secondary font-black block text-lg lg:text-2xl mb-0.5 lg:mb-1">Passione</span>
                                <span className="text-[10px] lg:text-xs text-navy/40 font-bold uppercase tracking-widest">Per le anime</span>
                            </motion.div>
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-100 italic"
                            >
                                <span className="text-secondary font-black block text-lg lg:text-2xl mb-0.5 lg:mb-1">Verità</span>
                                <span className="text-[10px] lg:text-xs text-navy/40 font-bold uppercase tracking-widest">Senza compromessi</span>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        onSubmit={handleSubmit}
                        className="bg-navy rounded-[32px] lg:rounded-[40px] p-6 lg:p-8 xl:p-12 shadow-2xl space-y-5 lg:space-y-6 order-1 lg:order-2"
                    >
                        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Il tuo nome"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="email@esempio.it"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Chiesa / Organizzazione</label>
                            <input
                                required
                                type="text"
                                placeholder="Nome chiesa o organizzazione"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                                value={formData.church}
                                onChange={(e) => setFormData({ ...formData, church: e.target.value })}
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Da (Inizio)</label>
                                <input
                                    required
                                    type="date"
                                    min={today}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors [color-scheme:dark] text-sm lg:text-base"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">A (Fine)</label>
                                <input
                                    required
                                    type="date"
                                    min={formData.startDate || today}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors [color-scheme:dark] text-sm lg:text-base"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Luogo / Città</label>
                            <input
                                required
                                type="text"
                                placeholder="Indirizzo o città dell'evento"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                            onSuccess={(token) => setTurnstileToken(token)}
                            onError={() => setTurnstileToken(null)}
                            onExpire={() => setTurnstileToken(null)}
                        />

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading || !turnstileToken}
                            className="w-full bg-secondary text-navy font-black py-3 lg:py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-3 lg:mt-4"
                        >
                            {loading ? "Invio in corso..." : "Invia Invito"}
                            <Send className="w-4 lg:w-5 h-4 lg:h-5" />
                        </motion.button>
                    </motion.form>
                </div>
            </section>
        );
}
