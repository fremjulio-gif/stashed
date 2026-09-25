"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { DBProject, DBTrack } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ProjectModal } from "@/components/dashboard/ProjectModal";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { MetadataModal } from "@/components/dashboard/MetadataModal";
import { AudioUploader } from "@/components/dashboard/AudioUploader";
import { WaveformTrackItem } from "@/components/audio/WaveformTrackItem";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  FolderPlus,
  Users,
  Music,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  Globe,
} from "lucide-react";
import { animate, stagger } from "animejs";

export default function DashboardPage() {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [rootTracks, setRootTracks] = useState<DBTrack[]>([]);
  const [currentUser, setCurrentUser] = useState<{ pseudo: string; visitorId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [filterScope, setFilterScope] = useState<"all" | "mine">("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "title" | "tracks">("recent");

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DBProject | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingProject, setSharingProject] = useState<DBProject | null>(null);
  const [sharingTrack, setSharingTrack] = useState<DBTrack | null>(null);

  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<DBTrack | null>(null);

  const projectsGridRef = useRef<HTMLDivElement>(null);

  // Fetch current visitor session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stashed_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }

    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          try {
            localStorage.setItem("stashed_user", JSON.stringify(data.user));
          } catch {
            // Ignored
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, trackRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tracks"),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData);
      }
      if (trackRes.ok) {
        const tData: DBTrack[] = await trackRes.json();
        setRootTracks(tData.filter((t) => !t.projectId));
      }
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Anime.js v4 staggered entrance for project cards
  useEffect(() => {
    if (!loading && projectsGridRef.current) {
      const cards = projectsGridRef.current.querySelectorAll(".project-card-item");
      if (cards.length > 0) {
        animate(cards, {
          opacity: [0, 1],
          translateY: [16, 0],
          delay: stagger(40, { from: "first" }),
          ease: "outQuad",
          duration: 350,
        });
      }
    }
  }, [loading, filterScope, selectedCreator, searchQuery, sortBy]);

  // Permission check: trust-based pseudo or visitorId match
  const canEditResource = (creatorId?: string | null, creatorName?: string | null) => {
    if (!currentUser) return false;
    if (creatorId && currentUser.visitorId && creatorId === currentUser.visitorId) return true;
    if (
      creatorName &&
      currentUser.pseudo &&
      creatorName.trim().toLowerCase() === currentUser.pseudo.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  const handleDeleteProject = async (proj: DBProject) => {
    if (!canEditResource(proj.creatorId, proj.creatorName)) {
      alert("Vous ne pouvez supprimer que les projets que vous avez créés.");
      return;
    }

    if (!confirm(`Supprimer définitivement le projet "${proj.title}" et ses pistes ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${proj.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (e) {
      console.error("Error deleting project:", e);
    }
  };

  const handleDeleteTrack = async (track: DBTrack) => {
    if (!canEditResource(track.creatorId, track.creatorName)) {
      alert("Vous ne pouvez supprimer que les pistes que vous avez ajoutées.");
      return;
    }

    if (!confirm(`Supprimer définitivement la piste "${track.title}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (e) {
      console.error("Error deleting track:", e);
    }
  };

  // Extract distinct creators
  const distinctCreators = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.creatorName) set.add(p.creatorName);
    });
    rootTracks.forEach((t) => {
      if (t.creatorName) set.add(t.creatorName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects, rootTracks]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // 1. Scope filter (mine vs all)
        if (filterScope === "mine") {
          if (!canEditResource(p.creatorId, p.creatorName)) return false;
        }

        // 2. Creator dropdown filter
        if (selectedCreator !== "all") {
          if (
            (p.creatorName || "").trim().toLowerCase() !==
            selectedCreator.trim().toLowerCase()
          ) {
            return false;
          }
        }

        // 3. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (p.title || "").toLowerCase().includes(q);
          const matchCreator = (p.creatorName || "").toLowerCase().includes(q);
          const matchDesc = (p.description || "").toLowerCase().includes(q);
          if (!matchTitle && !matchCreator && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "tracks") {
          return (b.tracks?.length || 0) - (a.tracks?.length || 0);
        }
        return 0;
      });
  }, [projects, filterScope, selectedCreator, searchQuery, sortBy, currentUser]);

  // Filtered root tracks
  const filteredRootTracks = useMemo(() => {
    return rootTracks.filter((t) => {
      if (filterScope === "mine") {
        if (!canEditResource(t.creatorId, t.creatorName)) return false;
      }

      if (selectedCreator !== "all") {
        if (
          (t.creatorName || "").trim().toLowerCase() !==
          selectedCreator.trim().toLowerCase()
        ) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchCreator = (t.creatorName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCreator) return false;
      }

      return true;
    });
  }, [rootTracks, filterScope, selectedCreator, searchQuery, currentUser]);

  // Count user's own projects
  const myProjectsCount = useMemo(() => {
    return projects.filter((p) => canEditResource(p.creatorId, p.creatorName)).length;
  }, [projects, currentUser]);

  // Stats calculation
  const totalTracks =
    projects.reduce((sum, p) => sum + (p.tracks?.length || 0), 0) +
    rootTracks.length;

  return (
    <div className="min-h-screen bg-daw-grid pb-32">
      <DashboardHeader
        userPseudo={currentUser?.pseudo}
        onNewProject={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Collaborative Server Stats Ribbon */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 font-technical">
          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Projets Partagés
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {projects.length}
              </span>
              <span className="text-xs text-neutral-500">dossiers</span>
            </div>
          </GlassCard>

          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Pistes Audio
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {totalTracks}
              </span>
              <span className="text-xs text-neutral-500">stems & mixes</span>
            </div>
          </GlassCard>

          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Créateurs Actifs
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-accent-cyan">
                {Math.max(1, distinctCreators.length)}
              </span>
              <span className="text-xs text-neutral-500">producteurs</span>
            </div>
          </GlassCard>

          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Format Audio
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                WAV 24-bit / MP3
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Collaborative Filter & Search Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Scope Segmented Control */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
            <button
              onClick={() => setFilterScope("all")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-technical transition-all ${
                filterScope === "all"
                  ? "bg-white/15 text-white shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Tous les projets</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setFilterScope("mine")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-technical transition-all ${
                filterScope === "mine"
                  ? "bg-accent-cyan/20 text-accent-cyan shadow-sm font-semibold border border-accent-cyan/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Mes projets</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
                {myProjectsCount}
              </span>
            </button>
          </div>

          {/* Search, Creator Filter & Sort */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher titre, créateur..."
                className="w-full rounded-xl border border-white/10 bg-black/40 py-1.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-white/30"
              />
            </div>

            {/* Creator Filter Dropdown */}
            {distinctCreators.length > 1 && (
              <div className="relative">
                <select
                  value={selectedCreator}
                  onChange={(e) => setSelectedCreator(e.target.value)}
                  aria-label="Filtrer par créateur"
                  className="rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-technical text-neutral-300 outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="all">Tous les créateurs</option>
                  {distinctCreators.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "recent" | "oldest" | "title" | "tracks")
                }
                aria-label="Trier les projets"
                className="rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-technical text-neutral-300 outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="recent">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="title">Titre A-Z</option>
                <option value="tracks">Nombre de pistes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Projects Grid */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {filterScope === "mine" ? "Mes Projets" : "Bibliothèque Commune"}
              </h2>
              <p className="text-xs text-neutral-400">
                {filterScope === "mine"
                  ? "Projets que vous avez créés avec votre pseudo."
                  : "Explorez les sessions et projets partagés par tous les créateurs."}
              </p>
            </div>

            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
            >
              <FolderPlus className="h-4 w-4 mr-1.5" /> Créer un projet
            </GlassButton>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-500 font-technical">
              Chargement des projets...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-studio-900/30 p-12 text-center backdrop-blur-xl">
              <FolderPlus className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="text-sm font-semibold text-white">
                {filterScope === "mine"
                  ? "Vous n'avez pas encore créé de projet"
                  : "Aucun projet ne correspond à vos filtres"}
              </h3>
              <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto">
                {filterScope === "mine"
                  ? "Créez votre propre projet pour y déposer vos pistes .wav / .mp3 et générer un lien d'écoute."
                  : "Modifiez vos filtres ou créez le premier projet."}
              </p>
              <div className="mt-4">
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  Créer un projet
                </GlassButton>
              </div>
            </div>
          ) : (
            <div
              ref={projectsGridRef}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredProjects.map((proj) => (
                <div key={proj.id} className="project-card-item">
                  <ProjectCard
                    project={proj}
                    canEdit={canEditResource(proj.creatorId, proj.creatorName)}
                    onEdit={(p) => {
                      setEditingProject(p);
                      setIsProjectModalOpen(true);
                    }}
                    onDelete={handleDeleteProject}
                    onShare={(p) => {
                      setSharingProject(p);
                      setSharingTrack(null);
                      setIsShareModalOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Quick Drop / Root Audio Dropzone */}
        <div className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Dépôt Rapide & Pistes Partagées
            </h2>
            <p className="text-xs text-neutral-400">
              Glissez des fichiers audio à la racine pour les partager instantanément avec l&apos;ensemble du serveur.
            </p>
          </div>

          <AudioUploader onUploadComplete={fetchData} />

          {/* Root tracks list */}
          {filteredRootTracks.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-technical mb-2">
                Pistes hors-projet ({filteredRootTracks.length})
              </h3>
              {filteredRootTracks.map((track, i) => (
                <WaveformTrackItem
                  key={track.id}
                  track={track}
                  index={i}
                  playlist={filteredRootTracks}
                  canEdit={canEditResource(track.creatorId, track.creatorName)}
                  onEdit={(t) => {
                    setEditingTrack(t);
                    setIsMetadataModalOpen(true);
                  }}
                  onDelete={handleDeleteTrack}
                  onShare={(t) => {
                    setSharingTrack(t);
                    setSharingProject(null);
                    setIsShareModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={editingProject}
        onSaved={fetchData}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={sharingProject}
        track={sharingTrack}
      />

      <MetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        track={editingTrack}
        onSaved={fetchData}
      />
    </div>
  );
}
