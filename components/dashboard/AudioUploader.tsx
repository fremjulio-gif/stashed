"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Music, FileAudio, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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

export function AudioUploader({
  projectId,
  accentColor = "#00ffd5",
  onUploadComplete,
}: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Step 2: Upload File
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("type", "audio");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Échec de l'upload");
        }

        const uploaded = await uploadRes.json();

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, progress: 75 } : q
          )
        );

        // Step 3: Create Track in DB
        const trackTitle = item.name.replace(/\.[^/.]+$/, "");
        const ext = item.name.split(".").pop()?.toLowerCase() || "wav";

        const trackRes = await fetch("/api/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: projectId || null,
            title: trackTitle,
            artist: "jlowav",
            audioUrl: uploaded.url,
            storageKey: uploaded.key,
            format: ext,
            duration: duration || 0,
            sizeBytes: item.size,
            waveformData: JSON.stringify(peaks),
          }),
        });

        if (!trackRes.ok) {
          throw new Error("Erreur enregistrement métadonnées piste");
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
