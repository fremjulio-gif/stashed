import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  isHoverable?: boolean;
}

export function GlassCard({
  children,
  className,
  glowColor,
  isHoverable = false,
  style,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "relative overflow-hidden rounded-2xl border bg-studio-900/60 p-5 backdrop-blur-xl",
          "border-white/[0.08] shadow-glass",
          "liquid-border",
          isHoverable && "hover:border-white/[0.18] hover:bg-studio-900/80 transition-colors duration-200",
          className
        )
      )}
      style={{
        ...style,
        ...(glowColor
          ? {
              boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 30px -10px ${glowColor}25`,
            }
          : {}),
      }}
      {...props}
    >
      {children}
    </div>
  );
}
