"use client";

import React, { useState } from "react";
import { GlassModal } from "../ui/GlassModal";
import { GlassButton } from "../ui/GlassButton";
import { DBProject, DBTrack } from "@/lib/db";
import {
  Link as LinkIcon,
  Copy,
  Check,
  Lock,
  Calendar,
  Eye,
  Headphones,
  ShieldCheck,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: DBProject | null;
  track?: DBTrack | null;
}

export function ShareModal({
  isOpen,
  onClose,
  project,
  track,
}: ShareModalProps) {
  const [password, setPassword] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("never");
  const [allowDownload, setAllowDownload] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = project
    ? `Partager le projet "${project.title}"`
    : track
    ? `Partager la piste "${track.title}"`
    : "Générer un lien de partage";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    let expiresAt: string | null = null;
    if (expiresInDays !== "never") {
      const days = parseInt(expiresInDays, 10);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      expiresAt = expDate.toISOString();
    }

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id || null,
          trackId: track?.id || null,
          password: password.trim() || null,
          expiresAt,
          allowDownload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Impossible de générer le lien");
      }

      const share = await res.json();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://stashedd.vercel.app";
      setCreatedUrl(`${origin}/share/${share.token}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur génération lien");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCreatedUrl(null);
    setPassword("");
    setExpiresInDays("never");
    setCopied(false);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title={title}
      description="Partagez un lien direct haute fidélité sans aucune inscription requise pour les auditeurs."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {createdUrl ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
            <div className="flex items-center gap-2 text-sm font-semibold mb-1">
              <ShieldCheck className="h-4 w-4" /> Lien de partage actif
            </div>
            <p className="text-xs text-emerald-400/80">
              Votre lien est prêt à être partagé. Accessible instantanément sur mobile et desktop.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-2">
            <input
              type="text"
              readOnly
              value={createdUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-white outline-none select-all"
            />
            <GlassButton
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copier
                </>
              )}
            </GlassButton>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              Créer un autre lien
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                handleReset();
                onClose();
              }}
            >
              Fermer
            </GlassButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Optional Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-technical">
              <Lock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Mot de passe optionnel
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Laisser vide pour un accès libre sans mot de passe"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/30"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Si configuré, l&apos;auditeur devra saisir ce code avant d&apos;écouter.
            </p>
          </div>

          {/* Optional Expiration */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-technical">
              <Calendar className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Date d&apos;expiration
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="never">Jamais (lien permanent)</option>
              <option value="1">Expire dans 24 heures</option>
              <option value="7">Expire dans 7 jours</option>
              <option value="30">Expire dans 30 jours</option>
            </select>
          </div>

          {/* Download Permission Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
            <div>
              <span className="text-xs font-semibold text-white">
                Autoriser le téléchargement direct
              </span>
              <p className="text-[11px] text-neutral-400">
                Permettre à l&apos;auditeur de télécharger les stems / masters audio.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
              className="h-4 w-4 rounded accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isGenerating}
            >
              Annuler
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isGenerating}
            >
              {isGenerating ? "Génération..." : "Générer le lien public"}
            </GlassButton>
          </div>
        </form>
      )}
    </GlassModal>
  );
}
