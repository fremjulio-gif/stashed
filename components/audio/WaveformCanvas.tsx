"use client";

import React, { useRef, useEffect, useState } from "react";

interface WaveformCanvasProps {
  waveformData?: string | null;
  progress: number; // 0 to 1
  onSeek?: (progress: number) => void;
  accentColor?: string;
  height?: number;
  interactive?: boolean;
}

export function WaveformCanvas({
  waveformData,
  progress = 0,
  onSeek,
  accentColor = "#00ffd5",
  height = 48,
  interactive = true,
}: WaveformCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  // Parse or synthesize peaks
  const peaks = React.useMemo(() => {
    if (waveformData) {
      try {
        const parsed = JSON.parse(waveformData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    // Default procedural waveform
    return Array.from({ length: 90 }, (_, i) => {
      const val =
        Math.abs(Math.sin(i * 0.22) * 0.6 + Math.cos(i * 0.45) * 0.3) + 0.12;
      return Math.min(1, Math.max(0.08, val));
    });
  }, [waveformData]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const barWidth = 3;
    const gap = 2;
    const totalBars = Math.floor(rect.width / (barWidth + gap));
    const effectivePeaks =
      peaks.length >= totalBars
        ? peaks.slice(0, totalBars)
        : Array.from({ length: totalBars }, (_, i) => {
            const index = Math.floor((i / totalBars) * peaks.length);
            return peaks[index] || 0.2;
          });

    const currentX = rect.width * progress;

    effectivePeaks.forEach((peak, i) => {
      const x = i * (barWidth + gap);
      const barHeight = Math.max(4, peak * (rect.height - 8));
      const y = (rect.height - barHeight) / 2;

      const isPlayed = x <= currentX;

      if (isPlayed) {
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.shadowBlur = 0;
      }

      // Draw rounded bar
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2]);
      ctx.fill();
    });

    // Draw luminous playhead
    if (progress > 0 && progress < 1) {
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.max(0, currentX - 1), 0, 2, rect.height);
    }
  }, [peaks, progress, accentColor, height]);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const nextProgress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(nextProgress);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverPosition(Math.max(0, Math.min(1, x / rect.width)));
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointer}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverPosition(null)}
      className={`relative w-full overflow-hidden rounded-lg ${
        interactive ? "cursor-pointer" : ""
      }`}
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ height: `${height}px` }}
      />

      {/* Hover preview marker */}
      {interactive && hoverPosition !== null && (
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-white/40 pointer-events-none"
          style={{ left: `${hoverPosition * 100}%` }}
        />
      )}
    </div>
  );
}
