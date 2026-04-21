"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, Clock, MapPin, ChevronRight, X, ZoomIn, Phone, Mail } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function Events() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Get today's date in YYYY-MM-DD format for comparison
                const today = new Date().toISOString().split('T')[0];

                const q = query(
                    collection(db, "events"),
                    where("date", ">=", today),
                    orderBy("date", "asc"),
                    limit(9)
                );
                const snapshot = await getDocs(q);
                setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err: any) {
                console.error("Error fetching events:", err);
                setError(err.message || "Errore nel caricamento eventi");
            }
            setLoading(false);
        };
        fetchEvents();
    }, []);

    // Hide the section entirely if there are no events and we're not loading or erroring
    if (!loading && events.length === 0 && !error) {
        return null;
    }

    return (
        <section className="py-16 lg:py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-3 lg:space-y-4 mb-12 lg:16"
                >
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs font-bold tracking-widest uppercase">
                        <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                        Agenda Ministeriale
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy uppercase tracking-tighter">Eventi</h2>
                    <div className="w-16 lg:w-20 h-1.5 bg-secondary mx-auto rounded-full" />
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="visible"
                    animate="visible"
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[32px] lg:rounded-[40px] p-6 lg:p-8 shadow-2xl shadow-navy/5 border border-slate-100 space-y-6 lg:space-y-8">
                                <Skeleton className="h-40 lg:h-48 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 mb-6 lg:mb-8 !rounded-none" />
                                <div className="flex justify-between items-start">
                                    <Skeleton className="w-16 lg:w-20 h-16 lg:h-20 rounded-xl lg:rounded-2xl" />
                                    <Skeleton className="w-20 lg:w-24 h-3 lg:h-4" />
                                </div>
                                <Skeleton className="w-2/3 lg:w-3/4 h-6 lg:h-8" />
                                <div className="space-y-2 lg:space-y-3">
                                    <Skeleton className="w-full h-3 lg:h-4" />
                                    <Skeleton className="w-1/2 h-3 lg:h-4" />
                                </div>
                                <Skeleton className="w-24 lg:w-32 h-5 lg:h-6" />
                            </div>
                        ))
                    ) : (
                        events.map((event, idx) => {
                            const startDate = new Date(event.date);
                            const endDate = event.endDate ? new Date(event.endDate) : startDate;
                            const isRange = event.endDate && event.endDate !== event.date;

                            const day = startDate.getDate();
                            const endDay = endDate.getDate();
                            const monthShort = startDate.toLocaleString('it-IT', { month: 'short' }).toUpperCase();

                            return (
                                <motion.div
                                    key={event.id || idx}
                                    variants={itemVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl shadow-navy/5 border border-slate-100 hover:translate-y-[-8px] transition-all duration-500 group overflow-hidden flex flex-col h-full"
                                >
                                    <div 
                                        className="h-56 lg:h-72 relative overflow-hidden shrink-0 cursor-zoom-in"
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <img
                                            src={event.imageUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1000"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            alt={event.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent opacity-60" />
                                        
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-3 text-white">
                                                <ZoomIn className="w-6 h-6" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 flex items-center gap-3 lg:gap-4">
                                            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-1.5 lg:py-2 text-center text-white">
                                                <span className="block text-lg lg:text-2xl font-black leading-none">
                                                    {isRange ? `${day}-${endDay}` : day}
                                                </span>
                                                <span className="text-[8px] lg:text-[10px] font-bold tracking-widest uppercase opacity-80">{monthShort}</span>
                                            </div>
                                            {event.time && (
                                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg lg:rounded-xl px-2 lg:px-3 py-1 lg:py-1.5 flex items-center gap-1.5 lg:gap-2 text-white text-[10px] lg:text-xs font-bold">
                                                    <Clock className="w-3 lg:w-4 h-3 lg:h-4 text-secondary" />
                                                    {event.time}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 lg:p-8 flex flex-col flex-1">
                                        <div className="flex-1 space-y-3 lg:space-y-4">
                                            <h3 className="text-xl lg:text-2xl font-black text-navy leading-tight group-hover:text-secondary transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                                                {event.title}
                                            </h3>

                                            <div className="flex items-start gap-2 lg:gap-3 text-slate-500">
                                                <MapPin className="w-4 lg:w-5 h-4 lg:h-5 text-secondary shrink-0" />
                                                <div>
                                                    <p className="font-bold text-navy/80 text-xs lg:text-sm italic uppercase tracking-tighter tabular-nums">
                                                        {event.location}
                                                        {event.address && <span className="block text-[10px] lg:text-[11px] font-medium not-italic normal-case tracking-normal opacity-70">{event.address}</span>}
                                                    </p>
                                                    <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest opacity-50">{event.country || "ITALIA"}</p>
                                                </div>
                                            </div>

                                            {(event.phone || event.email) && (
                                                <div className="space-y-2 pt-2">
                                                    {event.phone && (
                                                        <a href={`tel:${event.phone}`} className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-navy/60 hover:text-secondary transition-colors">
                                                            <Phone className="w-3.5 h-3.5 text-secondary" />
                                                            {event.phone}
                                                        </a>
                                                    )}
                                                    {event.email && (
                                                        <a href={`mailto:${event.email}`} className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-navy/60 hover:text-secondary transition-colors truncate">
                                                            <Mail className="w-3.5 h-3.5 text-secondary" />
                                                            <span className="truncate">{event.email}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 lg:mt-8 pt-5 lg:pt-8 border-t border-slate-100">
                                            {event.eventLink ? (
                                                <a
                                                    href={event.eventLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-navy text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-wider hover:bg-secondary transition-all hover:scale-105"
                                                >
                                                    Prenota Posto
                                                    <ChevronRight className="w-3 lg:w-4 h-3 lg:h-4" />
                                                </a>
                                            ) : (
                                                <button 
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="flex items-center gap-2 text-navy font-black text-xs lg:text-sm uppercase tracking-wider group/btn"
                                                >
                                                    Dettagli Evento
                                                    <ChevronRight className="w-4 lg:w-5 h-4 lg:h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>

                {error && (
                    <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-[30px] text-red-600 text-center">
                        <p className="font-bold uppercase tracking-widest text-xs mb-2">Errore Tecnico</p>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {events.length === 0 && !loading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100"
                    >
                        <p className="text-slate-400 font-bold uppercase tracking-widest italic">Nessun evento in programma</p>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <p className="text-slate-400 font-medium">
                        Vuoi invitare Nausica nella tua città? <a href="#invita" className="text-secondary font-bold hover:underline">Contattaci ora</a>
                    </p>
                </motion.div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/95 p-4 md:p-8 backdrop-blur-sm"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-4 right-4 md:top-8 md:right-8 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-[101]"
                            onClick={() => setSelectedEvent(null)}
                        >
                            <X className="w-6 h-6 md:w-8 md:h-8" />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full h-[55vh] md:h-[65vh] flex items-center justify-center">
                                <img
                                    src={selectedEvent.imageUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1000"}
                                    alt={selectedEvent.title}
                                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                                />
                            </div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center text-white space-y-2 max-w-2xl w-full px-4 py-4 bg-navy rounded-2xl"
                            >
                                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-secondary">
                                    {selectedEvent.title}
                                </h3>
                                <div className="flex items-center justify-center gap-4 text-xs md:text-sm font-bold text-white">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-secondary" />
                                        {new Date(selectedEvent.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-secondary" />
                                        {selectedEvent.location}
                                    </span>
                                </div>

                                {(selectedEvent.phone || selectedEvent.email) && (
                                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-2">
                                        {selectedEvent.phone && (
                                            <a href={`tel:${selectedEvent.phone}`} className="flex items-center gap-2 text-xs md:text-sm font-bold text-white hover:text-secondary transition-colors">
                                                <Phone className="w-4 h-4 text-secondary" />
                                                {selectedEvent.phone}
                                            </a>
                                        )}
                                        {selectedEvent.email && (
                                            <a href={`mailto:${selectedEvent.email}`} className="flex items-center gap-2 text-xs md:text-sm font-bold text-white hover:text-secondary transition-colors">
                                                <Mail className="w-4 h-4 text-secondary" />
                                                {selectedEvent.email}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decorative background shape */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-navy/5 -skew-x-12 translate-x-1/2 -z-0" />
        </section>
    );
}
