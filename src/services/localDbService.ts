import Dexie, { Table } from 'dexie';
import { Track } from '../types';

export interface LocalTrack extends Track {
  fileBlob: Blob;
  fileName: string;
}

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

/** Deletes a track from IndexedDB */
export async function deleteLocalTrack(id: string) {
  return await db.tracks.delete(id);
}
