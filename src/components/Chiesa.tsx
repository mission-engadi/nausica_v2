"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import { useContentDoc } from "@/lib/useContentDoc";

const DEFAULTS = {
    gallery: ["/images/chiesa-new-1.jpg", "/images/chiesa-new-2.jpg"],
    logoUrl: "/images/chiesa-logo.jpg",
    description: "Una comunità vibrante dedicata a portare il messaggio di Cristo a ogni nazione. Sotto la guida dell'Apostolo Giovanni e della Pastora Lia Collura, la nostra chiesa è un luogo di risveglio, guarigione e trasformazione.",
};

export default function Chiesa() {
    const content = useContentDoc("chiesa", DEFAULTS);
    const photos = content.gallery.length >= 2 ? content.gallery : DEFAULTS.gallery;

    return (
        <section id="chiesa" className="py-24 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-secondary font-bold uppercase tracking-widest text-sm"
                            >
                                La Nostra Casa Spirituale
                            </motion.span>
                            <h2 className="text-5xl md:text-6xl font-black text-navy uppercase tracking-tighter leading-none">
                                Chiesa <br />
                                <span className="text-secondary">Gesù Cristo per tutte le Nazioni</span>
                            </h2>
                        </div>

                        <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                            {content.description}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-navy">Sede</h4>
                                    <p className="text-sm text-slate-500">Mettmann, Germania</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-navy">Comunità</h4>
                                    <p className="text-sm text-slate-500">Jesus Christus für alle Nationen</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                viewport={{ once: true }}
                                className="relative w-56 h-56 bg-white p-6 rounded-[40px] shadow-xl border border-slate-100 flex items-center justify-center overflow-hidden transition-shadow hover:shadow-2xl hover:border-secondary/20 cursor-pointer"
                            >
                                <Image
                                    src={content.logoUrl}
                                    alt="Logo Gesù Cristo per tutte le Nazioni"
                                    width={280}
                                    height={280}
                                    className="object-contain hover:scale-110 transition-transform duration-500"
                                />
                            </motion.div>
                        </div>
                    </motion.div>

                    <div className="relative">
                        <div className="grid grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative mt-12"
                            >
                                <Image
                                    src={photos[0]}
                                    alt="Chiesa Interno 1"
                                    fill
                                    className="object-cover hover:scale-110 transition-transform duration-700"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative mb-12"
                            >
                                <Image
                                    src={photos[1]}
                                    alt="Chiesa Interno 2"
                                    fill
                                    className="object-cover hover:scale-110 transition-transform duration-700"
                                />
                            </motion.div>
                        </div>
                        <div className="absolute -z-10 -top-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
