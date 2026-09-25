"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Radio,
  HardDrive,
  Music,
  Headphones,
  Sliders,
  Sparkles,
} from "lucide-react";
import { animate, stagger } from "animejs";

export default function DashboardPage() {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [rootTracks, setRootTracks] = useState<DBTrack[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DBProject | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingProject, setSharingProject] = useState<DBProject | null>(null);
  const [sharingTrack, setSharingTrack] = useState<DBTrack | null>(null);

  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<DBTrack | null>(null);

  const projectsGridRef = useRef<HTMLDivElement>(null);

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
        // Root tracks are tracks with no projectId
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
          delay: stagger(60, { from: "first" }),
          ease: "outQuad",
          duration: 400,
        });
      }
    }
  }, [loading, projects]);

  const handleDeleteProject = async (proj: DBProject) => {
    if (!confirm(`Supprimer définitivement le projet "${proj.title}" et ses pistes ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${proj.id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Error deleting project:", e);
    }
  };

  const handleDeleteTrack = async (track: DBTrack) => {
    if (!confirm(`Supprimer définitivement la piste "${track.title}" ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Error deleting track:", e);
    }
  };

  // Stats calculation
  const totalTracks =
    projects.reduce((sum, p) => sum + (p.tracks?.length || 0), 0) +
    rootTracks.length;
  const totalSizeBytes =
    projects.reduce(
      (sum, p) =>
        sum +
        (p.tracks?.reduce((tsum, t) => tsum + (t.sizeBytes || 0), 0) || 0),
      0
    ) + rootTracks.reduce((sum, t) => sum + (t.sizeBytes || 0), 0);
  const totalStorageMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="min-h-screen bg-daw-grid pb-32">
      <DashboardHeader
        onNewProject={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Top Studio Dashboard Stats Ribbon */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 font-technical">
          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Projets / Dossiers
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {projects.length}
              </span>
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
            </div>
          </GlassCard>

          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Stockage Utilisé
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {totalStorageMb}
              </span>
              <span className="text-xs text-neutral-500">Mo</span>
            </div>
          </GlassCard>

          <GlassCard className="p-3.5 sm:p-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              Résolution Audio
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs sm:text-sm font-bold text-accent-cyan">
                24-bit / 48kHz
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Section: Projects Grid */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Projets & Dossiers
              </h2>
              <p className="text-xs text-neutral-400">
                Organisez vos productions, mixes finaux et masters par session.
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
              <FolderPlus className="h-4 w-4 mr-1.5" /> Créer un dossier
            </GlassButton>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-500 font-technical">
              Chargement des projets...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-studio-900/30 p-12 text-center backdrop-blur-xl">
              <FolderPlus className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
              <h3 className="text-sm font-semibold text-white">
                Aucun projet pour l&apos;instant
              </h3>
              <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto">
                Créez votre premier projet pour regrouper vos pistes .wav / .mp3 et générer un lien d&apos;écoute public.
              </p>
              <div className="mt-4">
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  Créer mon premier projet
                </GlassButton>
              </div>
            </div>
          ) : (
            <div
              ref={projectsGridRef}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {projects.map((proj) => (
                <div key={proj.id} className="project-card-item">
                  <ProjectCard
                    project={proj}
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
              Dépôt Rapide & Pistes Isolées
            </h2>
            <p className="text-xs text-neutral-400">
              Glissez des fichiers audio à la racine de la bibliothèque pour une écoute immédiate.
            </p>
          </div>

          <AudioUploader onUploadComplete={fetchData} />

          {/* Root tracks list */}
          {rootTracks.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-technical mb-2">
                Pistes hors-projet ({rootTracks.length})
              </h3>
              {rootTracks.map((track, i) => (
                <WaveformTrackItem
                  key={track.id}
                  track={track}
                  index={i}
                  playlist={rootTracks}
                  isOwner={true}
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
