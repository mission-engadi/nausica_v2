"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight, Facebook, Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { useContentDoc } from "@/lib/useContentDoc";

const DEFAULTS = {
    photoUrl: "/images/hero-frame-main.jpg",
    headline: "MINISTERIO APOSTOLICO EVANGELISTICO DI",
    subheadline: "NAUSICA DELLA VALLE",
    subtitle: "Messaggi di fede potenti che accendono il fuoco dello Spirito Santo e liberano le vite. La verità che spezza le catene.",
};

export default function Hero() {
    const content = useContentDoc("hero", DEFAULTS);

    return (
        <section className="relative min-h-screen flex items-center pt-20 pb-16 lg:pt-24 lg:pb-32 overflow-hidden bg-navy">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 lg:gap-12 items-center w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-6 lg:space-y-8 order-2 md:order-1"
                >
                    <div className="space-y-3 lg:space-y-4 text-left">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-secondary font-bold uppercase tracking-widest text-xs sm:text-sm"
                        >
                            Benvenuti al
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95]"
                        >
                            <span className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">{content.headline}</span><br />
                            <span className="text-secondary drop-shadow-sm">{content.subheadline}</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-base lg:text-lg text-slate-400 max-w-md leading-relaxed"
                        >
                            {content.subtitle}
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-start"
                    >
                        <Link
                            href="#messaggi"
                            className="bg-secondary text-navy px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all shadow-xl shadow-secondary/20 text-sm lg:text-base"
                        >
                            Guarda i Video
                            <MoveRight className="w-4 lg:w-5 h-4 lg:h-5" />
                        </Link>
                        <Link
                            href="#invita"
                            className="bg-white/10 text-white border-2 border-white/10 px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-navy hover:border-white transition-all text-sm lg:text-base"
                        >
                            Invita Nausica
                            <MoveRight className="w-4 lg:w-5 h-4 lg:h-5" />
                        </Link>
                    </motion.div>
                </motion.div>

                <div className="order-1 md:order-2 mx-auto md:mx-0 w-full max-w-md md:max-w-none flex flex-col items-center gap-6 lg:gap-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative aspect-[4/5] md:aspect-square max-h-[60vh] md:max-h-none group w-full flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-secondary/10 rounded-[40px] md:rounded-[60px] flex items-center justify-center overflow-hidden border-4 md:border-8 border-white/10 shadow-2xl transition-all duration-500 group-hover:border-secondary/30 ring-1 ring-white/5">
                            <Image
                                src={content.photoUrl}
                                alt="Nausica della Valle preaching"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover object-center scale-100 group-hover:scale-110 transition-transform duration-700"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent mix-blend-multiply" />
                        </div>

                        <div className="absolute -bottom-10 lg:-bottom-20 -left-10 lg:-left-20 w-48 lg:w-64 h-48 lg:h-64 bg-secondary rounded-full blur-[80px] lg:blur-[120px] opacity-20 animate-pulse" />
                        <div className="absolute -top-10 lg:-top-20 -right-10 lg:-right-20 w-48 lg:w-64 h-48 lg:h-64 bg-blue-500 rounded-full blur-[80px] lg:blur-[120px] opacity-10" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="flex items-center gap-4 lg:gap-6 z-20"
                    >
                        <a href="https://www.facebook.com/people/Nausica-Della-Valle-Offical/100064220134407/" target="_blank" rel="noopener noreferrer" className="p-3 lg:p-4 bg-white/5 hover:bg-secondary rounded-full text-white/70 hover:text-navy transition-all hover:scale-110 ring-1 ring-white/10 hover:ring-secondary shadow-lg">
                            <Facebook className="w-5 lg:w-6 h-5 lg:h-6" />
                        </a>
                        <a href="https://www.instagram.com/nausicadellavalleofficial/?hl=en" target="_blank" rel="noopener noreferrer" className="p-3 lg:p-4 bg-white/5 hover:bg-secondary rounded-full text-white/70 hover:text-navy transition-all hover:scale-110 ring-1 ring-white/10 hover:ring-secondary shadow-lg">
                            <Instagram className="w-5 lg:w-6 h-5 lg:h-6" />
                        </a>
                        <a href="https://www.youtube.com/@nausicadellavalle-tv6794" target="_blank" rel="noopener noreferrer" className="p-3 lg:p-4 bg-white/5 hover:bg-secondary rounded-full text-white/70 hover:text-navy transition-all hover:scale-110 ring-1 ring-white/10 hover:ring-secondary shadow-lg">
                            <Youtube className="w-5 lg:w-6 h-5 lg:h-6" />
                        </a>
                        <a href="https://www.tiktok.com/@nausica.dellavalle" target="_blank" rel="noopener noreferrer" className="p-3 lg:p-4 bg-white/5 hover:bg-secondary rounded-full text-white/70 hover:text-navy transition-all hover:scale-110 ring-1 ring-white/10 hover:ring-secondary shadow-lg">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 lg:w-6 h-5 lg:h-6">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                        </a>
                    </motion.div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 0.1, x: -150 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-1/2 left-0 -translate-y-1/2 text-[15vw] md:text-[20vw] font-black text-white select-none -z-10 tracking-tighter hidden sm:block"
            >
                AWAKENING
            </motion.div>
        </section>
    );
}
