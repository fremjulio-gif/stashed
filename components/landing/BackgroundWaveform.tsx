"use client";

import React, { useEffect, useRef } from "react";

export function BackgroundWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    const render = () => {
      t += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Subtle DAW waveform bars across horizontal horizon
      const barWidth = 3;
      const barGap = 3;
      const totalBars = Math.floor(width / (barWidth + barGap));
      const centerY = height * 0.52;

      for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + barGap);
        const normX = i / totalBars;

        // Wave formula simulating complex audio spectrum
        const wave1 = Math.sin(normX * 12 + t * 0.8) * 0.4;
        const wave2 = Math.cos(normX * 24 - t * 1.2) * 0.25;
        const wave3 = Math.sin(normX * 6 + t * 0.4) * 0.35;
        const bellCurve = Math.exp(-Math.pow((normX - 0.5) * 2.8, 2));

        const amplitude = Math.max(0.04, (Math.abs(wave1 + wave2 + wave3) + 0.05) * bellCurve);
        const barHeight = amplitude * (height * 0.38);

        const y = centerY - barHeight / 2;

        const alpha = Math.min(0.22, Math.max(0.03, amplitude * 0.35));
        ctx.fillStyle = `rgba(0, 255, 213, ${alpha})`;

        ctx.fillRect(x, y, barWidth, Math.max(2, barHeight));
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60 mix-blend-screen"
    />
  );
}
