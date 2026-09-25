"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BackgroundWaveform } from "@/components/landing/BackgroundWaveform";
import { Disc, ArrowRight, User, Loader2, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [existingUser, setExistingUser] = useState<{ pseudo: string; visitorId: string } | null>(null);
  const [isChangingPseudo, setIsChangingPseudo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    // 1. Quick check localStorage
    try {
      const stored = localStorage.getItem("stashed_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.pseudo) {
          setExistingUser(parsed);
          setPseudo(parsed.pseudo);
        }
      }
    } catch {
      // Ignored
    }

    // 2. Fetch official session cookie
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user?.pseudo) {
          setExistingUser(data.user);
          setPseudo(data.user.pseudo);
          try {
            localStorage.setItem("stashed_user", JSON.stringify(data.user));
          } catch {
            // Ignored
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setInitialCheckDone(true);
      });
  }, []);

  const handleEnter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPseudo = pseudo.trim();

    if (!cleanPseudo || cleanPseudo.length < 2) {
      setError("Le pseudo doit contenir au moins 2 caractères.");
      return;
    }

    if (cleanPseudo.length > 24) {
      setError("Le pseudo ne peut pas dépasser 24 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: cleanPseudo }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de connexion");
      }

      if (data?.user) {
        try {
          localStorage.setItem("stashed_user", JSON.stringify(data.user));
        } catch {
          // Ignored
        }
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setLoading(false);
    }
  };

  return (
    <div className="relative h-dvh min-h-dvh max-h-dvh w-full overflow-hidden bg-studio-950 bg-daw-grid flex flex-col justify-between items-center px-4 py-4 sm:py-6 select-none">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[700px] rounded-full bg-accent-cyan/12 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-[350px] w-[500px] rounded-full bg-accent-blue/10 blur-[130px]" />

      {/* Background Animated Subtle Waveform */}
      <BackgroundWaveform />

      {/* Minimal Top Header */}
      <header className="relative z-20 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan shadow-[0_0_15px_rgba(0,255,213,0.25)]">
            <Disc className="h-4 w-4 animate-spin" style={{ animationDuration: "10s" }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              STASHED
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_#00ffd5]" />
            <span className="text-[10px] font-technical uppercase tracking-wider text-neutral-400 border border-white/10 rounded px-1.5 py-0.2 bg-white/[0.03]">
              DAW Drive
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Centered Minimalist Glass Panel */}
      <main className="relative z-20 w-full max-w-md my-auto flex flex-col items-center text-center">
        <GlassCard
          glowColor="#00ffd5"
          className="w-full p-6 sm:p-8 liquid-border shadow-2xl backdrop-blur-3xl bg-studio-950/75"
        >
          {/* Subtle Live Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-technical text-neutral-300 backdrop-blur-xl mb-4">
            <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
            <span>Serveur Audio Collaboratif</span>
          </div>

          {/* Project Title & Short Single-Sentence Tagline */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            STASHED
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
            Le drive audio collaboratif et ouvert pour musiciens et producteurs.
          </p>

          {/* Form or Existing Session Action */}
          <div className="mt-6">
            {initialCheckDone && existingUser && !isChangingPseudo ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/15 text-accent-cyan">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-technical text-neutral-400">
                        Connecté en tant que
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {existingUser.pseudo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsChangingPseudo(true);
                      setPseudo(existingUser.pseudo);
                    }}
                    className="text-[11px] font-technical text-neutral-400 hover:text-accent-cyan underline transition-colors"
                  >
                    Changer
                  </button>
                </div>

                <GlassButton
                  variant="primary"
                  size="lg"
                  glow
                  disabled={loading}
                  onClick={() => handleEnter()}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Entrer dans la bibliothèque</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </GlassButton>
              </div>
            ) : (
              <form onSubmit={handleEnter} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Votre pseudo (ex: Alex, Beatmaker92...)"
                    maxLength={24}
                    autoFocus
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all focus:border-accent-cyan/60 focus:ring-1 focus:ring-accent-cyan/30"
                  />
                </div>

                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  glow
                  disabled={loading || !pseudo.trim()}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Entrer dans la bibliothèque</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </GlassButton>

                {existingUser && isChangingPseudo && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPseudo(false);
                      setPseudo(existingUser.pseudo);
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Annuler et garder &ldquo;{existingUser.pseudo}&rdquo;
                  </button>
                )}
              </form>
            )}
          </div>
        </GlassCard>
      </main>

      {/* Minimal Footer (Zero Scroll, Locked in Viewport) */}
      <footer className="relative z-20 w-full max-w-5xl flex items-center justify-between text-[11px] font-technical text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          <span>Fichiers non-compressés WAV & MP3</span>
        </div>
        <div>
          <span>100% Ouvert & Collaboratif</span>
        </div>
      </footer>
    </div>
  );
}
