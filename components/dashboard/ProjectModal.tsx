"use client";

import React, { useState, useEffect } from "react";
import { GlassModal } from "../ui/GlassModal";
import { GlassButton } from "../ui/GlassButton";
import { DBProject } from "@/lib/db";
import { Upload, Check, Image as ImageIcon } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: DBProject | null;
  onSaved: () => void;
}

const COLOR_PRESETS = [
  { name: "Cyan DAW", color: "#00ffd5" },
  { name: "Logic Amber", color: "#ff9f1c" },
  { name: "Synth Violet", color: "#a855f7" },
  { name: "Acid Lime", color: "#a3e635" },
  { name: "Electric Rose", color: "#f43f5e" },
  { name: "Cobalt Blue", color: "#38bdf8" },
];

export function ProjectModal({
  isOpen,
  onClose,
  project,
  onSaved,
}: ProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#00ffd5");
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || "");
      setCoverImageUrl(project.coverImageUrl || "");
      setAccentColor(project.accentColor || "#00ffd5");
      setIsDownloadable(project.isDownloadable ?? true);
    } else {
      setTitle("");
      setDescription("");
      setCoverImageUrl("");
      setAccentColor("#00ffd5");
      setIsDownloadable(true);
    }
    setError(null);
  }, [project, isOpen]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "cover");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'upload de l'image");
      }
      setCoverImageUrl(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur upload cover");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre du projet est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const method = project ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          coverImageUrl: coverImageUrl || null,
          accentColor,
          isDownloadable,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde du projet");
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? "Modifier le projet" : "Nouveau Projet / Dossier"}
      description="Configurez les métadonnées audio, la cover et l'ambiance lumineuse."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Cover Preview & Upload */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 font-technical">
            Artwork de Cover
          </label>
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40"
              style={{
                boxShadow: coverImageUrl ? `0 0 20px -5px ${accentColor}40` : "none",
              }}
            >
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-neutral-600" />
              )}
            </div>

            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white hover:bg-white/[0.12] transition-colors">
                <Upload className="mr-2 h-3.5 w-3.5" />
                {isUploadingCover ? "Upload en cours..." : "Choisir une cover"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover}
                />
              </label>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                Format carré recommandé (JPG, PNG, WebP jusqu'à 10 Mo).
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-technical">
            Titre du Projet *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Liquid Glass EP, Master Mix..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-technical">
            Description / Notes de Session
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails du mix, équipement, notes pour les auditeurs..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 resize-none"
          />
        </div>

        {/* Accent Color Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 font-technical">
            Couleur d&apos;accent DAW
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLOR_PRESETS.map((p) => {
              const isSelected = accentColor === p.color;
              return (
                <button
                  type="button"
                  key={p.color}
                  onClick={() => setAccentColor(p.color)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/20 transition-transform active:scale-95"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {isSelected && (
                    <Check className="h-4 w-4 text-black stroke-[3]" />
                  )}
                </button>
              );
            })}
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent"
              title="Couleur personnalisée"
            />
          </div>
        </div>

        {/* Download Permission Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div>
            <span className="text-xs font-semibold text-white">
              Autoriser le téléchargement
            </span>
            <p className="text-[11px] text-neutral-400">
              Les auditeurs sur le lien public pourront télécharger les fichiers originaux.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isDownloadable}
            onChange={(e) => setIsDownloadable(e.target.checked)}
            className="h-4 w-4 rounded accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            accentColor={accentColor}
            glow
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? "Enregistrement..." : project ? "Mettre à jour" : "Créer le projet"}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
