"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../ui/ThemeToggle";
import { GlassButton } from "../ui/GlassButton";
import { LogOut, Plus, Disc, User } from "lucide-react";

interface DashboardHeaderProps {
  onNewProject: () => void;
  userPseudo?: string;
}

export function DashboardHeader({ onNewProject, userPseudo }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      try {
        localStorage.removeItem("stashed_user");
      } catch {
        // Ignored
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-studio-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Studio Status */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan shadow-[0_0_15px_rgba(0,255,213,0.3)] transition-transform duration-200 group-hover:scale-105">
              <Disc className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                STASHED
                <span className="flex h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_#00ffd5]" />
              </span>
              <p className="text-[10px] font-technical uppercase tracking-wider text-neutral-400">
                Drive Collaboratif {userPseudo ? `• ${userPseudo}` : ""}
              </p>
            </div>
          </Link>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {userPseudo && (
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white font-technical">
              <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
              <span className="font-medium">{userPseudo}</span>
            </div>
          )}

          <ThemeToggle />

          <GlassButton
            variant="primary"
            size="sm"
            onClick={onNewProject}
            className="hidden sm:inline-flex"
          >
            <Plus className="h-4 w-4 mr-1" /> Nouveau Projet
          </GlassButton>

          <GlassButton
            variant="primary"
            size="icon"
            onClick={onNewProject}
            className="sm:hidden"
            title="Nouveau Projet"
          >
            <Plus className="h-4 w-4" />
          </GlassButton>

          <button
            onClick={handleLogout}
            title="Changer de pseudo / Quitter"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
