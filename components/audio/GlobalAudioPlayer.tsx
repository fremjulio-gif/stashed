"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/lib/player-store";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Disc3,
  Sliders,
} from "lucide-react";
import { VUMeter } from "./VUMeter";

export function GlobalAudioPlayer() {
  const {
    currentTrack,
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
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  // Initialize Web Audio Context on first interaction
  const initAudioContext = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

        // Calculate left & right RMS approximations
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
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
          <div className="glass-panel liquid-border rounded-2xl border border-white/[0.12] bg-studio-950/85 p-3 sm:px-6 sm:py-3.5 shadow-2xl backdrop-blur-2xl">
            {/* Top Scrubber Slider */}
            <div className="relative -mt-1.5 mb-2.5 flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Position audio"
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white hover:h-2 transition-all"
                style={{
                  accentColor: accentColor,
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-6">
              {/* Left: Track Info & Format Badge */}
              <div className="flex items-center gap-3 min-w-0 max-w-[45%] sm:max-w-xs">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300"
                  style={{
                    boxShadow: isPlaying ? `0 0 16px -2px ${accentColor}40` : "none",
                  }}
                >
                  <Disc3
                    className={`h-5 w-5 ${
                      isPlaying ? "animate-spin text-white" : "text-neutral-500"
                    }`}
                    style={{
                      animationDuration: "4s",
                      color: isPlaying ? accentColor : undefined,
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="truncate text-xs sm:text-sm font-semibold text-white tracking-tight">
                    {currentTrack.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-technical">
                    <span className="truncate">{currentTrack.artist || "jlowav"}</span>
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

              {/* Center: DAW Transport Controls */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={playPrevious}
                    aria-label="Piste précédente"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Mettre en pause" : "Lire"}
                    className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-black shadow-lg transition-transform active:scale-95"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 20px -2px ${accentColor}70`,
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>

                  <button
                    onClick={toggleLoop}
                    aria-label="Boucle"
                    title={loop ? "Boucle activée" : "Boucle désactivée"}
                    className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      loop
                        ? "text-white bg-white/[0.12]"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Technical Readout, VU-Meter & Volume */}
              <div className="flex items-center gap-3 sm:gap-5">
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
                <VUMeter
                  leftLevel={leftLevel}
                  rightLevel={rightLevel}
                  isPlaying={isPlaying}
                  accentColor={accentColor}
                />

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
