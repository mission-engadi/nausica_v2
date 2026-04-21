"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, Building2, Globe, Landmark, MapPin, Heart } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useContentDoc } from "@/lib/useContentDoc";
import { createPayPalOrder, capturePayPalOrder } from "@/lib/actions";
import { toast } from "sonner";

const DEFAULTS = {
    iban: "IT46 C036 6901 6006 6072 8124 673",
    bic: "REVOITM2",
    bankName: "Revolut Bank UAB",
    bankAddress: "Via Dante 7, 20123, Milano (MI), Italy",
    correspondentBic: "CHASDEFX",
    paypalClientId: "",
};

const DONATION_AMOUNTS = ["10", "20", "50", "100"];

function PayPalDonateSection({ clientId }: { clientId: string }) {
    const [amount, setAmount] = useState("20");
    const [custom, setCustom] = useState("");
    const [donationDone, setDonationDone] = useState(false);

    const finalAmount = custom || amount;

    return (
        <div className="pt-8 border-t border-white/10 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                    <Heart className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Donazione Online</p>
                    <p className="text-sm font-bold text-white/90">Dona con PayPal</p>
                </div>
            </div>

            {donationDone ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-secondary/10 border border-secondary/20 text-center space-y-2"
                >
                    <CheckCircle2 className="w-10 h-10 text-secondary mx-auto" />
                    <p className="text-white font-black text-lg">Grazie per la tua donazione!</p>
                    <p className="text-white/60 text-sm">Il tuo contributo fa la differenza.</p>
                    <button
                        onClick={() => { setDonationDone(false); setCustom(""); setAmount("20"); }}
                        className="mt-2 text-xs text-white/40 hover:text-white transition-colors"
                    >
                        Fai un'altra donazione
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {DONATION_AMOUNTS.map((a) => (
                            <button
                                key={a}
                                onClick={() => { setAmount(a); setCustom(""); }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                    amount === a && !custom
                                        ? "bg-secondary text-navy border-secondary"
                                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                                }`}
                            >
                                €{a}
                            </button>
                        ))}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">€</span>
                            <input
                                type="number"
                                min="1"
                                placeholder="Altro"
                                value={custom}
                                onChange={(e) => setCustom(e.target.value)}
                                className="pl-7 pr-3 py-2 w-24 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-secondary transition-colors"
                            />
                        </div>
                    </div>

                    <PayPalScriptProvider options={{ clientId, currency: "EUR", intent: "capture" }}>
                        <PayPalButtons
                            style={{ layout: "horizontal", color: "gold", shape: "rect", label: "donate", height: 45 }}
                            createOrder={async () => {
                                const result = await createPayPalOrder(finalAmount);
                                if (result.error || !result.orderId) {
                                    toast.error("Errore PayPal: " + (result.error ?? "riprova"));
                                    throw new Error(result.error ?? "Order creation failed");
                                }
                                return result.orderId;
                            }}
                            onApprove={async (data) => {
                                const result = await capturePayPalOrder(data.orderID);
                                if (result.success) {
                                    setDonationDone(true);
                                } else {
                                    toast.error("Pagamento non completato. Riprova.");
                                }
                            }}
                            onError={() => toast.error("Errore PayPal. Riprova.")}
                        />
                    </PayPalScriptProvider>
                </div>
            )}
        </div>
    );
}

export default function DonationSection() {
    const [copied, setCopied] = useState<string | null>(null);
    const content = useContentDoc("donation", DEFAULTS);

    const bankDetails = [
        { id: "iban", label: "IBAN", value: content.iban, icon: Landmark, copyable: true },
        { id: "bic", label: "Codice BIC/SWIFT", value: content.bic, icon: Globe, copyable: true },
        { id: "bank", label: "Nome e sede della banca", value: `${content.bankName}\n${content.bankAddress}`, icon: Building2, copyable: false },
        { id: "correspondent", label: "BIC banca corrispondente", value: content.correspondentBic, icon: MapPin, copyable: true },
    ];

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <section id="donazioni" className="py-20 lg:py-32 bg-white overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-navy rounded-[40px] p-8 lg:p-16 shadow-2xl text-white relative overflow-hidden"
                >
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary rounded-full blur-[100px] opacity-10" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-10" />

                    <div className="relative z-10 space-y-12">
                        <div className="text-center space-y-6">
                            <h2 style={{ color: "white" }} className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-[1.1] italic uppercase">
                                Sostieni il <span className="text-secondary">Ministero</span> <br className="hidden sm:block" />
                                e diffondi la speranza di Cristo!
                            </h2>
                            <p className="text-white/60 max-w-2xl mx-auto text-sm lg:text-base leading-relaxed">
                                Ogni contributo, a prescindere dall'entità, fa una differenza significativa nella vita di coloro che serviamo. Il tuo sostegno ci permette di continuare a condividere il Vangelo e portare aiuti dove c'è più bisogno.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-secondary font-bold italic translate-y-[-10px]">
                                <span className="h-px w-8 bg-secondary/30" />
                                Grazie per la vostra generosità
                                <span className="h-px w-8 bg-secondary/30" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {bankDetails.map((detail) => (
                                <motion.div
                                    key={detail.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className={`relative p-6 rounded-2xl bg-white/5 border border-white/10 group transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 ${detail.id === "iban" || detail.id === "bank" ? "md:col-span-2" : ""}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
                                            <detail.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{detail.label}</p>
                                            <p className="text-sm sm:text-base font-bold text-white/90 whitespace-pre-line leading-relaxed">{detail.value}</p>
                                        </div>
                                        {detail.copyable && (
                                            <button
                                                onClick={() => handleCopy(detail.value, detail.id)}
                                                className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-secondary hover:text-navy transition-all relative overflow-hidden"
                                                title="Copia"
                                            >
                                                <AnimatePresence mode="wait">
                                                    {copied === detail.id ? (
                                                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                            <Copy className="w-4 h-4" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {copied === detail.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute -top-10 right-4 bg-secondary text-navy text-[10px] font-bold py-1 px-3 rounded-full shadow-lg"
                                            >
                                                Copiato!
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>

                        {content.paypalClientId && (
                            <PayPalDonateSection clientId={content.paypalClientId} />
                        )}

                        <div className="pt-8 border-t border-white/5">
                            <p className="text-white/40 text-[10px] lg:text-xs italic leading-relaxed text-center">
                                "La verità vi farà liberi" — Grazie alla vostra collaborazione, stiamo portando luce dove c'è oscurità.
                                Ogni donazione tramite bonifico bancario viene utilizzata interamente per le attività del ministero e la diffusione del Vangelo.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
