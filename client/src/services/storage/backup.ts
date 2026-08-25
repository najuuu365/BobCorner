import { storage } from './database';

const BACKUP_VERSION = 1;

interface HavenBackup {
  app: 'haven';
  version: number;
  exportedAt: string;
  records: Array<{ key: string; value: unknown }>;
  preferences: { theme: string | null; userId: string | null };
}

export async function exportHavenData(): Promise<string> {
  const backup: HavenBackup = {
    app: 'haven',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    records: await storage.getAll(),
    preferences: {
      theme: localStorage.getItem('haven_theme'),
      userId: localStorage.getItem('haven_user_id'),
    },
  };
  return JSON.stringify(backup, null, 2);
}

export async function importHavenData(file: File): Promise<void> {
  const backup = JSON.parse(await file.text()) as HavenBackup;
  if (backup.app !== 'haven' || backup.version !== BACKUP_VERSION || !Array.isArray(backup.records)) {
    throw new Error('This file is not a compatible Haven backup.');
  }
  await storage.replaceAll(backup.records);
  if (backup.preferences?.theme) localStorage.setItem('haven_theme', backup.preferences.theme);
  if (backup.preferences?.userId) localStorage.setItem('haven_user_id', backup.preferences.userId);
}

export async function resetHavenData(): Promise<void> {
  await storage.clear();
  Object.keys(localStorage)
    .filter((key) => key.startsWith('haven_'))
    .forEach((key) => localStorage.removeItem(key));
}