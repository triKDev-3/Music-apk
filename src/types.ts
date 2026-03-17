export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number;
  youtubeId: string;
  mood?: 'chill' | 'motivation' | 'love' | 'workout';
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  coverUrl?: string;
}

export type View = 'home' | 'search' | 'library' | 'playlist' | 'now-playing';
export type Theme = 'dark' | 'light';

// User type from Firebase Auth
export type { User } from 'firebase/auth';

