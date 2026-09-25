"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface WaveformCanvasProps {
  waveformData?: string | null;
  progress: number; // 0 to 1
  duration?: number; // In seconds
  isPlaying?: boolean;
  onSeek?: (progress: number) => void;
  accentColor?: string;
  height?: number;
  interactive?: boolean;
  compact?: boolean;
  barWidth?: number;
  barGap?: number;
}

export function WaveformCanvas({
  waveformData,
  progress = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
  accentColor = "#00ffd5",
  height = 44,
  interactive = true,
  compact = false,
  barWidth = 3,
  barGap = 2,
}: WaveformCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Parse or synthesize peaks (60 to 120 bars depending on resolution)
  const rawPeaks = useMemo(() => {
    if (waveformData) {
      try {
        const parsed = JSON.parse(waveformData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((v) => Number(v) || 0.1);
        }
      } catch {
        // Fallback below
      }
    }
    // Procedural default waveform for preview
    return Array.from({ length: 96 }, (_, i) => {
      const val =
        Math.abs(Math.sin(i * 0.18) * 0.65 + Math.cos(i * 0.42) * 0.28) + 0.1;
      return Math.min(1, Math.max(0.08, val));
    });
  }, [waveformData]);

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Draw waveform with DAW styling and optional micro-pulse
  const renderCanvas = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const effectiveBarWidth = compact ? 2 : barWidth;
      const effectiveGap = compact ? 1.5 : barGap;
      const step = effectiveBarWidth + effectiveGap;
      const totalBars = Math.floor((rect.width + effectiveGap) / step);

      if (totalBars <= 0) {
        ctx.restore();
        return;
      }

      // Sample or interpolate peaks to fit canvas width
      const sampledPeaks: number[] = [];
      for (let i = 0; i < totalBars; i++) {
        const sampleIndex = Math.min(
          rawPeaks.length - 1,
          Math.floor((i / totalBars) * rawPeaks.length)
        );
        sampledPeaks.push(rawPeaks[sampleIndex] || 0.1);
      }

      const currentX = rect.width * Math.max(0, Math.min(1, progress));
      const radius = effectiveBarWidth / 2;

      // Create vertical gradients for played and unplayed states
      const playedGradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      playedGradient.addColorStop(0, "#ffffff");
      playedGradient.addColorStop(0.3, accentColor);
      playedGradient.addColorStop(1, `${accentColor}dd`);

      const unplayedGradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      unplayedGradient.addColorStop(0, "rgba(255, 255, 255, 0.32)");
      unplayedGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.16)");
      unplayedGradient.addColorStop(1, "rgba(255, 255, 255, 0.08)");

      for (let i = 0; i < totalBars; i++) {
        const x = i * step;
        let peakVal = sampledPeaks[i];

        const isPlayed = x <= currentX;

        // Subtle micro-pulse animation during playback for played bars & immediate active zone
        if (isPlaying && isPlayed) {
          const wavePhase = (timestamp * 0.005) - (i * 0.15);
          const microPulse = Math.sin(wavePhase) * 0.08;
          peakVal = Math.min(1, Math.max(0.06, peakVal * (1 + microPulse)));
        }

        const maxAvailableHeight = rect.height - 4;
        const barHeight = Math.max(3, peakVal * maxAvailableHeight);
        const y = (rect.height - barHeight) / 2;

        ctx.fillStyle = isPlayed ? playedGradient : unplayedGradient;

        // Subtle glow on active peak bars
        if (isPlayed && peakVal > 0.45 && !compact) {
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw rounded rectangle
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, effectiveBarWidth, barHeight, [radius]);
        } else {
          ctx.rect(x, y, effectiveBarWidth, barHeight);
        }
        ctx.fill();
      }

      // Draw subtle luminous playhead marker
      if (progress > 0 && progress < 1) {
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = compact ? 6 : 10;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.max(0, currentX - 0.75), 0, compact ? 1.5 : 2, rect.height);
      }

      ctx.restore();
    },
    [rawPeaks, progress, isPlaying, accentColor, compact, barWidth, barGap]
  );

  // Animation loop when playing
  useEffect(() => {
    let active = true;

    const loop = (ts: number) => {
      if (!active) return;
      renderCanvas(ts);
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      renderCanvas(performance.now());
    }

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, renderCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => renderCanvas(performance.now());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderCanvas]);

  // Pointer & Drag seeking
  const handleSeekFromClientX = useCallback(
    (clientX: number) => {
      if (!interactive || !onSeek || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const nextProgress = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek(nextProgress);
    },
    [interactive, onSeek]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    handleSeekFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(1, x / rect.width));
    setHoverPosition(pos);

    if (isDragging) {
      handleSeekFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      setIsDragging(false);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
    }
  };

  const hoverTimeSecs = hoverPosition !== null ? hoverPosition * (duration || 0) : null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full select-none touch-none ${
        interactive ? "cursor-pointer group" : ""
      }`}
      style={{ height: `${height}px` }}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label="Progression audio"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ height: `${height}px` }}
      />

      {/* Hover preview marker & tooltip */}
      {interactive && hoverPosition !== null && (
        <>
          {/* Vertical indicator line */}
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-white/50 pointer-events-none z-10"
            style={{ left: `${hoverPosition * 100}%` }}
          />

          {/* Floating Timestamp Tooltip */}
          {duration > 0 && (
            <div
              className="absolute -top-7 -translate-x-1/2 pointer-events-none z-20 whitespace-nowrap rounded-md border border-white/20 bg-studio-950/90 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-white shadow-xl backdrop-blur-md"
              style={{
                left: `${Math.min(94, Math.max(6, hoverPosition * 100))}%`,
              }}
            >
              {formatTime(hoverTimeSecs || 0)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
