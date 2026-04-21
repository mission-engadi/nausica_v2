"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Copertura() {
    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy/5 text-navy mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter uppercase">
                        Copertura <span className="text-secondary">Spirituale</span>
                    </h2>

                    <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                        <p>
                            L'Apostolo Nausica Della Valle opera sotto la copertura spirituale di Cristo e dell'autorità apostolica della chiesa <strong className="text-navy">JCFAN</strong> di Mettmann, Germania.
                        </p>

                        <div className="py-4 border-y border-slate-200">
                            <h3 className="text-xl font-bold text-navy mb-2">JCFAN - Jesus Christus für alle Nationen</h3>
                            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">(Gesù Cristo per tutte le nazioni)</p>
                            <div className="mt-4">
                                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-1">Fondatori:</p>
                                <p className="text-lg font-bold text-navy">Apostolo Giovanni e pastora Lia Collura</p>
                                <p className="text-slate-500">Chiesa JCFAN - Mettmann, Germania</p>
                            </div>
                        </div>

                        <p className="text-base max-w-2xl mx-auto">
                            Questa copertura garantisce responsabilità, allineamento dottrinale e protezione spirituale nel ministero, assicurando che tutto ciò che viene fatto sia conforme alla volontà di Dio e alla sana dottrina biblica.
                        </p>
                    </div>

                    <div className="pt-8">
                        <a
                            href="https://jcfan.de/it/startseite-it/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-navy text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-navy/20 hover:bg-navy/90 hover:scale-105 transition-all"
                        >
                            Visita il Sito JCFAN
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
