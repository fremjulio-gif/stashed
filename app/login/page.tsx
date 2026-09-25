"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Disc, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import { animate, spring } from "animejs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        opacity: [0, 1],
        scale: [0.94, 1],
        translateY: [20, 0],
        duration: 400,
        ease: spring({ bounce: 0.25, stiffness: 120, damping: 14 }),
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Veuillez saisir votre code d'accès.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code d'accès incorrect");
      }

      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={cardRef} className="relative z-10 w-full max-w-md">
      <GlassCard className="p-8 shadow-2xl liquid-border">
        {/* Studio Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan shadow-[0_0_20px_rgba(0,255,213,0.3)]">
            <Disc className="h-7 w-7 animate-pulse" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            STASHED
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_#00ffd5]" />
          </h1>
          <p className="mt-1 text-xs text-neutral-400 font-technical uppercase tracking-wider">
            Accès Propriétaire • jlowav
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-technical">
              Code secret / Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-sm tracking-widest text-white outline-none focus:border-white/30"
                autoFocus
                required
              />
              <KeyRound className="absolute right-3.5 top-3.5 h-4 w-4 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          <GlassButton
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
            glow
          >
            {loading ? "Vérification..." : "Entrer dans le Studio"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </GlassButton>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
          <p className="text-[11px] text-neutral-500 font-technical flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Session sécurisée par cookie JWT chiffré
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-daw-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute h-[400px] w-[500px] rounded-full bg-accent-cyan/15 blur-[120px]" />
      <Suspense
        fallback={
          <div className="text-xs font-technical text-neutral-500">
            Initialisation du studio...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
