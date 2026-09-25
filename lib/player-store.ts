import { create } from "zustand";
import { DBTrack } from "./db";

interface PlayerState {
  currentTrack: DBTrack | null;
  playlist: DBTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  loop: boolean;
  accentColor: string;
  leftLevel: number;
  rightLevel: number;

  // Actions
  playTrack: (track: DBTrack, playlist?: DBTrack[], accentColor?: string) => void;
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
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  isMuted: false,
  loop: false,
  accentColor: "#00ffd5",
  leftLevel: 0,
  rightLevel: 0,

  playTrack: (track, playlist, accentColor) => {
    const current = get().currentTrack;
    if (current?.id === track.id) {
      set({ isPlaying: !get().isPlaying });
      return;
    }

    set({
      currentTrack: track,
      playlist: playlist || get().playlist.length > 0 ? (playlist || get().playlist) : [track],
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
    const { currentTrack, playlist, loop } = get();
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    if (currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      set({
        currentTrack: nextTrack,
        isPlaying: true,
        currentTime: 0,
        duration: nextTrack.duration || 0,
      });
    } else if (loop) {
      const firstTrack = playlist[0];
      set({
        currentTrack: firstTrack,
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
}));
