"use client";

import React, { useRef, useEffect } from "react";
import { usePlayerStore } from "@/lib/player-store";
import { DBTrack } from "@/lib/db";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ListMusic,
  X,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  Music2,
  Disc,
} from "lucide-react";
import { animate } from "animejs";

export function QueueDrawer() {
  const {
    currentTrack,
    currentCoverUrl,
    playlist,
    queue,
    isPlaying,
    accentColor,
    isQueueOpen,
    closeQueue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    playQueueTrack,
    playTrack,
  } = usePlayerStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Smooth Anime.js v4 entrance/exit
  useEffect(() => {
    if (isQueueOpen && drawerRef.current) {
      animate(drawerRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 250,
        ease: "outQuad",
      });
    }
  }, [isQueueOpen]);

  if (!isQueueOpen) return null;

  const formatDuration = (secs?: number | null) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Find remaining tracks from current playlist if any
  const currentIdx = playlist.findIndex((t) => t.id === currentTrack?.id);
  const remainingPlaylistTracks =
    currentIdx !== -1 ? playlist.slice(currentIdx + 1) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-2 sm:p-6 pointer-events-none">
      {/* Semi-transparent backdrop to dismiss */}
      <div
        onClick={closeQueue}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
      />

      {/* Drawer Card */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-md max-h-[85vh] sm:max-h-[75vh] flex flex-col rounded-2xl border border-white/[0.12] bg-studio-950/92 shadow-2xl backdrop-blur-3xl overflow-hidden pointer-events-auto liquid-border"
        style={{
          boxShadow: `0 16px 40px 0 rgba(0, 0, 0, 0.7), 0 0 30px -10px ${accentColor}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <ListMusic className="h-4 w-4" style={{ color: accentColor }} />
            <h3 className="text-sm font-bold text-white tracking-tight">
              File d&apos;attente
            </h3>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-technical text-neutral-400">
              {queue.length + (remainingPlaylistTracks.length > 0 ? remainingPlaylistTracks.length : 0)} à suivre
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-[11px] font-technical text-neutral-400 hover:text-rose-400 transition-colors"
                title="Vider la file manuelle"
              >
                Vider
              </button>
            )}

            <button
              onClick={closeQueue}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Currently playing section */}
          {currentTrack && (
            <div>
              <p className="text-[10px] font-technical uppercase tracking-wider text-neutral-400 mb-2 px-1">
                En cours de lecture
              </p>
              <div
                className="flex items-center justify-between gap-3 rounded-xl border p-2.5 bg-white/[0.06] backdrop-blur-xl"
                style={{
                  borderColor: `${accentColor}60`,
                  boxShadow: `0 0 16px -4px ${accentColor}40`,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/60 border border-white/10"
                    style={{ color: accentColor }}
                  >
                    <Disc className={`h-4 w-4 ${isPlaying ? "animate-spin" : ""}`} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-xs font-bold text-white"
                      style={{ color: accentColor }}
                    >
                      {currentTrack.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate font-technical">
                      {currentTrack.creatorName ? `Par ${currentTrack.creatorName}` : currentTrack.artist || "Session audio"}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-technical text-neutral-400 font-mono">
                  {formatDuration(currentTrack.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Manual Queue Section */}
          {queue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[10px] font-technical uppercase tracking-wider text-neutral-400">
                  File d&apos;attente manuelle ({queue.length})
                </p>
              </div>

              <div className="space-y-1.5">
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}_q_${idx}`}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors"
                  >
                    <div
                      onClick={() => playQueueTrack(idx)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="font-technical text-[10px] text-neutral-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-neutral-200 group-hover:text-white">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate font-technical">
                          {track.creatorName ? `Par ${track.creatorName}` : track.artist || "Piste"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-neutral-500 pr-1">
                        {formatDuration(track.duration)}
                      </span>

                      {/* Move Up */}
                      {idx > 0 && (
                        <button
                          onClick={() => moveQueueItem(idx, idx - 1)}
                          className="h-6 w-6 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-white/10"
                          title="Monter"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                      )}

                      {/* Move Down */}
                      {idx < queue.length - 1 && (
                        <button
                          onClick={() => moveQueueItem(idx, idx + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-white/10"
                          title="Descendre"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      )}

                      {/* Remove */}
                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="h-6 w-6 flex items-center justify-center rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Retirer de la file"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Album/Project Tracks */}
          {remainingPlaylistTracks.length > 0 && (
            <div>
              <p className="text-[10px] font-technical uppercase tracking-wider text-neutral-400 mb-2 px-1">
                À suivre dans cette session ({remainingPlaylistTracks.length})
              </p>

              <div className="space-y-1.5">
                {remainingPlaylistTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, playlist, accentColor)}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] p-2 hover:bg-white/[0.05] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Music2 className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-xs text-neutral-300 group-hover:text-white">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate font-technical">
                          {track.creatorName ? `Par ${track.creatorName}` : track.artist || "Session"}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queue.length === 0 && remainingPlaylistTracks.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500 font-technical">
              Aucune piste à suivre. Ajoutez des pistes à la file depuis vos projets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
