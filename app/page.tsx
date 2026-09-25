import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Disc,
  ArrowRight,
  Headphones,
  Sliders,
  Share2,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Play,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-daw-grid pb-24 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-accent-cyan/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-[400px] w-[500px] rounded-full bg-accent-violet/10 blur-[130px]" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-studio-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan shadow-[0_0_15px_rgba(0,255,213,0.3)]">
              <Disc className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                STASHED
                <span className="flex h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_#00ffd5]" />
              </span>
              <p className="text-[9px] font-technical uppercase tracking-wider text-neutral-400">
                Audio Vault for Engineers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard">
              <GlassButton variant="primary" size="sm" glow>
                Accéder au Studio <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </GlassButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-16 sm:pt-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-technical text-neutral-300 backdrop-blur-xl mb-6 shadow-glass-sm">
          <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-ping" />
          <span>Inspiré de Untitled.stream & Samply</span>
          <span>•</span>
          <span className="text-accent-cyan font-semibold">100% Gratuit</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight sm:leading-none">
          Votre bibliothèque audio personnelle,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-teal-200 to-accent-blue">
            sublimée pour le son pro.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Déposez vos stems, mixes et masters .wav & .mp3. Organisez vos projets avec pochettes et teintes DAW personnalisées. Partagez un lien d&apos;écoute épuré avec waveform interactive, sans aucune friction pour vos auditeurs.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <GlassButton variant="primary" size="lg" glow className="px-8">
              Ouvrir ma bibliothèque
              <ArrowRight className="h-4 w-4 ml-2" />
            </GlassButton>
          </Link>

          <Link href="/share/demo-stashed">
            <GlassButton variant="secondary" size="lg" className="px-6">
              <Play className="h-4 w-4 mr-2 text-accent-cyan fill-current" />
              Tester la vue auditeur
            </GlassButton>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <GlassCard glowColor="#00ffd5" className="p-6">
            <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan flex items-center justify-center mb-4">
              <HardDrive className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Fichiers .WAV & .MP3 Non-Compressés
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              Support natif des fichiers lourds 24-bit 48kHz avec streaming par range-requests. Écoute instantanée sans temps de chargement.
            </p>
          </GlassCard>

          <GlassCard glowColor="#ff9f1c" className="p-6">
            <div className="h-10 w-10 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber flex items-center justify-center mb-4">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Apple Liquid Glass x DAW UI
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              Flou d&apos;arrière-plan profond, bords lumineux, waveforms haute définition et VU-mètres stéréo réactifs animés avec Anime.js v4.
            </p>
          </GlassCard>

          <GlassCard glowColor="#a855f7" className="p-6">
            <div className="h-10 w-10 rounded-xl bg-accent-violet/10 border border-accent-violet/30 text-accent-violet flex items-center justify-center mb-4">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Partage Public Zéro Friction
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              Lien public direct pour vos clients et collaborateurs. Aucun compte requis pour écouter. Mot de passe et date d&apos;expiration optionnels.
            </p>
          </GlassCard>
        </div>

        {/* Sound Engineer Signature */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-technical gap-4">
          <div>
            Mastered for <span className="text-neutral-300 font-bold">jlowav</span> • Sound Engineering Studio
          </div>
          <div>
            Propulsé par Next.js, Prisma, Tailwind CSS & Anime.js v4
          </div>
        </div>
      </main>
    </div>
  );
}
