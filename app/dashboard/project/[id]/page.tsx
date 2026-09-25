"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DBProject, DBTrack } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WaveformTrackItem } from "@/components/audio/WaveformTrackItem";
import { AudioUploader } from "@/components/dashboard/AudioUploader";
import { ProjectModal } from "@/components/dashboard/ProjectModal";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { MetadataModal } from "@/components/dashboard/MetadataModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  ArrowLeft,
  Share2,
  Edit2,
  Trash2,
  Music,
  Clock,
  Download,
  Folder,
  User,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<DBProject | null>(null);
  const [tracks, setTracks] = useState<DBTrack[]>([]);
  const [currentUser, setCurrentUser] = useState<{ pseudo: string; visitorId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingTrack, setSharingTrack] = useState<DBTrack | null>(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<DBTrack | null>(null);

  // Load session
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
        }
      })
      .catch(() => {});
  }, []);

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        throw new Error("Projet non trouvé");
      }
      const data: DBProject = await res.json();
      setProject(data);
      const tracksWithCover = (data.tracks || []).map((t) => ({
        ...t,
        coverImageUrl: data.coverImageUrl,
      }));
      setTracks(tracksWithCover);
    } catch (e) {
      console.error(e);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

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

  const isProjectOwner = project ? canEditResource(project.creatorId, project.creatorName) : false;

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!isProjectOwner) {
      alert("Vous ne pouvez supprimer que les projets que vous avez créés.");
      return;
    }

    if (
      !confirm(
        `Supprimer définitivement le projet "${project.title}" et toutes ses pistes audio ?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTrack = async (track: DBTrack) => {
    const canDeleteThisTrack = canEditResource(track.creatorId, track.creatorName) || isProjectOwner;
    if (!canDeleteThisTrack) {
      alert("Vous ne pouvez supprimer que les pistes que vous avez ajoutées ou celles de votre projet.");
      return;
    }

    if (!confirm(`Supprimer la piste "${track.title}" ?`)) return;
    try {
      const res = await fetch(`/api/tracks/${track.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProjectData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-daw-grid flex items-center justify-center font-technical text-neutral-400">
        Chargement de la session collaborative...
      </div>
    );
  }

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-daw-grid pb-32">
      <DashboardHeader
        userPseudo={currentUser?.pseudo}
        onNewProject={() => router.push("/dashboard")}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la bibliothèque commune
          </Link>
        </div>

        {/* Project Stage Header */}
        <GlassCard
          glowColor={project.accentColor}
          className="mb-8 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Cover Art */}
            <div
              className="relative aspect-square w-32 sm:w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl"
              style={{
                boxShadow: `0 0 30px -5px ${project.accentColor}40`,
              }}
            >
              {project.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.coverImageUrl}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                  <Folder
                    className="h-14 w-14"
                    style={{ color: project.accentColor }}
                  />
                </div>
              )}
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-technical text-xs text-neutral-400 mb-1.5">
                <span className="uppercase tracking-wider">Session Collaborative</span>
                <span>•</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: project.accentColor,
                    boxShadow: `0 0 8px ${project.accentColor}`,
                  }}
                />
                <span className="flex items-center gap-1 text-white font-medium">
                  <User className="h-3 w-3 text-neutral-400" />
                  Créé par {project.creatorName || "Anonyme"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {project.title}
              </h1>

              {project.description && (
                <p className="mt-2 text-sm text-neutral-300 max-w-2xl font-normal leading-relaxed">
                  {project.description}
                </p>
              )}

              {/* Technical stats metadata ribbon */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-technical text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-neutral-400" />
                  <span>
                    {tracks.length} {tracks.length <= 1 ? "piste" : "pistes"}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{formatTotalTime(totalDuration)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-neutral-400" />
                  <span>
                    {project.isDownloadable
                      ? "Téléchargement permis"
                      : "Streaming seul"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <GlassButton
                  variant="primary"
                  size="sm"
                  accentColor={project.accentColor}
                  glow
                  onClick={() => {
                    setSharingTrack(null);
                    setIsShareModalOpen(true);
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1.5" /> Partager ce projet
                </GlassButton>

                {isProjectOwner && (
                  <>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Modifier
                    </GlassButton>

                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteProject}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Supprimer
                    </GlassButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Audio Uploader for this project (any visitor can add stems/mixes) */}
        <div className="mb-8">
          <AudioUploader
            projectId={project.id}
            accentColor={project.accentColor}
            onUploadComplete={fetchProjectData}
          />
        </div>

        {/* Tracklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 font-technical">
              Pistes de la session ({tracks.length})
            </h2>
            <span className="text-xs text-neutral-500 font-technical">
              Glissez des fichiers pour ajouter à ce projet
            </span>
          </div>

          {tracks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-neutral-400 font-technical">
              Aucune piste audio dans ce projet. Déposez des fichiers .wav ou .mp3 ci-dessus.
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track, i) => (
                <WaveformTrackItem
                  key={track.id}
                  track={track}
                  index={i}
                  playlist={tracks}
                  accentColor={project.accentColor}
                  canEdit={canEditResource(track.creatorId, track.creatorName) || isProjectOwner}
                  allowDownload={project.isDownloadable}
                  onEdit={(t) => {
                    setEditingTrack(t);
                    setIsMetadataModalOpen(true);
                  }}
                  onDelete={handleDeleteTrack}
                  onShare={(t) => {
                    setSharingTrack(t);
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
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        onSaved={fetchProjectData}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        track={sharingTrack}
      />

      <MetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        track={editingTrack}
        onSaved={fetchProjectData}
      />
    </div>
  );
}
