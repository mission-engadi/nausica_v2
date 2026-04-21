"use client";

import { AlertTriangle, WifiOff, XCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ScamWarning() {
    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background pattern - subtle red glow, very light */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 center w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-8 relative z-10">
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-600 mb-6 shadow-xl shadow-red-500/10">
                        <AlertTriangle className="w-10 h-10" />
                    </div>

                    {/* Main Title - Dark Slate for Light Theme */}
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-slate-900 drop-shadow-sm">
                        Attenzione ai <br className="hidden md:block" />
                        <span className="text-red-600">Truffatori</span>
                    </h2>

                    <div className="inline-block bg-red-100 px-6 py-2 rounded-full border border-red-200">
                        <p className="text-red-700 font-bold text-base uppercase tracking-widest">
                            Avviso Importante di Sicurezza
                        </p>
                    </div>

                    <p className="max-w-3xl mx-auto text-xl text-slate-700 leading-relaxed mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
                        L'Apostolo Nausica Della Valle <strong className="text-red-600 decoration-red-600 underline decoration-4 underline-offset-4">NON</strong> invierà <strong className="text-red-600 decoration-red-600 underline decoration-4 underline-offset-4">MAI</strong> messaggi privati, email o commenti richiedendo denaro o donazioni.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Column 1: Scammers might... */}
                    <div className="bg-white border-2 border-red-100 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
                            <WifiOff className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-2 border-red-100 pb-4 w-full">
                            I truffatori potrebbero:
                        </h3>
                        <ul className="space-y-4 text-left w-full">
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <span className="text-red-500 mt-1 font-bold text-xl">•</span>
                                <div>Inviare messaggi privati che richiedono denaro</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <span className="text-red-500 mt-1 font-bold text-xl">•</span>
                                <div>Inviare email che chiedono donazioni per "liberazione" o "guarigione"</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <span className="text-red-500 mt-1 font-bold text-xl">•</span>
                                <div>Chiedere di acquistare "olio dell’unzione" o prodotti speciali</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <span className="text-red-500 mt-1 font-bold text-xl">•</span>
                                <div>Fare promesse di benedizioni in cambio di "semi" finanziari</div>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Nausica NEVER does... */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 transform md:-translate-y-4 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-600">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-2 border-slate-100 pb-4 w-full">
                            Nausica NON farà mai:
                        </h3>
                        <ul className="space-y-4 text-left w-full">
                            <li className="flex gap-4 text-slate-700 text-lg font-medium">
                                <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>Chiedere di "seminare un seme" per la tua liberazione o guarigione</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg font-medium">
                                <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>Vendere "olio dell'unzione" o altri prodotti spirituali</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg font-medium">
                                <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>Contattare privatamente per chiedere donazioni per "orfanotrofi" o "missioni"</div>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: How to protect yourself */}
                    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b-2 border-emerald-200 pb-4 w-full">
                            Come Proteggerti:
                        </h3>
                        <ul className="space-y-4 text-left w-full">
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                <div>Non rispondere a messaggi privati che chiedono denaro.</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                <div>Verifica sempre attraverso i canali ufficiali.</div>
                            </li>
                            <li className="flex gap-4 text-slate-700 text-lg">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                <div>Segnala immediatamente qualsiasi comunicazione sospetta.</div>
                            </li>
                            <li className="flex gap-3 text-emerald-800 text-lg font-medium mt-6 bg-emerald-100 p-4 rounded-xl border border-emerald-200 italic w-full">
                                "Dio non richiede pagamenti per liberazione, guarigione o benedizioni."
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <p className="text-slate-500 uppercase tracking-widest text-sm font-bold bg-white inline-block px-6 py-2 rounded-full border border-slate-200 shadow-sm">
                        Mantieniti vigile e proteggi te stesso e gli altri da questi inganni.
                    </p>
                </div>
            </div>
        </section>
    );
}
