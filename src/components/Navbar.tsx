"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    const navLinks = [
        { href: "#agenda", label: "Agenda" },
        { href: "#missione", label: "Missione" },
        { href: "#messaggi", label: "Messaggi" },
        { href: "#chiesa", label: "Chiesa" },
        { href: "#libro", label: "Libro" },
        { href: "#donazioni", label: "Donazioni" },
        { href: isLoggedIn ? "/admin/dashboard" : "/admin/login", label: "Admin", auth: true },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    <div className="text-lg lg:text-xl font-black tracking-tighter uppercase text-navy truncate">
                        Nausica della Valle
                    </div>
                    
                    <div className="hidden lg:flex items-center space-x-6 lg:space-x-8 text-sm font-semibold tracking-wide text-navy/70">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                className={`hover:text-navy transition-colors ${link.auth ? 'flex items-center gap-1.5 opacity-40 hover:opacity-100' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="#invita"
                            className="bg-navy text-white px-5 lg:px-6 py-2.5 rounded-lg hover:bg-navy/90 transition-all font-bold shadow-lg shadow-navy/20 text-xs lg:text-sm"
                        >
                            Invita Nausica
                        </Link>
                    </div>

                    <button
                        className="lg:hidden p-2 text-navy"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-slate-100">
                    <div className="px-4 py-6 space-y-4">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                className={`block py-3 text-base font-semibold text-navy/70 hover:text-navy transition-colors ${link.auth ? 'opacity-50' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="#invita"
                            className="block w-full bg-navy text-white px-6 py-3 rounded-lg hover:bg-navy/90 transition-all font-bold text-center"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Invita Nausica
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
