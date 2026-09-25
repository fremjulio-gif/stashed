"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../ui/ThemeToggle";
import { GlassButton } from "../ui/GlassButton";
import { LogOut, Plus, Radio, Disc } from "lucide-react";

interface DashboardHeaderProps {
  onNewProject: () => void;
}

export function DashboardHeader({ onNewProject }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-studio-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand & Owner Badge */}
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
                jlowav • Sound Vault
              </p>
            </div>
          </Link>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
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
            title="Déconnexion"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
