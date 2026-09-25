"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { GlassButton } from "../ui/GlassButton";

interface AudioUploaderProps {
  projectId?: string | null;
  accentColor?: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "decoding" | "uploading" | "done" | "error";
  errorMessage?: string;
}

interface StorageStatus {
  isConfigured: boolean;
  provider: string;
  isProduction: boolean;
}

export function AudioUploader({
  projectId,
  accentColor = "#00ffd5",
  onUploadComplete,
}: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadingFile[]>([]);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check storage configuration on mount
  useEffect(() => {
    fetch("/api/storage/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStorageStatus(data);
      })
      .catch((err) => console.warn("Could not check storage status:", err));
  }, []);

  // Extract waveform peaks using Web Audio API
  const extractWaveformPeaks = async (
    file: File
  ): Promise<{ duration: number; peaks: number[] }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

      const rawData = audioBuffer.getChannelData(0);
      const samples = 64; // 64 bars for waveform
      const blockSize = Math.floor(rawData.length / samples);
      const peaks: number[] = [];

      for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        peaks.push(sum / blockSize);
      }

      // Normalize peaks between 0.1 and 1.0
      const maxPeak = Math.max(...peaks, 0.01);
      const normalizedPeaks = peaks.map((p) =>
        Math.max(0.1, Number((p / maxPeak).toFixed(3)))
      );

      await audioCtx.close();
      return { duration: audioBuffer.duration, peaks: normalizedPeaks };
    } catch (e) {
      console.warn("Waveform extraction fallback:", e);
      // Fallback procedural peaks
      const procedural = Array.from({ length: 64 }, (_, i) =>
        Number(
          Math.max(0.12, Math.abs(Math.sin(i * 0.28) * 0.8 + 0.15)).toFixed(3)
        )
      );
      return { duration: 0, peaks: procedural };
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "wav" || ext === "mp3") {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    const newItems: UploadingFile[] = validFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "decoding",
    }));

    setQueue((prev) => [...prev, ...newItems]);

    // Process each file sequentially
    for (const item of newItems) {
      try {
        // Step 1: Decode Audio & Waveform
        const { duration, peaks } = await extractWaveformPeaks(item.file);

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "uploading", progress: 20 } : q
          )
        );

        // Step 2: Obtain Direct Upload Endpoint / Token
        const ext = item.name.split(".").pop()?.toLowerCase() || "wav";
        const mime = item.file.type || (ext === "wav" ? "audio/wav" : "audio/mpeg");

        const tokenRes = await fetch("/api/upload/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            contentType: mime,
            folder: "audio",
          }),
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          throw new Error(errData.error || "Impossible d'initialiser le téléversement.");
        }

        const uploadConfig = await tokenRes.json();
        if (uploadConfig.error) {
          throw new Error(uploadConfig.error);
        }

        let uploadedUrl = "";
        let storageKey = uploadConfig.key || `audio/${Date.now()}_${item.file.name}`;

        // Case A: Cloudflare R2 direct browser-to-bucket S3 PUT
        if (uploadConfig.provider === "r2") {
          const r2Res = await fetch(uploadConfig.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": mime },
            body: item.file,
          });

          if (!r2Res.ok) {
            throw new Error("Échec du téléversement direct vers Cloudflare R2.");
          }
          uploadedUrl = uploadConfig.finalPublicUrl;
        }
        // Case B: Vercel Blob direct browser upload
        else if (uploadConfig.provider === "vercel-blob") {
          const { upload } = await import("@vercel/blob/client");
          const newBlob = await upload(`audio/${item.file.name}`, item.file, {
            access: "public",
            handleUploadUrl: "/api/upload/blob",
          });
          uploadedUrl = newBlob.url;
          storageKey = newBlob.pathname;
        }
        // Case C: Local filesystem fallback (local dev)
        else if (uploadConfig.provider === "local") {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("type", "audio");

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || "Échec de l'upload local");
          }

          const uploaded = await uploadRes.json();
          uploadedUrl = uploaded.url;
          storageKey = uploaded.key;
        } else {
          throw new Error(
            "Stockage cloud non configuré : Activez Vercel Blob dans le dashboard Vercel (onglet Storage) ou renseignez vos clés Cloudflare R2."
          );
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, progress: 80 } : q
          )
        );

        // Step 3: Create Track in DB
        const trackTitle = item.name.replace(/\.[^/.]+$/, "");

        const trackRes = await fetch("/api/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: projectId || null,
            title: trackTitle,
            artist: "jlowav",
            audioUrl: uploadedUrl,
            storageKey,
            format: ext,
            duration: duration || 0,
            sizeBytes: item.size,
            waveformData: JSON.stringify(peaks),
          }),
        });

        if (!trackRes.ok) {
          const trackErr = await trackRes.json().catch(() => ({}));
          throw new Error(trackErr.error || "Erreur enregistrement métadonnées piste");
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, progress: 100, status: "done" } : q
          )
        );
      } catch (err: unknown) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "error",
                  errorMessage:
                    err instanceof Error ? err.message : "Erreur upload",
                }
              : q
          )
        );
      }
    }

    onUploadComplete();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Storage configuration warning banner if in production and not configured */}
      {storageStatus && !storageStatus.isConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 backdrop-blur-xl text-amber-200 shadow-glass">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs">
              <h5 className="font-bold text-white text-sm">
                Stockage Cloud requis pour les fichiers audio (.wav & .mp3)
              </h5>
              <p className="leading-relaxed text-neutral-300">
                Sur Vercel, le système de fichiers serveur est temporaire et en lecture seule. Pour héberger vos pistes audio et vos pochettes, activez un espace de stockage :
              </p>
              <div className="pt-2 flex flex-wrap gap-2.5">
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan font-technical font-semibold hover:bg-accent-cyan/30 transition-colors"
                >
                  Option 1 : Vercel Blob (1 clic gratuit) <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-neutral-400 self-center">ou</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 font-technical">
                  Option 2 : Cloudflare R2 (10 Go gratuits, 0$ egress)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 backdrop-blur-xl ${
          isDragOver
            ? "border-accent-cyan bg-accent-cyan/10 scale-[1.01]"
            : "border-white/10 bg-studio-900/30 hover:border-white/20 hover:bg-studio-900/50"
        }`}
        style={{
          boxShadow: isDragOver
            ? `0 0 30px -5px ${accentColor}40`
            : undefined,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".wav,.mp3,audio/wav,audio/mpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
          }}
        />

        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-transform duration-200 group-hover:scale-105"
          style={{
            boxShadow: `0 0 20px -5px ${accentColor}30`,
          }}
        >
          <UploadCloud
            className="h-6 w-6 text-white"
            style={{ color: accentColor }}
          />
        </div>

        <h4 className="text-sm font-semibold text-white tracking-tight">
          Glissez-déposez vos fichiers audio (.wav, .mp3)
        </h4>
        <p className="mt-1 text-xs text-neutral-400 font-technical">
          Multi-fichiers supporté • Décodage waveform automatique • Jusqu&apos;à 250 Mo/fichier
        </p>

        <div className="mt-4">
          <GlassButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Parcourir les fichiers
          </GlassButton>
        </div>
      </div>

      {/* Uploading Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-studio-900/70 p-3 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileAudio className="h-5 w-5 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-technical">
                    {(item.size / (1024 * 1024)).toFixed(1)} Mo •{" "}
                    {item.status === "decoding" && "Analyse waveform..."}
                    {item.status === "uploading" && "Téléversement..."}
                    {item.status === "done" && "Prêt"}
                    {item.status === "error" && (item.errorMessage || "Erreur")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === "decoding" || item.status === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                ) : item.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
