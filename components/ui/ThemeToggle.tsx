"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const isStoredLight = localStorage.getItem("stashed_theme") === "light";
    setIsLight(isStoredLight);
    if (isStoredLight) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("stashed_theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("stashed_theme", "dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? "Activer le mode sombre DAW" : "Activer le mode clair"}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
