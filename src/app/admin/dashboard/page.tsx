"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, LogOut, Trash2, Calendar, MapPin, Loader2, Image as ImageIcon, Pencil, X, Mail, Send, ChevronRight, Clock, Menu, Phone } from "lucide-react";
import { toast } from "sonner";

// Image compression utility
const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Compression failed"));
                }, 'image/jpeg', 0.7);
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

import Skeleton from "@/components/Skeleton";

export default function Dashboard() {
    // ... (rest of the component state)
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"events" | "invitations">("events");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ 
        title: "", 
        location: "", 
        address: "", 
        date: "", 
        endDate: "", 
        time: "", 
        country: "", 
        imageUrl: "", 
        eventLink: "",
        phone: "",
        email: ""
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "compressing" | "uploading" | "saving">("idle");
    const [authChecking, setAuthChecking] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) {
                router.push("/admin/login");
            } else {
                console.log("Logged in user UID:", u.uid);
                setUser(u);
                fetchEvents();
                fetchInvitations();
                setAuthChecking(false);
            }
        });
        return () => unsub();
    }, [router]);

    const fetchEvents = async () => {
        try {
            const q = query(collection(db, "events"), orderBy("date", "desc"));
            const snapshot = await getDocs(q);
            const allEvents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

            // Auto-cleanup: Delete past events
            const today = new Date().toISOString().split('T')[0];
            const expiredEvents = allEvents.filter(e => e.date < today);

            if (expiredEvents.length > 0) {
                console.log(`Cleaning up ${expiredEvents.length} past events...`);
                for (const expired of expiredEvents) {
                    try {
                        await deleteDoc(doc(db, "events", expired.id));
                    } catch (err: any) {
                        if (err.code === 'permission-denied') {
                            console.warn("Permission denied while cleaning up expired event. User might not be an admin.");
                        } else {
                            console.error("Failed to delete expired event:", expired.id, err);
                        }
                    }
                }
                // Refresh list after cleanup attempt
                const freshSnapshot = await getDocs(q);
                setEvents(freshSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setEvents(allEvents);
            }
        } catch (err: any) {
            console.error("Error fetching events:", err);
            toast.error("Errore nel caricamento degli eventi");
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const q = query(collection(db, "invitations"), orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            setInvitations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
        } catch (err: any) {
            if (err.code === 'permission-denied') {
                console.warn("Permission denied fetching invitations. User might not be an admin.");
                toast.error("Accesso negato: non hai i permessi per vedere le richieste.");
            } else {
                console.error("Error fetching invitations:", err);
                toast.error("Errore nel caricamento delle richieste");
            }
        }
    };

    const handleEdit = (event: any) => {
        setEditingId(event.id);
        setFormData({
            title: event.title,
            location: event.location,
            address: event.address || "",
            date: event.date,
            endDate: event.endDate || "",
            time: event.time,
            country: event.country || "",
            imageUrl: event.imageUrl || "",
            eventLink: event.eventLink || "",
            phone: event.phone || "",
            email: event.email || ""
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ 
            title: "", 
            location: "", 
            address: "", 
            date: "", 
            endDate: "", 
            time: "", 
            country: "", 
            imageUrl: "", 
            eventLink: "",
            phone: "",
            email: ""
        });
        setImageFile(null);
        setUploadProgress(0);
        setStatus("idle");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setUploadProgress(0);
        setStatus("idle");

        try {
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                setStatus("compressing");
                // Compress image before upload
                const compressedBlob = await compressImage(imageFile);

                setStatus("uploading");
                const storageRef = ref(storage, `public/event-images/${Date.now()}_${imageFile.name}`);

                // Use resumable upload to track progress
                const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

                finalImageUrl = await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            }

            setStatus("saving");
            const eventData = {
                title: formData.title,
                location: formData.location,
                address: formData.address,
                date: formData.date,
                endDate: formData.endDate || formData.date, // Default to start date if not set
                time: formData.time,
                country: formData.country,
                eventLink: formData.eventLink,
                phone: formData.phone,
                email: formData.email,
                imageUrl: (finalImageUrl as string) || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1000&auto=format&fit=crop",
            };

            if (editingId) {
                await updateDoc(doc(db, "events", editingId), eventData);
                toast.success("Evento aggiornato!");
            } else {
                await addDoc(collection(db, "events"), {
                    ...eventData,
                    createdAt: new Date().toISOString()
                });
                toast.success("Evento creato!");
            }

            resetForm();
            fetchEvents();
        } catch (err) {
            console.error(err);
            toast.error("Errore durante il salvataggio");
        }
        setCreating(false);
        setUploadProgress(0);
        setStatus("idle");
    };

    const handleDeleteEvent = async (id: string) => {
        toast("Eliminare questo evento?", {
            action: {
                label: "Elimina",
                onClick: async () => {
                    try {
                        await deleteDoc(doc(db, "events", id));
                        toast.success("Evento eliminato");
                        fetchEvents();
                    } catch (err) {
                        toast.error("Errore durante l'eliminazione");
                    }
                },
            },
        });
    };

    const handleDeleteInvitation = async (id: string) => {
        toast("Eliminare questa richiesta?", {
            action: {
                label: "Elimina",
                onClick: async () => {
                    try {
                        await deleteDoc(doc(db, "invitations", id));
                        toast.success("Richiesta eliminata");
                        fetchInvitations();
                    } catch (err) {
                        toast.error("Errore durante l'eliminazione");
                    }
                },
            },
        });
    };

    if (authChecking) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-navy animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Desktop */}
            <aside className="w-80 bg-navy text-white p-8 flex flex-col hidden lg:flex">
                <div className="text-xl font-black uppercase tracking-tighter mb-12 text-secondary">Portal Nausica</div>
                <nav className="flex-1 space-y-4">
                    <button
                        onClick={() => setActiveTab("events")}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'events' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Calendar className="w-5 h-5 text-secondary" />
                        Gestione Eventi
                    </button>
                    <button
                        onClick={() => setActiveTab("invitations")}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'invitations' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Send className="w-5 h-5 text-secondary" />
                        Richieste (Inbox)
                    </button>
                    <a
                        href="/"
                        className="w-full p-4 rounded-xl flex items-center gap-3 font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Plus className="w-5 h-5 text-secondary rotate-45" />
                        Vedi Sito Live
                    </a>
                </nav>

                <button
                    onClick={() => signOut(auth)}
                    className="p-4 rounded-xl flex items-center gap-3 font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Esci
                </button>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <div 
                className={`fixed inset-0 bg-navy/80 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <aside 
                className={`fixed top-0 left-0 bottom-0 w-72 bg-navy text-white p-8 flex flex-col z-50 transition-transform duration-300 ease-out lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex justify-between items-center mb-12">
                    <div className="text-xl font-black uppercase tracking-tighter text-secondary">Portal Nausica</div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/60 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <nav className="flex-1 space-y-4">
                    <button
                        onClick={() => { setActiveTab("events"); setIsMobileMenuOpen(false); }}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'events' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                    >
                        <Calendar className="w-5 h-5 text-secondary" />
                        Gestione Eventi
                    </button>
                    <button
                        onClick={() => { setActiveTab("invitations"); setIsMobileMenuOpen(false); }}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'invitations' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                    >
                        <Send className="w-5 h-5 text-secondary" />
                        Richieste (Inbox)
                    </button>
                    <a
                        href="/"
                        className="w-full p-4 rounded-xl flex items-center gap-3 font-bold text-white/40"
                    >
                        <Plus className="w-5 h-5 text-secondary rotate-45" />
                        Vedi Sito Live
                    </a>
                </nav>

                <button
                    onClick={() => signOut(auth)}
                    className="p-4 rounded-xl flex items-center gap-3 font-bold text-white/40 mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Esci
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black text-navy uppercase tracking-tighter">
                                {activeTab === 'events' ? 'Gestione Eventi' : 'Richieste (Inbox)'}
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1 md:mt-2">
                                {activeTab === 'events' ? 'Crea e modifica i prossimi appuntamenti' : 'Gestisci le richieste di invito ricevute'}
                            </p>
                        </div>
                        <button 
                            className="lg:hidden p-2 text-navy hover:text-secondary transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-7 h-7" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 self-end md:self-auto">
                        {loading && <Loader2 className="w-5 h-5 text-navy animate-spin" />}
                        <div className="text-right">
                            <p className="font-black text-navy uppercase text-sm">{user?.email}</p>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Amministratore</p>
                        </div>
                    </div>
                </header>

                {activeTab === 'events' ? (
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-navy/5 border border-slate-100 sticky top-12">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                        {editingId ? <ChevronRight className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                                    </div>
                                    <h2 className="text-xl font-black text-navy uppercase">{editingId ? 'Modifica Evento' : 'Nuovo Evento'}</h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Titolo Evento</label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            placeholder="Es: Conferenza Donne"
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="date" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Data Inizio</label>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy transition-all"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="endDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Data Fine (Opz.)</label>
                                            <input
                                                type="date"
                                                id="endDate"
                                                name="endDate"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy transition-all"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="time" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Ora</label>
                                            <input
                                                type="time"
                                                id="time"
                                                name="time"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy transition-all"
                                                value={formData.time}
                                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="country" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Paese (Opz.)</label>
                                            <input
                                                type="text"
                                                id="country"
                                                name="country"
                                                placeholder="Es: Italia"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="location" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Città</label>
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                placeholder="Es: Roma"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Indirizzo (Opz.)</label>
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                placeholder="Es: Via Roma 1"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="eventLink" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Link Evento (Opzionale)</label>
                                        <input
                                            type="url"
                                            id="eventLink"
                                            name="eventLink"
                                            placeholder="Es: https://eventbrite.com/..."
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                            value={formData.eventLink}
                                            onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Telefono (Opzionale)</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                placeholder="Es: +39 333 1234567"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Email (Opzionale)</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                placeholder="Es: info@esempio.it"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 font-bold text-navy placeholder:text-slate-300 transition-all"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Immagine Evento</label>
                                        <div className="relative group/upload">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className="w-full flex flex-col items-center justify-center gap-3 px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer group-hover/upload:border-secondary/50 group-hover/upload:bg-secondary/5 transition-all"
                                            >
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover/upload:text-secondary group-hover/upload:scale-110 transition-all">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-navy uppercase tracking-widest">
                                                        {imageFile ? imageFile.name : (editingId ? 'Cambia Immagine' : 'Carica Immagine')}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">PNG, JPG fino a 5MB</p>
                                                </div>
                                            </label>
                                        </div>

                                        {status !== 'idle' && (
                                            <div className="mt-4 p-4 bg-navy rounded-2xl space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                        <Loader2 className="w-3 h-3 animate-spin text-secondary" />
                                                        {status === 'compressing' ? 'Ottimizzazione...' :
                                                            status === 'uploading' ? 'Caricamento...' : 'Salvataggio...'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-secondary">{Math.round(uploadProgress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-secondary transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="flex-1 px-6 py-5 bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                                            >
                                                Annulla
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={creating || status !== 'idle'}
                                            className="flex-[2] px-6 py-5 bg-navy text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-navy/20 transition-all"
                                        >
                                            {creating ? 'In corso...' : (editingId ? 'Salva Modifiche' : 'Crea Evento')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xl font-black text-navy uppercase">Eventi in Programma ({events.length})</h3>
                            <div className="grid gap-6">
                                {loading && events.length === 0 ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-6">
                                            <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
                                            <div className="flex-1 space-y-4">
                                                <Skeleton className="w-1/2 h-6" />
                                                <div className="flex gap-4">
                                                    <Skeleton className="w-32 h-4" />
                                                    <Skeleton className="w-32 h-4" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    events.map((event) => (
                                        <div key={event.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-navy/20 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-4 border-slate-50 relative">
                                                    <Image src={event.imageUrl} fill className="object-cover" alt={event.title} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-navy uppercase text-lg leading-tight">{event.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-secondary" />
                                                            {new Date(event.date).toLocaleDateString('it-IT')}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-secondary" />
                                                            {event.time}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-secondary" />
                                                            {event.location}
                                                        </span>
                                                        {event.eventLink && (
                                                            <span className="flex items-center gap-1.5 text-secondary">
                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                                Link Attivo
                                                            </span>
                                                        )}
                                                        {(event.phone || event.email) && (
                                                            <span className="flex items-center gap-1.5 text-secondary">
                                                                <Phone className="w-3.5 h-3.5" />
                                                                Contatti Inseriti
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 self-end md:self-center">
                                                <button
                                                    onClick={() => handleEdit(event)}
                                                    className="w-12 h-12 rounded-xl bg-slate-50 text-navy flex items-center justify-center hover:bg-navy hover:text-white transition-all shadow-sm"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {!loading && events.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest">Nessun evento presente</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-navy uppercase">Richieste Ricevute ({invitations.length})</h3>
                        <div className="grid gap-6">
                            {loading && invitations.length === 0 ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-8">
                                        <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                                        <div className="flex-1 space-y-4">
                                            <Skeleton className="w-1/3 h-6" />
                                            <Skeleton className="w-1/4 h-3" />
                                            <div className="grid grid-cols-3 gap-6 pt-2">
                                                <Skeleton className="h-8" />
                                                <Skeleton className="h-8" />
                                                <Skeleton className="h-8" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Skeleton className="w-24 h-12 rounded-xl" />
                                            <Skeleton className="w-12 h-12 rounded-xl" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                invitations.map((invitation) => (
                                    <div key={invitation.id} className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-navy/20 transition-all">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                                                    <Mail className="w-6 h-6 text-secondary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-navy uppercase text-xl leading-none">{invitation.church}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{invitation.name} • {invitation.email}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Periodo</label>
                                                    <p className="text-xs font-bold text-navy flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                                                        Dal {invitation.startDate} al {invitation.endDate}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Luogo</label>
                                                    <p className="text-xs font-bold text-navy flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-secondary" />
                                                        {invitation.location}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Ricevuto il</label>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {invitation.timestamp?.toDate ? invitation.timestamp.toDate().toLocaleDateString('it-IT') : 'Data non disponibile'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 self-end md:self-center">
                                            <a
                                                href={`mailto:${invitation.email}?subject=Risposta alla richiesta di invito - Nausica della Valle`}
                                                className="px-6 py-3 bg-navy text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-navy/90 transition-all shadow-lg shadow-navy/10"
                                            >
                                                Rispondi
                                            </a>
                                            <button
                                                onClick={() => handleDeleteInvitation(invitation.id)}
                                                className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            {!loading && invitations.length === 0 && (
                                <div className="text-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                                    <Mail className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest">Nessuna richiesta in archivio</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
