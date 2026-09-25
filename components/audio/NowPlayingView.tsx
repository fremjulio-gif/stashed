"use client";

import React, { useRef, useEffect } from "react";
import { usePlayerStore } from "@/lib/player-store";
import { VinylCover } from "./VinylCover";
import { WaveformCanvas } from "./WaveformCanvas";
import { VUMeter } from "./VUMeter";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  ListMusic,
  Share2,
  Disc3,
  User,
} from "lucide-react";
import { animate } from "animejs";

export function NowPlayingView() {
  const {
    currentTrack,
    currentCoverUrl,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    loop,
    accentColor,
    leftLevel,
    rightLevel,
    isNowPlayingOpen,
    closeNowPlaying,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    toggleLoop,
    playNext,
    playPrevious,
    toggleQueue,
  } = usePlayerStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth entrance / exit animation with Anime.js v4
  useEffect(() => {
    if (isNowPlayingOpen && containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        scale: [0.97, 1],
        translateY: [24, 0],
        duration: 350,
        ease: "outQuad",
      });
    }
  }, [isNowPlayingOpen]);

  // Keyboard shortcut: Escape closes Now Playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isNowPlayingOpen) {
        closeNowPlaying();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNowPlayingOpen, closeNowPlaying]);

  if (!isNowPlayingOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const handleSeek = (ratio: number) => {
    const target = ratio * (duration || currentTrack.duration || 0);
    seekTo(target);
  };

  const skipSeconds = (delta: number) => {
    const newTime = Math.max(0, Math.min(duration || currentTrack.duration, currentTime + delta));
    seekTo(newTime);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-between bg-studio-950/95 backdrop-blur-3xl select-none">
      {/* Dynamic Ambient Background Neon Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-18 blur-[160px] transition-all duration-700"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-30 right-10 w-[500px] h-[500px] rounded-full opacity-12 blur-[140px] transition-all duration-700"
        style={{ backgroundColor: accentColor }}
      />

      <div
        ref={containerRef}
        className="relative z-10 w-full h-full flex flex-col justify-between max-w-4xl mx-auto px-4 py-4 sm:py-6 sm:px-8"
      >
        {/* Top Header: Close Chevron, Now Playing label, Queue button */}
        <header className="flex items-center justify-between">
          <button
            onClick={closeNowPlaying}
            aria-label="Fermer le lecteur étendu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-[10px] font-technical uppercase tracking-widest text-neutral-400">
              En cours de lecture
            </p>
            <span className="flex items-center justify-center gap-1.5 text-xs text-white font-semibold">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              STASHED Master
            </span>
          </div>

          <button
            onClick={toggleQueue}
            aria-label="Ouvrir la file d'attente"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ListMusic className="h-4 w-4" />
          </button>
        </header>

        {/* Center: Large Spinning Vinyl Record Artwork */}
        <main className="my-auto flex flex-col items-center justify-center py-4">
          <div className="relative flex items-center justify-center">
            {/* Spinning Vinyl Record */}
            <VinylCover
              coverUrl={currentCoverUrl}
              title={currentTrack.title}
              isPlaying={isPlaying}
              accentColor={accentColor}
              size="lg"
            />
          </div>

          {/* Track Info & Creator Badge */}
          <div className="mt-8 text-center max-w-lg w-full px-4">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {currentTrack.title}
            </h2>

            <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-neutral-400 font-technical">
              <span className="flex items-center gap-1 text-neutral-300">
                <User className="h-3.5 w-3.5 text-neutral-500" />
                {currentTrack.creatorName
                  ? `Ajouté par ${currentTrack.creatorName}`
                  : currentTrack.artist || "Session audio"}
              </span>
              <span>•</span>
              <span className="uppercase text-neutral-400 font-mono text-[10px] rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.2">
                {currentTrack.format.toUpperCase()}
              </span>
              {currentTrack.bpm && (
                <>
                  <span>•</span>
                  <span className="text-neutral-400">{currentTrack.bpm} BPM</span>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Bottom Section: Detailed Waveform + Transport Controls */}
        <footer className="space-y-4 pt-2">
          {/* Detailed Waveform Canvas */}
          <div className="space-y-1.5">
            <div className="rounded-xl border border-white/10 bg-black/40 p-2 sm:p-3 backdrop-blur-xl shadow-inner">
              <WaveformCanvas
                waveformData={currentTrack.waveformData}
                progress={progress}
                duration={duration || currentTrack.duration}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                accentColor={accentColor}
                height={54}
                interactive={true}
              />
            </div>

            {/* Time stamps */}
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || currentTrack.duration)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Controls: Repeat */}
            <div className="w-24 flex items-center justify-start">
              <button
                onClick={toggleLoop}
                aria-label="Répéter en boucle"
                title={loop ? "Répétition activée" : "Répétition désactivée"}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 transition-colors ${
                  loop
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white"
                }`}
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>

            {/* Center Transport Buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Skip back 10s */}
              <button
                onClick={() => skipSeconds(-10)}
                aria-label="Reculer de 10s"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="-10s"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Previous */}
              <button
                onClick={playPrevious}
                aria-label="Piste précédente"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              {/* Play / Pause Giant Button */}
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Lecture"}
                className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full text-black shadow-2xl transition-transform active:scale-95"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 35px -4px ${accentColor}80`,
                }}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
                ) : (
                  <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-1" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                aria-label="Piste suivante"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              {/* Skip forward 10s */}
              <button
                onClick={() => skipSeconds(10)}
                aria-label="Avancer de 10s"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="+10s"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Volume & VU Meter */}
            <div className="w-24 flex items-center justify-end gap-2">
              <VUMeter
                leftLevel={leftLevel}
                rightLevel={rightLevel}
                isPlaying={isPlaying}
                accentColor={accentColor}
              />

              <button
                onClick={toggleMute}
                aria-label="Mute"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
