"use client";

import React from "react";
import Link from "next/link";
import { DBProject } from "@/lib/db";
import { GlassCard } from "../ui/GlassCard";
import { Folder, Music2, Share2, Edit2, Trash2, User } from "lucide-react";

interface ProjectCardProps {
  project: DBProject;
  canEdit?: boolean;
  onEdit: (project: DBProject) => void;
  onDelete: (project: DBProject) => void;
  onShare: (project: DBProject) => void;
}

export function ProjectCard({
  project,
  canEdit = false,
  onEdit,
  onDelete,
  onShare,
}: ProjectCardProps) {
  const trackCount = project.tracks?.length || 0;
  const totalDuration =
    project.tracks?.reduce((acc, t) => acc + (t.duration || 0), 0) || 0;

  const formatTotalTime = (secs: number) => {
    if (!secs) return "0 min";
    const mins = Math.floor(secs / 60);
    return `${mins} min`;
  };

  return (
    <GlassCard
      isHoverable
      glowColor={project.accentColor}
      className="group flex flex-col justify-between p-4 transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Artwork Header */}
        <Link href={`/dashboard/project/${project.id}`}>
          <div className="relative aspect-video sm:aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black/50 mb-3.5">
            {project.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.coverImageUrl}
                alt={project.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.02]">
                <Folder
                  className="h-12 w-12 text-neutral-600 transition-colors group-hover:text-neutral-400"
                  style={{ color: project.accentColor }}
                />
              </div>
            )}

            {/* Accent Glow Pill */}
            <div
              className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full"
              style={{
                backgroundColor: project.accentColor,
                boxShadow: `0 0 10px ${project.accentColor}`,
              }}
            />
          </div>
        </Link>

        {/* Info */}
        <Link href={`/dashboard/project/${project.id}`} className="block">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="truncate text-base font-semibold text-white tracking-tight group-hover:text-white">
              {project.title}
            </h3>
          </div>

          {/* Creator Attribution Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-technical text-neutral-400 mb-2">
            <User className="h-3 w-3 text-neutral-500" />
            <span className="text-neutral-500">Créé par</span>
            <span className="text-white font-medium bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">
              {project.creatorName || "Anonyme"}
            </span>
          </div>

          <p className="line-clamp-2 text-xs text-neutral-400 font-normal">
            {project.description || "Aucune note de session."}
          </p>
        </Link>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 font-technical text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Music2 className="h-3 w-3 text-neutral-500" />
            {trackCount} {trackCount <= 1 ? "piste" : "pistes"}
          </span>
          <span>•</span>
          <span>{formatTotalTime(totalDuration)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(project);
            }}
            title="Partager le projet"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {canEdit && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                title="Modifier le projet"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
                title="Supprimer le projet"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
