"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/lib/player-store";
import { VUMeter } from "./VUMeter";
import { WaveformCanvas } from "./WaveformCanvas";
import { VinylCover } from "./VinylCover";
import { NowPlayingView } from "./NowPlayingView";
import { QueueDrawer } from "./QueueDrawer";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
} from "lucide-react";

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    currentCoverUrl,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    loop,
    accentColor,
    leftLevel,
    rightLevel,
    togglePlay,
    pause,
    resume,
    seekTo,
    setVolume,
    toggleMute,
    toggleLoop,
    playNext,
    playPrevious,
    setCurrentTime,
    setDuration,
    setLevels,
    openNowPlaying,
    toggleQueue,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Audio Context on first user interaction
  const initAudioContext = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // Browser might restrict CORS or context creation; fallback gracefully
    }
  };

  // Sync play/pause with HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio playback delayed or blocked:", err);
          pause();
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  // Sync track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    initAudioContext();
    audio.src = currentTrack.audioUrl;
    audio.load();

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(console.warn);
      }
    }
  }, [currentTrack]);

  // Sync volume & mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Sync loop
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.loop = loop;
  }, [loop]);

  // Real-time Audio Visualizer Loop for VU-Meter
  useEffect(() => {
    const updateMeter = () => {
      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sumLeft = 0;
        let sumRight = 0;
        const half = Math.floor(bufferLength / 2);

        for (let i = 0; i < half; i++) {
          sumLeft += dataArray[i];
        }
        for (let i = half; i < bufferLength; i++) {
          sumRight += dataArray[i];
        }

        const left = Math.min(1, (sumLeft / (half * 255)) * 1.6);
        const right = Math.min(1, (sumRight / (half * 255)) * 1.55);

        setLevels(left, right);
      } else if (isPlaying) {
        // Fallback procedural visualizer if CORS restricts Web Audio
        const t = Date.now() * 0.008;
        const left = 0.3 + 0.5 * Math.abs(Math.sin(t));
        const right = 0.28 + 0.52 * Math.abs(Math.cos(t * 1.1));
        setLevels(left, right);
      } else {
        setLevels(0, 0);
      }
      animFrameRef.current = requestAnimationFrame(updateMeter);
    };

    animFrameRef.current = requestAnimationFrame(updateMeter);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, setLevels]);

  // Global Keyboard Shortcuts (Space, Left, Right, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (audioRef.current) {
          const newTime = Math.max(0, audioRef.current.currentTime - 5);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (audioRef.current) {
          const newTime = Math.min(duration, audioRef.current.currentTime + 5);
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      } else if (e.code === "KeyM") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, duration, setCurrentTime]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00.0";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  const handleSeekProgress = (prog: number) => {
    const targetTime = prog * (duration || currentTrack?.duration || 0);
    setCurrentTime(targetTime);
    seekTo(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  return (
    <>
      {/* Hidden audio element with CORS allowed */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || currentTrack.duration);
          }
        }}
        onEnded={() => {
          playNext();
        }}
      />

      {/* Persistent Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 select-none pointer-events-none">
        <div className="mx-auto max-w-7xl pointer-events-auto">
          <div className="glass-panel liquid-border rounded-2xl border border-white/[0.14] bg-studio-950/90 p-3 sm:px-6 sm:py-3.5 shadow-2xl backdrop-blur-3xl transition-all">
            {/* Top Compact Waveform Scrubber */}
            <div className="relative -mt-1.5 mb-2.5 w-full">
              <WaveformCanvas
                waveformData={currentTrack.waveformData}
                progress={duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0}
                duration={duration || currentTrack.duration}
                isPlaying={isPlaying}
                onSeek={handleSeekProgress}
                accentColor={accentColor}
                height={26}
                compact={true}
                interactive={true}
              />
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-6">
              {/* Left: Vinyl Cover & Track Info */}
              <div className="flex items-center gap-3.5 min-w-0 max-w-[45%] sm:max-w-xs md:max-w-sm">
                {/* Vinyl Record Artwork with continuous slow rotation */}
                <VinylCover
                  coverUrl={currentCoverUrl}
                  title={currentTrack.title}
                  isPlaying={isPlaying}
                  accentColor={accentColor}
                  size="sm"
                  onClick={openNowPlaying}
                />

                {/* Track Info (clickable to open Now Playing) */}
                <div
                  onClick={openNowPlaying}
                  className="min-w-0 cursor-pointer group/info"
                  title="Agrandir le lecteur (Now Playing)"
                >
                  <h4 className="truncate text-xs sm:text-sm font-semibold text-white tracking-tight group-hover/info:text-accent-cyan transition-colors">
                    {currentTrack.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-technical">
                    <span className="truncate">
                      {currentTrack.creatorName
                        ? `Par ${currentTrack.creatorName}`
                        : currentTrack.artist || "Session audio"}
                    </span>
                    <span>•</span>
                    <span className="uppercase text-neutral-300 font-mono px-1 py-0.2 rounded bg-white/[0.08] text-[9px]">
                      {currentTrack.format.toUpperCase()}
                    </span>
                    {currentTrack.bpm && (
                      <span className="hidden md:inline text-neutral-400">
                        {currentTrack.bpm} BPM
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center: Minimalist Transport Controls */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={playPrevious}
                    aria-label="Piste précédente"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Mettre en pause" : "Lire"}
                    className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-black shadow-lg transition-transform active:scale-95"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 22px -2px ${accentColor}75`,
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    aria-label="Piste suivante"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>

                  <button
                    onClick={toggleLoop}
                    aria-label="Boucle"
                    title={loop ? "Boucle activée" : "Boucle désactivée"}
                    className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      loop
                        ? "text-white bg-white/[0.15] border border-white/20"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Technical Readout, VU-Meter, Volume, Queue & Expand */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Time Display */}
                <div className="hidden lg:flex flex-col text-right font-technical text-[11px] leading-tight text-neutral-300">
                  <span className="font-semibold text-white">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[9px] text-neutral-500">
                    / {formatTime(duration)}
                  </span>
                </div>

                {/* Studio VU Meter */}
                <div className="hidden sm:block">
                  <VUMeter
                    leftLevel={leftLevel}
                    rightLevel={rightLevel}
                    isPlaying={isPlaying}
                    accentColor={accentColor}
                  />
                </div>

                {/* Volume Slider & Mute */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    aria-label="Couper le son"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-rose-400" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    aria-label="Volume"
                    className="h-1 w-16 lg:w-20 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Queue Button with Badge */}
                <button
                  onClick={toggleQueue}
                  aria-label="File d'attente"
                  title="File d'attente"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <ListMusic className="h-4 w-4" />
                  {queue.length > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-black font-mono shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {queue.length}
                    </span>
                  )}
                </button>

                {/* Now Playing Expand Button */}
                <button
                  onClick={openNowPlaying}
                  aria-label="Agrandir le lecteur"
                  title="Agrandir (Vue Now Playing)"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extended "Now Playing" Modal */}
      <NowPlayingView />

      {/* Playlist / Queue Drawer */}
      <QueueDrawer />
    </>
  );
}
