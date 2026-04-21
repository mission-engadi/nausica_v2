"use client";

import { useState, useEffect, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/imageUtils";
import { toast } from "sonner";
import { ChevronDown, Image as ImageIcon, Loader2, Plus, Trash2, Save, Palette } from "lucide-react";
import type { User } from "firebase/auth";

interface ContentTabProps {
    user: User;
}

const SECTION_LABELS: Record<string, string> = {
    hero: "Hero (Copertina)",
    messaggi: "Video (Messaggi)",
    chiesa: "Chiesa",
    libro: "Libro",
    donation: "Donazioni & PayPal",
    mission: "Missione",
    copertura: "Copertura Spirituale",
    branding: "Colori del Sito",
};

function SectionCard({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-[32px] shadow-lg shadow-navy/5 border border-slate-100 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
            >
                <span className="font-black text-navy uppercase tracking-tight text-sm">{title}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">{children}</div>}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{children}</label>;
}

function TextInput({ label, value, onChange, placeholder, multiline = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
    const cls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-secondary transition-colors";
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            {multiline ? (
                <textarea rows={3} className={cls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input type="text" className={cls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
            )}
        </div>
    );
}

function ImageUploadField({ label, currentUrl, onUploaded, storagePath }: {
    label: string; currentUrl: string; onUploaded: (url: string) => void; storagePath: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setProgress(0);
        try {
            const blob = await compressImage(file);
            const storageRef = ref(storage, `${storagePath}/${Date.now()}_${file.name}`);
            const task = uploadBytesResumable(storageRef, blob);
            const url = await new Promise<string>((resolve, reject) => {
                task.on(
                    "state_changed",
                    (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                    reject,
                    async () => resolve(await getDownloadURL(task.snapshot.ref))
                );
            });
            onUploaded(url);
            toast.success("Immagine caricata!");
        } catch {
            toast.error("Errore nel caricamento immagine");
        }
        setUploading(false);
        setProgress(0);
    };

    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-3">
                {currentUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                )}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-navy text-sm font-bold hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {uploading ? `${Math.round(progress)}%` : "Cambia foto"}
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
        </div>
    );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-bold text-sm hover:bg-secondary hover:text-navy transition-all disabled:opacity-50 mt-4"
        >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvataggio..." : "Salva"}
        </button>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroEditor() {
    const [form, setForm] = useState({ photoUrl: "", headline: "", subheadline: "", subtitle: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "hero")).then((s) => {
            if (s.exists()) setForm((prev) => ({ ...prev, ...s.data() }));
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "hero"), form, { merge: true });
            toast.success("Hero aggiornato!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <ImageUploadField
                label="Foto principale"
                currentUrl={form.photoUrl}
                onUploaded={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
                storagePath="public/site-content/hero"
            />
            <TextInput label="Prima riga del titolo" value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} placeholder="MINISTERIO APOSTOLICO EVANGELISTICO DI" />
            <TextInput label="Seconda riga del titolo (dorata)" value={form.subheadline} onChange={(v) => setForm((f) => ({ ...f, subheadline: v }))} placeholder="NAUSICA DELLA VALLE" />
            <TextInput label="Sottotitolo" value={form.subtitle} onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))} placeholder="Messaggi di fede..." multiline />
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Messaggi ────────────────────────────────────────────────────────────────
function MessaggiEditor() {
    const [videos, setVideos] = useState([{ id: "", title: "" }]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "messaggi")).then((s) => {
            if (s.exists() && s.data().videos?.length) setVideos(s.data().videos);
        }).catch(() => {});
    }, []);

    const addVideo = () => setVideos((v) => [...v, { id: "", title: "" }]);
    const removeVideo = (i: number) => setVideos((v) => v.filter((_, idx) => idx !== i));
    const updateVideo = (i: number, field: "id" | "title", val: string) =>
        setVideos((v) => v.map((vid, idx) => idx === i ? { ...vid, [field]: val } : vid));

    const save = async () => {
        const valid = videos.filter((v) => v.id.trim());
        if (!valid.length) { toast.error("Aggiungi almeno un video"); return; }
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "messaggi"), { videos: valid }, { merge: true });
            toast.success("Video aggiornati!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400">Inserisci l'ID del video YouTube (es. da youtube.com/watch?v=<b>jIyVKkUjoj0</b>)</p>
            {videos.map((v, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-navy text-sm focus:outline-none focus:border-secondary transition-colors"
                            placeholder="ID video (es. jIyVKkUjoj0)"
                            value={v.id}
                            onChange={(e) => updateVideo(i, "id", e.target.value)}
                        />
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-navy text-sm focus:outline-none focus:border-secondary transition-colors"
                            placeholder="Titolo del video"
                            value={v.title}
                            onChange={(e) => updateVideo(i, "title", e.target.value)}
                        />
                    </div>
                    {videos.length > 1 && (
                        <button type="button" onClick={() => removeVideo(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
            {videos.length < 6 && (
                <button type="button" onClick={addVideo} className="flex items-center gap-2 text-sm text-secondary font-bold hover:text-navy transition-colors">
                    <Plus className="w-4 h-4" /> Aggiungi video
                </button>
            )}
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Chiesa ───────────────────────────────────────────────────────────────────
function ChiesaEditor() {
    const [form, setForm] = useState({ gallery: ["", ""], logoUrl: "", description: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "chiesa")).then((s) => {
            if (s.exists()) setForm((prev) => ({ ...prev, ...s.data() }));
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "chiesa"), form, { merge: true });
            toast.success("Chiesa aggiornata!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <ImageUploadField label="Foto galleria 1" currentUrl={form.gallery[0] || ""} onUploaded={(url) => setForm((f) => ({ ...f, gallery: [url, f.gallery[1] || ""] }))} storagePath="public/site-content/chiesa" />
            <ImageUploadField label="Foto galleria 2" currentUrl={form.gallery[1] || ""} onUploaded={(url) => setForm((f) => ({ ...f, gallery: [f.gallery[0] || "", url] }))} storagePath="public/site-content/chiesa" />
            <ImageUploadField label="Logo chiesa" currentUrl={form.logoUrl} onUploaded={(url) => setForm((f) => ({ ...f, logoUrl: url }))} storagePath="public/site-content/chiesa" />
            <TextInput label="Descrizione" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} multiline placeholder="Una comunità vibrante..." />
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Libro ────────────────────────────────────────────────────────────────────
function LibroEditor() {
    const [form, setForm] = useState({ coverUrl: "", subtitle: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "libro")).then((s) => {
            if (s.exists()) setForm((prev) => ({ ...prev, ...s.data() }));
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "libro"), form, { merge: true });
            toast.success("Libro aggiornato!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <ImageUploadField label="Copertina libro" currentUrl={form.coverUrl} onUploaded={(url) => setForm((f) => ({ ...f, coverUrl: url }))} storagePath="public/site-content/libro" />
            <TextInput label="Descrizione" value={form.subtitle} onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))} multiline placeholder="Scopri la potente testimonianza..." />
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Donation + PayPal ────────────────────────────────────────────────────────
function DonationEditor() {
    const [form, setForm] = useState({ iban: "", bic: "", bankName: "", bankAddress: "", correspondentBic: "", paypalClientId: "" });
    const [paypalSecret, setPaypalSecret] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            getDoc(doc(db, "siteContent", "donation")),
            getDoc(doc(db, "adminConfig", "paypal")),
        ]).then(([donationSnap, paypalSnap]) => {
            if (donationSnap.exists()) setForm((prev) => ({ ...prev, ...donationSnap.data() }));
            if (paypalSnap.exists()) {
                const data = paypalSnap.data() as { secretKey?: string };
                if (data.secretKey) setPaypalSecret("••••••••");
            }
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "donation"), {
                iban: form.iban,
                bic: form.bic,
                bankName: form.bankName,
                bankAddress: form.bankAddress,
                correspondentBic: form.correspondentBic,
                paypalClientId: form.paypalClientId,
            }, { merge: true });

            if (paypalSecret && paypalSecret !== "••••••••") {
                await setDoc(doc(db, "adminConfig", "paypal"), {
                    clientId: form.paypalClientId,
                    secretKey: paypalSecret,
                }, { merge: true });
            }
            toast.success("Donazioni aggiornate!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    const fieldCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-secondary transition-colors";

    return (
        <div className="space-y-4">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest">Dati Bancari</p>
            <TextInput label="IBAN" value={form.iban} onChange={(v) => setForm((f) => ({ ...f, iban: v }))} placeholder="IT46 C036..." />
            <TextInput label="BIC/SWIFT" value={form.bic} onChange={(v) => setForm((f) => ({ ...f, bic: v }))} placeholder="REVOITM2" />
            <TextInput label="Nome banca" value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} placeholder="Revolut Bank UAB" />
            <TextInput label="Indirizzo banca" value={form.bankAddress} onChange={(v) => setForm((f) => ({ ...f, bankAddress: v }))} placeholder="Via Dante 7, 20123, Milano" />
            <TextInput label="BIC banca corrispondente" value={form.correspondentBic} onChange={(v) => setForm((f) => ({ ...f, correspondentBic: v }))} placeholder="CHASDEFX" />

            <div className="pt-2 border-t border-slate-100 space-y-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">PayPal</p>
                <p className="text-xs text-slate-400">Inserisci le credenziali PayPal per abilitare il pulsante di donazione online. Puoi trovarle nel tuo account PayPal Developer.</p>
                <TextInput label="PayPal Client ID (pubblico)" value={form.paypalClientId} onChange={(v) => setForm((f) => ({ ...f, paypalClientId: v }))} placeholder="AaBbCc..." />
                <div>
                    <FieldLabel>PayPal Secret Key (privato)</FieldLabel>
                    <input
                        type="password"
                        className={fieldCls}
                        value={paypalSecret}
                        onChange={(e) => setPaypalSecret(e.target.value)}
                        placeholder="Inserisci per aggiornare"
                        autoComplete="new-password"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Lascia vuoto per mantenere il valore attuale.</p>
                </div>
            </div>
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Mission ──────────────────────────────────────────────────────────────────
function MissionEditor() {
    const [form, setForm] = useState({
        paragraph1: "", paragraph2: "", paragraph3: "",
        cards: [
            { title: "", desc: "" },
            { title: "", desc: "" },
            { title: "", desc: "" },
            { title: "", desc: "" },
        ],
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "mission")).then((s) => {
            if (s.exists()) setForm((prev) => ({ ...prev, ...s.data() }));
        }).catch(() => {});
    }, []);

    const updateCard = (i: number, field: "title" | "desc", val: string) =>
        setForm((f) => ({ ...f, cards: f.cards.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "mission"), form, { merge: true });
            toast.success("Missione aggiornata!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <TextInput label="Paragrafo 1" value={form.paragraph1} onChange={(v) => setForm((f) => ({ ...f, paragraph1: v }))} multiline />
            <TextInput label="Paragrafo 2" value={form.paragraph2} onChange={(v) => setForm((f) => ({ ...f, paragraph2: v }))} multiline />
            <TextInput label="Paragrafo 3" value={form.paragraph3} onChange={(v) => setForm((f) => ({ ...f, paragraph3: v }))} multiline />
            <p className="text-xs font-bold text-secondary uppercase tracking-widest pt-2">Quattro Schede</p>
            {form.cards.map((card, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scheda {i + 1}</p>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-navy text-sm focus:outline-none focus:border-secondary" placeholder="Titolo" value={card.title} onChange={(e) => updateCard(i, "title", e.target.value)} />
                    <textarea rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-navy text-sm focus:outline-none focus:border-secondary" placeholder="Descrizione" value={card.desc} onChange={(e) => updateCard(i, "desc", e.target.value)} />
                </div>
            ))}
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Copertura ────────────────────────────────────────────────────────────────
function CoperturaEditor() {
    const [form, setForm] = useState({ paragraph1: "", paragraph2: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "copertura")).then((s) => {
            if (s.exists()) setForm((prev) => ({ ...prev, ...s.data() }));
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "copertura"), form, { merge: true });
            toast.success("Copertura aggiornata!");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <TextInput label="Paragrafo 1" value={form.paragraph1} onChange={(v) => setForm((f) => ({ ...f, paragraph1: v }))} multiline />
            <TextInput label="Paragrafo 2 (fondo pagina)" value={form.paragraph2} onChange={(v) => setForm((f) => ({ ...f, paragraph2: v }))} multiline />
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Branding ─────────────────────────────────────────────────────────────────
function BrandingEditor() {
    const [form, setForm] = useState({ primaryColor: "#0f172a", secondaryColor: "#f59e0b" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "siteContent", "branding")).then((s) => {
            if (s.exists()) setForm((prev) => ({ ...prev, ...s.data() }));
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteContent", "branding"), form, { merge: true });
            toast.success("Colori aggiornati! Ricarica la pagina per vederli.");
        } catch { toast.error("Errore nel salvataggio"); }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <p className="text-xs text-slate-400">Cambia i colori principali del sito. Le modifiche saranno visibili ai visitatori al prossimo caricamento della pagina.</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <FieldLabel>Colore Primario (Navy)</FieldLabel>
                    <div className="flex items-center gap-3 mt-1">
                        <input type="color" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1" />
                        <span className="text-sm font-mono text-slate-500">{form.primaryColor}</span>
                    </div>
                </div>
                <div>
                    <FieldLabel>Colore Accento (Oro)</FieldLabel>
                    <div className="flex items-center gap-3 mt-1">
                        <input type="color" value={form.secondaryColor} onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))} className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1" />
                        <span className="text-sm font-mono text-slate-500">{form.secondaryColor}</span>
                    </div>
                </div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                <Palette className="w-5 h-5 text-slate-400" />
                <p className="text-xs text-slate-500">Anteprima: <span className="font-bold" style={{ color: form.primaryColor }}>Testo primario</span> · <span className="font-bold" style={{ color: form.secondaryColor }}>Accento dorato</span></p>
            </div>
            <button
                type="button"
                onClick={() => setForm({ primaryColor: "#0f172a", secondaryColor: "#f59e0b" })}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
                Ripristina valori originali
            </button>
            <SaveButton saving={saving} onClick={save} />
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ContentTab({ user: _user }: ContentTabProps) {
    return (
        <div className="space-y-4 max-w-3xl">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-6">
                Modifica testi, foto e colori del sito pubblico
            </p>
            <SectionCard title={SECTION_LABELS.hero} defaultOpen>
                <HeroEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.messaggi}>
                <MessaggiEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.chiesa}>
                <ChiesaEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.libro}>
                <LibroEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.donation}>
                <DonationEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.mission}>
                <MissionEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.copertura}>
                <CoperturaEditor />
            </SectionCard>
            <SectionCard title={SECTION_LABELS.branding}>
                <BrandingEditor />
            </SectionCard>
        </div>
    );
}
