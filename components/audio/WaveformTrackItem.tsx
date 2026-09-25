"use client";

import React from "react";
import { DBTrack } from "@/lib/db";
import { usePlayerStore } from "@/lib/player-store";
import { WaveformCanvas } from "./WaveformCanvas";
import {
  Play,
  Pause,
  Download,
  Share2,
  Edit2,
  Trash2,
  GripVertical,
} from "lucide-react";

interface WaveformTrackItemProps {
  track: DBTrack;
  index: number;
  playlist?: DBTrack[];
  accentColor?: string;
  isOwner?: boolean;
  canEdit?: boolean;
  allowDownload?: boolean;
  onEdit?: (track: DBTrack) => void;
  onDelete?: (track: DBTrack) => void;
  onShare?: (track: DBTrack) => void;
  isDragging?: boolean;
}

export function WaveformTrackItem({
  track,
  index,
  playlist = [],
  accentColor = "#00ffd5",
  isOwner = false,
  canEdit = false,
  allowDownload = true,
  onEdit,
  onDelete,
  onShare,
}: WaveformTrackItemProps) {
  const canModify = isOwner || canEdit;
  const { currentTrack, isPlaying, currentTime, duration, playTrack, seekTo } =
    usePlayerStore();

  const isCurrent = currentTrack?.id === track.id;
  const trackIsPlaying = isCurrent && isPlaying;

  const currentDuration = isCurrent ? duration || track.duration : track.duration;
  const progress =
    isCurrent && currentDuration > 0
      ? Math.min(1, Math.max(0, currentTime / currentDuration))
      : 0;

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} Mo`;
  };

  const handleToggle = () => {
    playTrack(track, playlist, accentColor);
  };

  const handleSeek = (ratio: number) => {
    if (!isCurrent) {
      playTrack(track, playlist, accentColor);
    }
    const targetTime = ratio * (track.duration || 1);
    seekTo(targetTime);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all backdrop-blur-xl ${
        isCurrent
          ? "border-white/[0.18] bg-white/[0.06] shadow-lg shadow-black/40"
          : "border-white/[0.06] bg-studio-900/40 hover:border-white/[0.12] hover:bg-studio-900/70"
      }`}
      style={{
        boxShadow: isCurrent ? `0 0 24px -8px ${accentColor}30` : undefined,
      }}
    >
      <div className="flex flex-col gap-2.5">
        {/* Top Row: Index, Play button, Title, Metadata tags, Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Drag Handle if allowed to edit */}
            {canModify && (
              <div
                className="cursor-grab text-neutral-600 hover:text-neutral-300 active:cursor-grabbing p-1 -ml-1"
                title="Glisser pour réorganiser"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}

            {/* Play/Pause Button */}
            <button
              onClick={handleToggle}
              aria-label={trackIsPlaying ? "Pause" : "Lire"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white transition-transform active:scale-95 shadow-sm"
              style={{
                backgroundColor: trackIsPlaying ? accentColor : "rgba(255, 255, 255, 0.08)",
                color: trackIsPlaying ? "#000000" : "#ffffff",
              }}
            >
              {trackIsPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Title & Creator */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-technical text-xs text-neutral-500 font-semibold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4
                  onClick={handleToggle}
                  className={`truncate text-sm font-semibold cursor-pointer transition-colors ${
                    isCurrent ? "text-white" : "text-neutral-200 group-hover:text-white"
                  }`}
                  style={{
                    color: isCurrent ? accentColor : undefined,
                  }}
                >
                  {track.title}
                </h4>
              </div>
              <p className="text-[11px] text-neutral-400 font-technical truncate">
                {track.creatorName
                  ? `Ajouté par ${track.creatorName}`
                  : track.artist || "Session audio"}
              </p>
            </div>
          </div>

          {/* Right: Monospace Tags & Action Buttons */}
          <div className="flex items-center gap-2 font-technical shrink-0">
            {track.bpm && (
              <span className="hidden sm:inline-block rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-neutral-300">
                {track.bpm} BPM
              </span>
            )}

            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase font-mono text-neutral-300">
              {track.format}
            </span>

            {track.sizeBytes > 0 && (
              <span className="hidden md:inline-block text-[10px] text-neutral-500">
                {formatFileSize(track.sizeBytes)}
              </span>
            )}

            <span className="text-xs text-neutral-400 font-mono pl-1">
              {formatDuration(track.duration)}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-1 pl-1">
              {allowDownload && (
                <a
                  href={track.audioUrl}
                  download={track.title}
                  title="Télécharger la piste"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}

              {onShare && (
                <button
                  onClick={() => onShare(track)}
                  title="Partager cette piste"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              )}

              {canModify && onEdit && (
                <button
                  onClick={() => onEdit(track)}
                  title="Modifier les métadonnées"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}

              {canModify && onDelete && (
                <button
                  onClick={() => onDelete(track)}
                  title="Supprimer la piste"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Waveform Canvas */}
        <div className="pt-1">
          <WaveformCanvas
            waveformData={track.waveformData}
            progress={progress}
            duration={currentDuration}
            isPlaying={trackIsPlaying}
            onSeek={handleSeek}
            accentColor={accentColor}
            height={42}
          />
        </div>
      </div>
    </div>
  );
}
