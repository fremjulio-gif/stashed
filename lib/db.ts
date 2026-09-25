import { prisma } from "./prisma";
import fs from "fs";
import path from "path";
import { OWNER_EMAIL, OWNER_NAME } from "./auth";

export interface DBUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface DBProject {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  accentColor: string;
  slug: string;
  isDownloadable: boolean;
  createdAt: string;
  updatedAt: string;
  tracks?: DBTrack[];
}

export interface DBTrack {
  id: string;
  projectId: string | null;
  title: string;
  artist: string | null;
  audioUrl: string;
  storageKey: string | null;
  format: string; // "wav" | "mp3"
  duration: number; // in seconds
  sizeBytes: number;
  bpm: number | null;
  waveformData: string | null; // JSON string of normalized peaks
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBShareLink {
  id: string;
  token: string;
  projectId: string | null;
  trackId: string | null;
  passwordHash: string | null;
  expiresAt: string | null;
  viewCount: number;
  listenCount: number;
  allowDownload: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project?: DBProject;
  track?: DBTrack;
}

// Fallback JSON DB file path
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_JSON_PATH = path.join(DATA_DIR, "db.json");

interface FallbackSchema {
  users: DBUser[];
  projects: DBProject[];
  tracks: DBTrack[];
  shareLinks: DBShareLink[];
}

function getInitialFallbackData(): FallbackSchema {
  return {
    users: [
      {
        id: "owner-jlowav-1",
        email: OWNER_EMAIL,
        name: OWNER_NAME,
        passwordHash: "",
        createdAt: new Date().toISOString(),
      },
    ],
    projects: [
      {
        id: "proj_demo_1",
        ownerId: "owner-jlowav-1",
        title: "Liquid Glass EP (Mastered)",
        description:
          "Mixage & Sound Design final en 24-bit 48kHz. Conçu pour écoute au casque ou système studio.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
        accentColor: "#00ffd5",
        slug: "liquid-glass-ep",
        isDownloadable: true,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    tracks: [
      {
        id: "track_demo_1",
        projectId: "proj_demo_1",
        title: "01. Subsurface Resonance",
        artist: "jlowav",
        audioUrl: "https://actions.google.com/sounds/v1/science_fiction/deep_drone.ogg",
        storageKey: null,
        format: "wav",
        duration: 98.4,
        sizeBytes: 18450000,
        bpm: 124,
        waveformData: JSON.stringify(
          Array.from({ length: 64 }, (_, i) =>
            Math.max(0.12, Math.abs(Math.sin(i * 0.28) * Math.cos(i * 0.15) * 0.85 + 0.1))
          )
        ),
        orderIndex: 0,
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "track_demo_2",
        projectId: "proj_demo_1",
        title: "02. Glassmorphism Dawn (Final Master)",
        artist: "jlowav",
        audioUrl: "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg",
        storageKey: null,
        format: "wav",
        duration: 142.1,
        sizeBytes: 29800000,
        bpm: 128,
        waveformData: JSON.stringify(
          Array.from({ length: 64 }, (_, i) =>
            Math.max(0.15, Math.abs(Math.sin(i * 0.35) * 0.9 + 0.08))
          )
        ),
        orderIndex: 1,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "track_demo_3",
        projectId: "proj_demo_1",
        title: "03. DAW Transient Study",
        artist: "jlowav",
        audioUrl: "https://actions.google.com/sounds/v1/science_fiction/scifi_engine.ogg",
        storageKey: null,
        format: "mp3",
        duration: 76.5,
        sizeBytes: 3800000,
        bpm: 130,
        waveformData: JSON.stringify(
          Array.from({ length: 64 }, (_, i) =>
            Math.max(0.08, Math.abs(Math.cos(i * 0.4) * 0.7 + 0.12))
          )
        ),
        orderIndex: 2,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    shareLinks: [
      {
        id: "share_demo_1",
        token: "demo-stashed",
        projectId: "proj_demo_1",
        trackId: null,
        passwordHash: null,
        expiresAt: null,
        viewCount: 14,
        listenCount: 28,
        allowDownload: true,
        isActive: true,
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

function readFallbackDB(): FallbackSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_JSON_PATH)) {
    const initial = getInitialFallbackData();
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_JSON_PATH, "utf-8"));
  } catch {
    return getInitialFallbackData();
  }
}

function writeFallbackDB(data: FallbackSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_JSON_PATH, JSON.stringify(data, null, 2));
}

function shouldUsePrisma(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.DATABASE_URL.startsWith("postgres") &&
      !process.env.DATABASE_URL.includes("dummy")
  );
}

// ================= USER OPERATIONS =================

export async function getOwnerUser(): Promise<DBUser> {
  if (shouldUsePrisma()) {
    try {
      let user = await prisma.user.findUnique({
        where: { email: OWNER_EMAIL },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: OWNER_EMAIL,
            name: OWNER_NAME,
            passwordHash: "",
          },
        });
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma user fallback:", e);
    }
  }

  const db = readFallbackDB();
  return db.users[0];
}

// ================= PROJECT OPERATIONS =================

export async function getProjects(): Promise<DBProject[]> {
  if (shouldUsePrisma()) {
    try {
      const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          tracks: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
      return projects.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        description: p.description,
        coverImageUrl: p.coverImageUrl,
        accentColor: p.accentColor,
        slug: p.slug,
        isDownloadable: p.isDownloadable,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        tracks: p.tracks.map((t) => ({
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          artist: t.artist,
          audioUrl: t.audioUrl,
          storageKey: t.storageKey,
          format: t.format,
          duration: t.duration,
          sizeBytes: t.sizeBytes,
          bpm: t.bpm,
          waveformData: t.waveformData,
          orderIndex: t.orderIndex,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      }));
    } catch (e) {
      console.warn("Prisma getProjects error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  return db.projects.map((proj) => {
    const tracks = db.tracks
      .filter((t) => t.projectId === proj.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return { ...proj, tracks };
  });
}

export async function getProjectBySlug(slug: string): Promise<DBProject | null> {
  if (shouldUsePrisma()) {
    try {
      const p = await prisma.project.findUnique({
        where: { slug },
        include: {
          tracks: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
      if (p) {
        return {
          id: p.id,
          ownerId: p.ownerId,
          title: p.title,
          description: p.description,
          coverImageUrl: p.coverImageUrl,
          accentColor: p.accentColor,
          slug: p.slug,
          isDownloadable: p.isDownloadable,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          tracks: p.tracks.map((t) => ({
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            artist: t.artist,
            audioUrl: t.audioUrl,
            storageKey: t.storageKey,
            format: t.format,
            duration: t.duration,
            sizeBytes: t.sizeBytes,
            bpm: t.bpm,
            waveformData: t.waveformData,
            orderIndex: t.orderIndex,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
          })),
        };
      }
    } catch (e) {
      console.warn("Prisma getProjectBySlug error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const proj = db.projects.find((p) => p.slug === slug);
  if (!proj) return null;
  const tracks = db.tracks
    .filter((t) => t.projectId === proj.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return { ...proj, tracks };
}

export async function getProjectById(id: string): Promise<DBProject | null> {
  if (shouldUsePrisma()) {
    try {
      const p = await prisma.project.findUnique({
        where: { id },
        include: {
          tracks: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
      if (p) {
        return {
          id: p.id,
          ownerId: p.ownerId,
          title: p.title,
          description: p.description,
          coverImageUrl: p.coverImageUrl,
          accentColor: p.accentColor,
          slug: p.slug,
          isDownloadable: p.isDownloadable,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          tracks: p.tracks.map((t) => ({
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            artist: t.artist,
            audioUrl: t.audioUrl,
            storageKey: t.storageKey,
            format: t.format,
            duration: t.duration,
            sizeBytes: t.sizeBytes,
            bpm: t.bpm,
            waveformData: t.waveformData,
            orderIndex: t.orderIndex,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
          })),
        };
      }
    } catch (e) {
      console.warn("Prisma getProjectById error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const proj = db.projects.find((p) => p.id === id);
  if (!proj) return null;
  const tracks = db.tracks
    .filter((t) => t.projectId === proj.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return { ...proj, tracks };
}

export async function createProject(data: {
  title: string;
  description?: string;
  coverImageUrl?: string;
  accentColor?: string;
  slug?: string;
  isDownloadable?: boolean;
}): Promise<DBProject> {
  const user = await getOwnerUser();
  const baseSlug =
    data.slug ||
    data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "project";
  const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  if (shouldUsePrisma()) {
    try {
      const p = await prisma.project.create({
        data: {
          ownerId: user.id,
          title: data.title,
          description: data.description || null,
          coverImageUrl: data.coverImageUrl || null,
          accentColor: data.accentColor || "#00ffd5",
          slug: uniqueSlug,
          isDownloadable: data.isDownloadable ?? true,
        },
      });
      return {
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        description: p.description,
        coverImageUrl: p.coverImageUrl,
        accentColor: p.accentColor,
        slug: p.slug,
        isDownloadable: p.isDownloadable,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        tracks: [],
      };
    } catch (e) {
      console.warn("Prisma createProject error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const newProj: DBProject = {
    id: `proj_${Date.now()}`,
    ownerId: user.id,
    title: data.title,
    description: data.description || null,
    coverImageUrl: data.coverImageUrl || null,
    accentColor: data.accentColor || "#00ffd5",
    slug: uniqueSlug,
    isDownloadable: data.isDownloadable ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tracks: [],
  };
  db.projects.unshift(newProj);
  writeFallbackDB(db);
  return newProj;
}

export async function updateProject(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    accentColor: string;
    slug: string;
    isDownloadable: boolean;
  }>
): Promise<DBProject | null> {
  if (shouldUsePrisma()) {
    try {
      const p = await prisma.project.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
          ...(data.accentColor !== undefined ? { accentColor: data.accentColor } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.isDownloadable !== undefined ? { isDownloadable: data.isDownloadable } : {}),
        },
      });
      return {
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        description: p.description,
        coverImageUrl: p.coverImageUrl,
        accentColor: p.accentColor,
        slug: p.slug,
        isDownloadable: p.isDownloadable,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma updateProject error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const index = db.projects.findIndex((p) => p.id === id);
  if (index === -1) return null;
  db.projects[index] = {
    ...db.projects[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeFallbackDB(db);
  return db.projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  if (shouldUsePrisma()) {
    try {
      await prisma.project.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn("Prisma deleteProject error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.tracks = db.tracks.filter((t) => t.projectId !== id);
  db.shareLinks = db.shareLinks.filter((s) => s.projectId !== id);
  writeFallbackDB(db);
  return true;
}

// ================= TRACK OPERATIONS =================

export async function getTracks(projectId?: string | null): Promise<DBTrack[]> {
  if (shouldUsePrisma()) {
    try {
      const tracks = await prisma.track.findMany({
        where: projectId !== undefined ? { projectId } : undefined,
        orderBy: { orderIndex: "asc" },
      });
      return tracks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        artist: t.artist,
        audioUrl: t.audioUrl,
        storageKey: t.storageKey,
        format: t.format,
        duration: t.duration,
        sizeBytes: t.sizeBytes,
        bpm: t.bpm,
        waveformData: t.waveformData,
        orderIndex: t.orderIndex,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }));
    } catch (e) {
      console.warn("Prisma getTracks error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  let tracks = db.tracks;
  if (projectId !== undefined) {
    tracks = tracks.filter((t) => t.projectId === projectId);
  }
  return tracks.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getTrackById(id: string): Promise<DBTrack | null> {
  if (shouldUsePrisma()) {
    try {
      const t = await prisma.track.findUnique({ where: { id } });
      if (t) {
        return {
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          artist: t.artist,
          audioUrl: t.audioUrl,
          storageKey: t.storageKey,
          format: t.format,
          duration: t.duration,
          sizeBytes: t.sizeBytes,
          bpm: t.bpm,
          waveformData: t.waveformData,
          orderIndex: t.orderIndex,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Prisma getTrackById error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  return db.tracks.find((t) => t.id === id) || null;
}

export async function createTrack(data: {
  projectId?: string | null;
  title: string;
  artist?: string;
  audioUrl: string;
  storageKey?: string;
  format: string;
  duration?: number;
  sizeBytes?: number;
  bpm?: number;
  waveformData?: string;
  orderIndex?: number;
}): Promise<DBTrack> {
  // calculate order index if not given
  let orderIndex = data.orderIndex;
  if (orderIndex === undefined) {
    const existing = await getTracks(data.projectId);
    orderIndex = existing.length;
  }

  if (shouldUsePrisma()) {
    try {
      const t = await prisma.track.create({
        data: {
          projectId: data.projectId || null,
          title: data.title,
          artist: data.artist || null,
          audioUrl: data.audioUrl,
          storageKey: data.storageKey || null,
          format: data.format.toLowerCase(),
          duration: data.duration || 0,
          sizeBytes: data.sizeBytes || 0,
          bpm: data.bpm || null,
          waveformData: data.waveformData || null,
          orderIndex,
        },
      });
      return {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        artist: t.artist,
        audioUrl: t.audioUrl,
        storageKey: t.storageKey,
        format: t.format,
        duration: t.duration,
        sizeBytes: t.sizeBytes,
        bpm: t.bpm,
        waveformData: t.waveformData,
        orderIndex: t.orderIndex,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma createTrack error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const newTrack: DBTrack = {
    id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: data.projectId || null,
    title: data.title,
    artist: data.artist || null,
    audioUrl: data.audioUrl,
    storageKey: data.storageKey || null,
    format: data.format.toLowerCase(),
    duration: data.duration || 0,
    sizeBytes: data.sizeBytes || 0,
    bpm: data.bpm || null,
    waveformData: data.waveformData || null,
    orderIndex,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.tracks.push(newTrack);
  writeFallbackDB(db);
  return newTrack;
}

export async function updateTrack(
  id: string,
  data: Partial<{
    title: string;
    artist: string | null;
    bpm: number | null;
    orderIndex: number;
    projectId: string | null;
  }>
): Promise<DBTrack | null> {
  if (shouldUsePrisma()) {
    try {
      const t = await prisma.track.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.artist !== undefined ? { artist: data.artist } : {}),
          ...(data.bpm !== undefined ? { bpm: data.bpm } : {}),
          ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
          ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
        },
      });
      return {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        artist: t.artist,
        audioUrl: t.audioUrl,
        storageKey: t.storageKey,
        format: t.format,
        duration: t.duration,
        sizeBytes: t.sizeBytes,
        bpm: t.bpm,
        waveformData: t.waveformData,
        orderIndex: t.orderIndex,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma updateTrack error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const idx = db.tracks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.tracks[idx] = {
    ...db.tracks[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeFallbackDB(db);
  return db.tracks[idx];
}

export async function reorderTracks(
  projectId: string | null,
  orderedTrackIds: string[]
): Promise<void> {
  if (shouldUsePrisma()) {
    try {
      await prisma.$transaction(
        orderedTrackIds.map((id, index) =>
          prisma.track.update({
            where: { id },
            data: { orderIndex: index },
          })
        )
      );
      return;
    } catch (e) {
      console.warn("Prisma reorderTracks error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  orderedTrackIds.forEach((id, index) => {
    const track = db.tracks.find((t) => t.id === id);
    if (track) track.orderIndex = index;
  });
  writeFallbackDB(db);
}

export async function deleteTrack(id: string): Promise<DBTrack | null> {
  if (shouldUsePrisma()) {
    try {
      const t = await prisma.track.delete({ where: { id } });
      return {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        artist: t.artist,
        audioUrl: t.audioUrl,
        storageKey: t.storageKey,
        format: t.format,
        duration: t.duration,
        sizeBytes: t.sizeBytes,
        bpm: t.bpm,
        waveformData: t.waveformData,
        orderIndex: t.orderIndex,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma deleteTrack error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const idx = db.tracks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const deleted = db.tracks.splice(idx, 1)[0];
  writeFallbackDB(db);
  return deleted;
}

// ================= SHARE LINK OPERATIONS =================

export async function createShareLink(data: {
  projectId?: string | null;
  trackId?: string | null;
  passwordHash?: string | null;
  expiresAt?: Date | null;
  allowDownload?: boolean;
}): Promise<DBShareLink> {
  // Generate a clean 10-char nano token
  const token = Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4, 8);

  if (shouldUsePrisma()) {
    try {
      const s = await prisma.shareLink.create({
        data: {
          token,
          projectId: data.projectId || null,
          trackId: data.trackId || null,
          passwordHash: data.passwordHash || null,
          expiresAt: data.expiresAt || null,
          allowDownload: data.allowDownload ?? true,
          isActive: true,
        },
      });
      return {
        id: s.id,
        token: s.token,
        projectId: s.projectId,
        trackId: s.trackId,
        passwordHash: s.passwordHash,
        expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
        viewCount: s.viewCount,
        listenCount: s.listenCount,
        allowDownload: s.allowDownload,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma createShareLink error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const newShare: DBShareLink = {
    id: `share_${Date.now()}`,
    token,
    projectId: data.projectId || null,
    trackId: data.trackId || null,
    passwordHash: data.passwordHash || null,
    expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
    viewCount: 0,
    listenCount: 0,
    allowDownload: data.allowDownload ?? true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.shareLinks.push(newShare);
  writeFallbackDB(db);
  return newShare;
}

export async function getShareLinkByToken(
  token: string
): Promise<DBShareLink | null> {
  if (shouldUsePrisma()) {
    try {
      const s = await prisma.shareLink.findUnique({
        where: { token },
        include: {
          project: {
            include: {
              tracks: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          track: true,
        },
      });
      if (s) {
        return {
          id: s.id,
          token: s.token,
          projectId: s.projectId,
          trackId: s.trackId,
          passwordHash: s.passwordHash,
          expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
          viewCount: s.viewCount,
          listenCount: s.listenCount,
          allowDownload: s.allowDownload,
          isActive: s.isActive,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          project: s.project
            ? {
                id: s.project.id,
                ownerId: s.project.ownerId,
                title: s.project.title,
                description: s.project.description,
                coverImageUrl: s.project.coverImageUrl,
                accentColor: s.project.accentColor,
                slug: s.project.slug,
                isDownloadable: s.project.isDownloadable,
                createdAt: s.project.createdAt.toISOString(),
                updatedAt: s.project.updatedAt.toISOString(),
                tracks: s.project.tracks.map((t) => ({
                  id: t.id,
                  projectId: t.projectId,
                  title: t.title,
                  artist: t.artist,
                  audioUrl: t.audioUrl,
                  storageKey: t.storageKey,
                  format: t.format,
                  duration: t.duration,
                  sizeBytes: t.sizeBytes,
                  bpm: t.bpm,
                  waveformData: t.waveformData,
                  orderIndex: t.orderIndex,
                  createdAt: t.createdAt.toISOString(),
                  updatedAt: t.updatedAt.toISOString(),
                })),
              }
            : undefined,
          track: s.track
            ? {
                id: s.track.id,
                projectId: s.track.projectId,
                title: s.track.title,
                artist: s.track.artist,
                audioUrl: s.track.audioUrl,
                storageKey: s.track.storageKey,
                format: s.track.format,
                duration: s.track.duration,
                sizeBytes: s.track.sizeBytes,
                bpm: s.track.bpm,
                waveformData: s.track.waveformData,
                orderIndex: s.track.orderIndex,
                createdAt: s.track.createdAt.toISOString(),
                updatedAt: s.track.updatedAt.toISOString(),
              }
            : undefined,
        };
      }
    } catch (e) {
      console.warn("Prisma getShareLinkByToken error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const link = db.shareLinks.find((s) => s.token === token);
  if (!link) return null;

  let project = link.projectId
    ? db.projects.find((p) => p.id === link.projectId)
    : undefined;
  if (project) {
    const pId = project.id;
    const tracks = db.tracks
      .filter((t) => t.projectId === pId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    project = { ...project, tracks };
  }
  const track = link.trackId
    ? db.tracks.find((t) => t.id === link.trackId)
    : undefined;

  return { ...link, project, track };
}

export async function deleteShareLink(id: string): Promise<boolean> {
  if (shouldUsePrisma()) {
    try {
      await prisma.shareLink.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn("Prisma deleteShareLink error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  db.shareLinks = db.shareLinks.filter((s) => s.id !== id);
  writeFallbackDB(db);
  return true;
}

export async function recordShareView(token: string): Promise<void> {
  if (shouldUsePrisma()) {
    try {
      await prisma.shareLink.update({
        where: { token },
        data: { viewCount: { increment: 1 } },
      });
      return;
    } catch (e) {
      console.warn("Prisma recordShareView error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const link = db.shareLinks.find((s) => s.token === token);
  if (link) {
    link.viewCount = (link.viewCount || 0) + 1;
    writeFallbackDB(db);
  }
}

export async function recordShareListen(token: string): Promise<void> {
  if (shouldUsePrisma()) {
    try {
      await prisma.shareLink.update({
        where: { token },
        data: { listenCount: { increment: 1 } },
      });
      return;
    } catch (e) {
      console.warn("Prisma recordShareListen error, using fallback:", e);
    }
  }

  const db = readFallbackDB();
  const link = db.shareLinks.find((s) => s.token === token);
  if (link) {
    link.listenCount = (link.listenCount || 0) + 1;
    writeFallbackDB(db);
  }
}
