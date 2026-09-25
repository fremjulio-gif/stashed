import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  accentColor?: string;
  glow?: boolean;
}

export function GlassButton({
  children,
  className,
  variant = "secondary",
  size = "md",
  accentColor,
  glow = false,
  style,
  disabled,
  ...props
}: GlassButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50";

  const sizeStyles = {
    sm: "h-9 px-3 text-xs gap-1.5 min-w-[36px]",
    md: "h-11 px-4 text-sm gap-2 min-w-[44px]",
    lg: "h-13 px-6 text-base gap-2.5 min-w-[48px]",
    icon: "h-11 w-11 p-0 flex items-center justify-center",
  };

  const variantStyles = {
    primary:
      "bg-white text-black font-semibold hover:bg-neutral-200 border border-white/40 shadow-sm",
    secondary:
      "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.1] active:bg-white/[0.04]",
    danger:
      "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30",
    ghost:
      "bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]",
  };

  const customStyle: React.CSSProperties = { ...style };
  if (accentColor && variant === "primary") {
    customStyle.backgroundColor = accentColor;
    customStyle.color = "#000000";
    if (glow) {
      customStyle.boxShadow = `0 0 20px -3px ${accentColor}80`;
    }
  }

  return (
    <button
      className={twMerge(
        clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)
      )}
      style={customStyle}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
