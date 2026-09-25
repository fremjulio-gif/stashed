"use client";

import React from "react";
import { Disc3, Music2 } from "lucide-react";

interface VinylCoverProps {
  coverUrl?: string | null;
  title?: string;
  isPlaying?: boolean;
  accentColor?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function VinylCover({
  coverUrl,
  title = "Audio",
  isPlaying = false,
  accentColor = "#00ffd5",
  size = "sm",
  onClick,
  className = "",
}: VinylCoverProps) {
  const sizeClasses = {
    sm: "w-13 h-13 sm:w-14 sm:h-14",
    md: "w-20 h-20 sm:w-24 sm:h-24",
    lg: "w-64 h-64 sm:w-76 sm:h-76 md:w-84 md:h-84",
  };

  const centerSizes = {
    sm: "w-6 h-6 sm:w-7 sm:h-7",
    md: "w-10 h-10 sm:w-12 sm:h-12",
    lg: "w-32 h-32 sm:w-38 sm:h-38 md:w-42 md:h-42",
  };

  const spindleSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-4 h-4",
  };

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 select-none ${onClick ? "cursor-pointer group" : ""} ${className}`}
      title={onClick ? "Agrandir le lecteur (Now Playing)" : undefined}
    >
      {/* Vinyl Disc Outer Shell */}
      <div
        className={`relative rounded-full bg-neutral-950 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 ${
          onClick ? "group-hover:scale-[1.03]" : ""
        } ${sizeClasses[size]}`}
        style={{
          boxShadow: isPlaying
            ? `0 0 25px -4px ${accentColor}40, 0 8px 24px rgba(0,0,0,0.8)`
            : "0 8px 24px rgba(0,0,0,0.6)",
        }}
      >
        {/* Animated Spinning Layer */}
        <div
          className={`absolute inset-0 w-full h-full rounded-full flex items-center justify-center animate-vinyl ${
            isPlaying ? "animate-vinyl-running" : "animate-vinyl-paused"
          }`}
        >
          {/* Subtle concentric grooves */}
          <div className="absolute inset-0 w-full h-full rounded-full vinyl-grooves opacity-60 pointer-events-none" />

          {/* Vinyl light sheen gradient */}
          <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-tr from-white/[0.04] via-transparent to-white/[0.06] pointer-events-none" />

          {/* Center Label (Cover Artwork) */}
          <div
            className={`relative rounded-full overflow-hidden border-2 border-white/20 shadow-inner flex items-center justify-center bg-black/80 ${centerSizes[size]}`}
          >
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/[0.06] text-neutral-400">
                <Disc3 className="w-1/2 h-1/2" style={{ color: accentColor }} />
              </div>
            )}

            {/* Center Spindle Hole */}
            <div
              className={`absolute rounded-full bg-studio-950 border border-white/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ${spindleSizes[size]}`}
            />
          </div>
        </div>

        {/* Delicate Outer Edge Highlight */}
        <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
      </div>
    </div>
  );
}
