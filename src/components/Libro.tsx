"use client";

import Image from "next/image";
import { Book, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

export default function Libro() {
    return (
        <section className="py-24 bg-navy relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative group aspect-square max-w-md mx-auto lg:mx-0"
                >
                    <div className="absolute inset-0 bg-secondary/20 rounded-[40px] rotate-6 scale-95" />
                    <div className="relative bg-white p-4 rounded-[40px] shadow-2xl transition-transform duration-500 group-hover:rotate-[-2deg]">
                        <Image
                            src="/images/libro-cover.jpg"
                            alt="Libro: Nausica - La verità mi ha resa libera"
                            width={500}
                            height={700}
                            className="rounded-[30px] object-cover"
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-white space-y-8"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 text-secondary font-bold uppercase tracking-widest text-sm">
                            <span className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                <Book className="w-5 h-5" />
                            </span>
                            L'ultimo Libro
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter">
                            <span className="text-secondary">Nausica</span>{" "}
                            <span className="text-white">La verità mi ha resa libera</span>
                        </h2>
                        <p className="text-xl text-white/70 leading-relaxed font-light">
                            "La verità mi ha resa libera" - Scopri la potente testimonianza di Nausica della Valle e come la luce di Dio può trasformare ogni oscurità in una nuova vita di libertà.
                        </p>
                    </div>

                    <ul className="space-y-4 text-white/60 font-medium">
                        {[
                            "Principi biblici per la liberazione",
                            "Testimonianze di trasformazione",
                            "Guarda la verità che libera"
                        ].map((text, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                                {text}
                            </motion.li>
                        ))}
                    </ul>

                    <a
                        href="https://www.amazon.com/Nausica-verit%C3%A0-resa-libera-Italian-ebook/dp/B087THW2D4"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-secondary text-navy px-10 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-secondary/20 hover:bg-white transition-colors"
                        >
                            Acquista su Amazon!
                            <ShoppingCart className="w-5 h-5" />
                        </motion.button>
                    </a>
                </motion.div>
            </div>

            {/* Background Decorative Text */}
            <motion.div
                initial={{ opacity: 0, scale: 1.2 }}
                whileInView={{ opacity: 0.05, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
                className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/4 text-[25vw] font-black text-white select-none -z-0"
            >
                VERITÀ
            </motion.div>
        </section>
    );
}
