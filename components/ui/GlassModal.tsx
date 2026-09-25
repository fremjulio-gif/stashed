"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { animate, spring } from "animejs";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: GlassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    // Anime.js v4 entrance animation (spring physics)
    if (modalRef.current && overlayRef.current) {
      animate(overlayRef.current, {
        opacity: [0, 1],
        duration: 250,
        ease: "outQuad",
      });

      animate(modalRef.current, {
        opacity: [0, 1],
        scale: [0.94, 1],
        translateY: [16, 0],
        duration: 350,
        ease: spring({ bounce: 0.25, stiffness: 140, damping: 15 }),
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidth} relative overflow-hidden rounded-2xl border border-white/[0.12] bg-studio-900/95 p-6 shadow-2xl backdrop-blur-2xl liquid-border text-white`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs text-neutral-400 font-normal">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
