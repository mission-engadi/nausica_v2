"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect if already logged in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/admin/dashboard");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin/dashboard");
        } catch (err: any) {
            console.error("Login Error:", err.code, err.message);

            switch (err.code) {
                case "auth/invalid-credential":
                    setError("Email o password non corretti. Riprova.");
                    break;
                case "auth/user-disabled":
                    setError("Questo account è stato disabilitato.");
                    break;
                case "auth/too-many-requests":
                    setError("Troppi tentativi falliti. Riprova più tardi.");
                    break;
                case "auth/invalid-email":
                    setError("Formato email non valido.");
                    break;
                default:
                    setError("Si è verificato un errore durante l'accesso. Riprova.");
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Admin Portal</h1>
                    <p className="text-slate-500 font-medium">Accedi per gestire gli eventi</p>
                </div>

                <form onSubmit={handleLogin} className="bg-white p-8 rounded-[32px] shadow-2xl shadow-navy/5 space-y-6 border border-slate-100">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                required
                                type="email"
                                id="email"
                                name="email"
                                placeholder="admin@nausica.it"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-navy focus:outline-none focus:border-navy transition-colors font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                required
                                type="password"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-navy focus:outline-none focus:border-navy transition-colors font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-navy text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-navy/90 transition-all shadow-xl shadow-navy/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Accedi"}
                    </button>
                </form>

                <div className="pt-4 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-navy font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Torna alla Home
                    </Link>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Area Riservata &copy; Ministero Nausica della Valle
                    </p>
                    <a 
                        href="https://webmail.migadu.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary hover:text-navy transition-colors bg-secondary/10 px-4 py-2 rounded-full border border-secondary/20"
                    >
                        Web Email Server
                    </a>
                </div>
            </div>
        </div>
    );
}
