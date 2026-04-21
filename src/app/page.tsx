import Navbar from "@/components/Navbar";
import { Facebook, Instagram, Youtube } from "lucide-react";
import Hero from "@/components/Hero";
import Events from "@/components/Events";
import Mission from "@/components/Mission";
import Messaggi from "@/components/Messaggi";
import Libro from "@/components/Libro";
import Copertura from "@/components/Copertura";
import ScamWarning from "@/components/ScamWarning";
import InvitationForm from "@/components/InvitationForm";
import DonationSection from "@/components/DonationSection";
import Chiesa from "@/components/Chiesa";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16 lg:pt-20">
        <Hero />
      </div>

      {/* Target sections for navigation anchor links */}
      <div id="agenda" className="scroll-mt-20">
        <Events />
      </div>

      <div id="missione" className="scroll-mt-20">
        <Mission />
      </div>

      <div id="chiesa" className="scroll-mt-20">
        <Chiesa />
      </div>

      <div id="messaggi" className="scroll-mt-20">
        <Messaggi />
      </div>

      <div id="libro" className="scroll-mt-20">
        <Libro />
      </div>

      <div id="copertura" className="scroll-mt-20">
        <Copertura />
      </div>

      <div id="invita" className="scroll-mt-20">
        <InvitationForm />
      </div>

      <div id="donazioni" className="scroll-mt-20 pb-20">
        <DonationSection />
      </div>

      <ScamWarning />

      <footer className="bg-navy text-white/50 py-12 px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <p className="text-sm text-white/60">&copy; {new Date().getFullYear()} Ministero Apostolico Nausica della Valle.</p>
            <p className="text-sm text-white/60">
              Tutti i diritti riservati. Fatto con amore ❤️ 🇮🇹 da{" "}
              <a
                href="https://engadi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline decoration-white/20 underline-offset-2"
              >
                engadi.com
              </a>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/people/Nausica-Della-Valle-Offical/100064220134407/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-all p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/20"
              aria-label="Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="https://www.instagram.com/nausicadellavalleofficial/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-all p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/20"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="https://www.youtube.com/@nausicadellavalle-tv6794"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-all p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/20"
              aria-label="YouTube"
            >
              <Youtube className="w-6 h-6" />
            </a>
            <a
              href="https://www.tiktok.com/@nausica.dellavalle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-all p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/20"
              aria-label="TikTok"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
