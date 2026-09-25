"use client";

import React, { useState, useEffect, useRef } from "react";
import { DBProject, DBTrack } from "@/lib/db";
import { WaveformTrackItem } from "@/components/audio/WaveformTrackItem";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Disc,
  Lock,
  Music,
  Clock,
  Download,
  AlertCircle,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { animate } from "animejs";

interface PublicShareViewerProps {
  token: string;
}

export default function PublicShareViewer({ token }: PublicShareViewerProps) {
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [shareData, setShareData] = useState<{
    id: string;
    token: string;
    allowDownload: boolean;
    viewCount: number;
    listenCount: number;
    project?: DBProject;
    track?: DBTrack;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchShareData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/share/${token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de charger ce lien");
      }

      if (data.requiresPassword) {
        setRequiresPassword(true);
        return;
      }

      setShareData(data.shareLink);
      setRequiresPassword(false);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShareData();
  }, [token]);

  // Anime.js v4 entrance on content load
  useEffect(() => {
    if (!loading && !requiresPassword && contentRef.current) {
      animate(contentRef.current, {
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 450,
        ease: "outQuad",
      });
    }
  }, [loading, requiresPassword]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    try {
      const res = await fetch(`/api/share/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mot de passe incorrect");
      }

      setShareData(data.shareLink);
      setRequiresPassword(false);
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Mot de passe invalide"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-daw-grid flex items-center justify-center font-technical text-neutral-400">
        <Disc className="h-6 w-6 animate-spin mr-2 text-accent-cyan" />
        Chargement de la session audio...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-daw-grid flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Lien Indisponible</h2>
          <p className="text-xs text-neutral-400 mb-6">{errorMessage}</p>
        </GlassCard>
      </div>
    );
  }

  // Password Prompt Screen
  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-daw-grid flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center liquid-border">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent-cyan shadow-[0_0_20px_rgba(0,255,213,0.3)]">
            <Lock className="h-6 w-6" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight mb-1">
            Session Audio Protégée
          </h2>
          <p className="text-xs text-neutral-400 mb-6">
            Cette bibliothèque a été partagée de manière privée par jlowav. Veuillez entrer le mot de passe pour accéder aux pistes.
          </p>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            {passwordError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {passwordError}
              </div>
            )}

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Code d'accès"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-sm tracking-widest text-white outline-none focus:border-white/30"
              autoFocus
              required
            />

            <GlassButton type="submit" variant="primary" className="w-full">
              Déverrouiller l&apos;écoute
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  if (!shareData) return null;

  const project = shareData.project;
  const singleTrack = shareData.track;
  const tracks: DBTrack[] = project?.tracks || (singleTrack ? [singleTrack] : []);
  const accentColor = project?.accentColor || "#00ffd5";

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-daw-grid pb-36 relative overflow-hidden">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-20 blur-[120px]"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-white/[0.08] bg-studio-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}50`,
                color: accentColor,
              }}
            >
              <Disc className="h-4 w-4 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                STASHED
                <span
                  className="flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </span>
              <p className="text-[9px] font-technical uppercase tracking-wider text-neutral-400">
                Shared Listening Vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-technical text-neutral-400">
              <Headphones className="h-3 w-3 text-neutral-400" />
              Auditeur Invité
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Listener Stage */}
      <main ref={contentRef} className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Project / Track Showcase Card */}
        <GlassCard
          glowColor={accentColor}
          className="mb-8 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Cover Artwork */}
            <div
              className="relative aspect-square w-40 sm:w-52 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl"
              style={{
                boxShadow: `0 0 35px -5px ${accentColor}40`,
              }}
            >
              {project?.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.coverImageUrl}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                  <Disc className="h-16 w-16" style={{ color: accentColor }} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 font-technical text-xs text-neutral-400 mb-1.5">
                <span className="uppercase tracking-wider">Mastering Studio</span>
                <span>•</span>
                <span className="text-white font-medium">Curated by jlowav</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {project?.title || singleTrack?.title || "Session Audio"}
              </h1>

              {project?.description && (
                <p className="mt-2 text-sm text-neutral-300 font-normal leading-relaxed max-w-xl">
                  {project.description}
                </p>
              )}

              {/* Technical badges */}
              <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-technical text-neutral-400">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                  <Music className="h-3.5 w-3.5 text-neutral-400" />
                  <span>
                    {tracks.length} {tracks.length <= 1 ? "piste" : "pistes"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{formatTotalTime(totalDuration)}</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                  <Download className="h-3.5 w-3.5 text-neutral-400" />
                  <span>
                    {shareData.allowDownload
                      ? "Téléchargement disponible"
                      : "Écoute streaming"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Tracklist with embedded waveforms */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 font-technical">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Liste des pistes ({tracks.length})
            </h2>
            <span className="text-[11px] text-neutral-500">
              Streaming sans perte • Range requests activé
            </span>
          </div>

          <div className="space-y-2">
            {tracks.map((track, i) => (
              <WaveformTrackItem
                key={track.id}
                track={track}
                index={i}
                playlist={tracks}
                accentColor={accentColor}
                isOwner={false}
                allowDownload={shareData.allowDownload}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
