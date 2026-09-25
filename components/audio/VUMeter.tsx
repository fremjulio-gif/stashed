"use client";

import React from "react";

interface VUMeterProps {
  leftLevel: number; // 0 to 1
  rightLevel: number; // 0 to 1
  isPlaying: boolean;
  accentColor?: string;
}

export function VUMeter({
  leftLevel,
  rightLevel,
  isPlaying,
  accentColor = "#00ffd5",
}: VUMeterProps) {
  // 12 LED segments per channel
  const SEGMENTS = 12;

  const renderChannel = (level: number) => {
    const activeSegments = isPlaying ? Math.round(level * SEGMENTS) : 0;

    return (
      <div className="flex h-3 items-center gap-[2px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isActive = i < activeSegments;
          // Colors: 0-7: green/accent, 8-9: amber, 10-11: red (clip)
          let colorClass = "bg-neutral-800";
          let activeClass = "";

          if (i < 8) {
            activeClass = "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]";
          } else if (i < 10) {
            activeClass = "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]";
          } else {
            activeClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]";
          }

          return (
            <div
              key={i}
              className={`h-full w-[3px] rounded-[1px] transition-colors duration-75 ${
                isActive ? activeClass : colorClass
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="hidden sm:flex flex-col gap-1 rounded-lg border border-white/[0.08] bg-black/40 px-2 py-1.5 font-technical text-[9px] text-neutral-400 select-none">
      <div className="flex items-center justify-between gap-1.5">
        <span className="w-2.5 font-bold text-neutral-400">L</span>
        {renderChannel(leftLevel)}
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <span className="w-2.5 font-bold text-neutral-400">R</span>
        {renderChannel(rightLevel)}
      </div>
    </div>
  );
}
