import Dexie, { Table } from 'dexie';
import { Track } from '../types';

export interface LocalTrack extends Track {
  fileBlob: Blob;
  fileName: string;
}

/**
 * Local IndexedDB database for storing imported tracks.
 * Uses Dexie for a clean Promise-based API.
 */
export class PlayMeDatabase extends Dexie {
  tracks!: Table<LocalTrack>;

  constructor() {
    super('PlayMeDB');
    this.version(1).stores({
      tracks: 'id, title, artist, fileName' // Use the string ID from Track
    });
  }
}

export const db = new PlayMeDatabase();

/** Saves a local track to IndexedDB */
export async function saveLocalTrack(track: Track, file: File) {
  const localTrack: LocalTrack = {
    ...track,
    fileBlob: file,
    fileName: file.name
  };
  return await db.tracks.put(localTrack);
}

/** Retrieves all local tracks from IndexedDB */
export async function getAllLocalTracks(): Promise<LocalTrack[]> {
  return await db.tracks.toArray();
}

/** Saves a local track with an existing Blob */
export async function saveTrackBlob(track: Track, blob: Blob, fileName?: string) {
  const localTrack: LocalTrack = {
    ...track,
    id: track.id.startsWith('local-') ? track.id : `local-${track.id}`, // Ensure local- prefix
    fileBlob: blob,
    fileName: fileName || `${track.title}.mp3`
  };
  return await db.tracks.put(localTrack);
}

/** 
 * Downloads a track from the proxy and saves it for offline listening.
 */
export async function downloadAndSaveTrack(track: Track) {
  if (!track.youtubeId) return;
  
  const response = await fetch(`/api/stream?id=${track.youtubeId}`);
  if (!response.ok) throw new Error('Download failed');
  
  const blob = await response.blob();
  return await saveTrackBlob(track, blob);
}
