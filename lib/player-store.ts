import { create } from "zustand";
import { DBTrack } from "./db";

interface PlayerState {
  currentTrack: DBTrack | null;
  currentCoverUrl: string | null;
  playlist: DBTrack[];
  queue: DBTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  loop: boolean;
  accentColor: string;
  leftLevel: number;
  rightLevel: number;

  // View toggles
  isNowPlayingOpen: boolean;
  isQueueOpen: boolean;

  // Actions
  playTrack: (
    track: DBTrack,
    playlist?: DBTrack[],
    accentColor?: string,
    coverUrl?: string | null
  ) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setAccentColor: (color: string) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setLevels: (left: number, right: number) => void;
  setCoverUrl: (url: string | null) => void;

  // Queue actions
  addToQueue: (track: DBTrack, coverUrl?: string | null) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playQueueTrack: (index: number) => void;

  // Views state
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  toggleNowPlaying: () => void;
  openQueue: () => void;
  closeQueue: () => void;
  toggleQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentCoverUrl: null,
  playlist: [],
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  isMuted: false,
  loop: false,
  accentColor: "#00ffd5",
  leftLevel: 0,
  rightLevel: 0,

  isNowPlayingOpen: false,
  isQueueOpen: false,

  playTrack: (track, playlist, accentColor, coverUrl) => {
    const current = get().currentTrack;
    if (current?.id === track.id) {
      set({ isPlaying: !get().isPlaying });
      return;
    }

    const resolvedCover = coverUrl ?? track.coverImageUrl ?? get().currentCoverUrl;

    set({
      currentTrack: track,
      currentCoverUrl: resolvedCover || null,
      playlist: playlist || (get().playlist.length > 0 ? get().playlist : [track]),
      isPlaying: true,
      currentTime: 0,
      duration: track.duration || 0,
      accentColor: accentColor || get().accentColor,
    });
  },

  togglePlay: () => {
    if (!get().currentTrack) return;
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  pause: () => set({ isPlaying: false }),
  resume: () => {
    if (get().currentTrack) set({ isPlaying: true });
  },

  seekTo: (time) => {
    set({ currentTime: time });
  },

  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleLoop: () => {
    set((state) => ({ loop: !state.loop }));
  },

  playNext: () => {
    const { currentTrack, playlist, queue, loop } = get();
    if (!currentTrack) return;

    // 1. Check manual queue first
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const remainingQueue = queue.slice(1);
      set({
        currentTrack: nextTrack,
        currentCoverUrl: nextTrack.coverImageUrl || get().currentCoverUrl,
        queue: remainingQueue,
        isPlaying: true,
        currentTime: 0,
        duration: nextTrack.duration || 0,
      });
      return;
    }

    // 2. Otherwise play next in playlist
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    if (currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      set({
        currentTrack: nextTrack,
        currentCoverUrl: nextTrack.coverImageUrl || get().currentCoverUrl,
        isPlaying: true,
        currentTime: 0,
        duration: nextTrack.duration || 0,
      });
    } else if (loop) {
      const firstTrack = playlist[0];
      set({
        currentTrack: firstTrack,
        currentCoverUrl: firstTrack.coverImageUrl || get().currentCoverUrl,
        isPlaying: true,
        currentTime: 0,
        duration: firstTrack.duration || 0,
      });
    } else {
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  playPrevious: () => {
    const { currentTrack, playlist, currentTime } = get();
    if (!currentTrack || playlist.length === 0) return;

    // If more than 3 seconds in, restart track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = playlist[currentIndex - 1];
      set({
        currentTrack: prevTrack,
        currentCoverUrl: prevTrack.coverImageUrl || get().currentCoverUrl,
        isPlaying: true,
        currentTime: 0,
        duration: prevTrack.duration || 0,
      });
    } else {
      set({ currentTime: 0 });
    }
  },

  setAccentColor: (color) => set({ accentColor: color }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  setLevels: (left, right) => set({ leftLevel: left, rightLevel: right }),
  setCoverUrl: (url) => set({ currentCoverUrl: url }),

  // Queue actions
  addToQueue: (track, coverUrl) => {
    const trackWithCover = coverUrl ? { ...track, coverImageUrl: coverUrl } : track;
    set((state) => ({
      queue: [...state.queue, trackWithCover],
    }));
  },

  removeFromQueue: (index) => {
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
    }));
  },

  moveQueueItem: (fromIndex, toIndex) => {
    const { queue } = get();
    if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
    const updated = [...queue];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set({ queue: updated });
  },

  clearQueue: () => set({ queue: [] }),

  playQueueTrack: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    const target = queue[index];
    const remaining = queue.filter((_, i) => i !== index);
    set({
      currentTrack: target,
      currentCoverUrl: target.coverImageUrl || get().currentCoverUrl,
      queue: remaining,
      isPlaying: true,
      currentTime: 0,
      duration: target.duration || 0,
    });
  },

  // View toggles
  openNowPlaying: () => set({ isNowPlayingOpen: true, isQueueOpen: false }),
  closeNowPlaying: () => set({ isNowPlayingOpen: false }),
  toggleNowPlaying: () => set((state) => ({ isNowPlayingOpen: !state.isNowPlayingOpen })),

  openQueue: () => set({ isQueueOpen: true }),
  closeQueue: () => set({ isQueueOpen: false }),
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
}));
