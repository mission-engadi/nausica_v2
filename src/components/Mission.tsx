"use client";

import { Flame, Heart, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useContentDoc } from "@/lib/useContentDoc";

const CARD_ICONS = [Flame, Heart, Users, BookOpen];

const DEFAULTS = {
    paragraph1: "Dio sta portando un potente risveglio in Europa e in Italia. Il nostro ministero è completamente dedicato ad essere strumenti nelle Sue mani, operando con unzione, autorità e potenza soprannaturale.",
    paragraph2: "Crediamo fermamente che Gesù Cristo è lo stesso ieri, oggi e in eterno. La Sua potenza non è diminuita e il Suo desiderio di liberare, guarire e trasformare vite è ancora più forte oggi.",
    paragraph3: "Siamo chiamati a camminare in sottomissione totale alla Sua volontà, permettendoGli di muoversi secondo i Suoi propositi divini attraverso noi, manifestando il Suo Regno qui sulla terra.",
    cards: [
        { title: "Predicazione Potente", desc: "Proclamare il Vangelo con segni, prodigi e miracoli secondo Marco 16:15-18" },
        { title: "Liberazione e Guarigione", desc: "Portare libertà agli oppressi e guarigione ai malati nel nome di Gesù" },
        { title: "Formazione di Discepoli", desc: "Equipaggiare credenti e leader per essere potenti strumenti nelle mani di Dio" },
        { title: "Verità che Libera", desc: "Spezzare le catene della religiosità e portare le persone alla verità di Cristo" },
    ],
};

export default function Mission() {
    const content = useContentDoc("mission", DEFAULTS);
    const cards = content.cards.length > 0 ? content.cards : DEFAULTS.cards;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    return (
        <section className="py-32 bg-white flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto px-8 text-center space-y-12"
            >
                <h2 className="text-4xl md:text-6xl font-black text-navy uppercase tracking-tighter">La Nostra Missione</h2>
                <div className="w-20 h-1.5 bg-secondary mx-auto rounded-full" />

                <div className="space-y-8 text-xl md:text-2xl text-slate-600 leading-relaxed font-medium">
                    <p>{content.paragraph1}</p>
                    <p>{content.paragraph2}</p>
                    <p>{content.paragraph3}</p>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="max-w-7xl mx-auto px-8 mt-32 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full"
            >
                {cards.slice(0, 4).map((item, idx) => {
                    const Icon = CARD_ICONS[idx];
                    return (
                        <motion.div
                            key={idx}
                            variants={cardVariants}
                            className="bg-slate-50 rounded-3xl p-8 hover:bg-navy hover:text-white transition-all duration-500 group"
                        >
                            <Icon className="w-12 h-12 text-secondary mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-black mb-4 group-hover:text-gold">{item.title}</h3>
                            <p className="text-sm opacity-70 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
