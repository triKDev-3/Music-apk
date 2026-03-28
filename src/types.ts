export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number;
  youtubeId: string;
  source?: 'spotify' | 'youtube' | 'local';
  mood?: 'chill' | 'motivation' | 'love' | 'workout';
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  coverUrl?: string;
}

export type View = 'home' | 'search' | 'library' | 'playlist' | 'now-playing' | 'ai-studio';
export type Theme = 'dark' | 'light';

// User type from Firebase Auth
export type { User } from 'firebase/auth';

