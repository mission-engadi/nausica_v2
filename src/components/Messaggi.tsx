"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { useContentDoc } from "@/lib/useContentDoc";

const DEFAULTS = {
    videos: [
        { id: "jIyVKkUjoj0", title: "Messaggio di Fede e Potenza" },
        { id: "iihmNKhM0tI", title: "La Gloria di Dio in Azione" },
        { id: "jjWVJURPoyY", title: "Gesù Cristo è il Signore" },
    ],
};

export default function Messaggi() {
    const content = useContentDoc("messaggi", DEFAULTS);

    return (
        <section id="messaggi" className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
                >
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black text-navy uppercase tracking-tighter">Messaggi Che <span className="text-secondary">Trasformano</span></h2>
                        <p className="text-slate-500 max-w-lg">
                            Guarda le testimonianze e i messaggi di fede che stanno accendendo il risveglio in tutta Europa.
                        </p>
                    </div>
                    <a
                        href="https://www.youtube.com/@nausicadellavalle-tv6794"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy font-bold flex items-center gap-2 group"
                    >
                        Vedi tutti i messaggi
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all">
                            <Play className="w-3 h-3 fill-current" />
                        </div>
                    </a>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {content.videos.map((video, i) => (
                        <motion.a
                            key={video.id}
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group relative aspect-video bg-slate-200 rounded-[32px] overflow-hidden shadow-2xl block"
                        >
                            <img
                                src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                                alt={video.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/40 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                                    <p className="text-white font-bold text-sm tracking-tight">{video.title}</p>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
