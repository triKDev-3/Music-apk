import Dexie, { type Table } from 'dexie';
import { Track, Playlist } from './types';

export class PlayMeDB extends Dexie {
  tracks!: Table<Track>;
  playlists!: Table<Playlist>;

  constructor() {
    super('PlayMeDB');
    this.version(1).stores({
      tracks: 'id, title, artist, addedAt',
      playlists: 'id, name, createdAt'
    });
  }
}

export const db = new PlayMeDB();
