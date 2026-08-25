import { storage } from './storage/database';

export interface QuranAudioFile {
  id: string;
  name: string;
  blob: Blob;
  createdAt: string;
  lastPlayedAt?: string;
}

const key = () => `${localStorage.getItem('haven_user_id') ?? 'anonymous'}:quran-audio`;

export const quranApi = {
  async getFiles(): Promise<QuranAudioFile[]> {
    return (await storage.get<QuranAudioFile[]>(key())) ?? [];
  },
  async addFile(file: File): Promise<QuranAudioFile> {
    const files = await this.getFiles();
    const item = { id: crypto.randomUUID(), name: file.name, blob: file, createdAt: new Date().toISOString() };
    await storage.set(key(), [...files, item]);
    return item;
  },
  async markPlayed(id: string): Promise<void> {
    const files = await this.getFiles();
    await storage.set(key(), files.map((file) => file.id === id ? { ...file, lastPlayedAt: new Date().toISOString() } : file));
  },
  async deleteFile(id: string): Promise<void> {
    const files = await this.getFiles();
    await storage.set(key(), files.filter((file) => file.id !== id));
  },
};
