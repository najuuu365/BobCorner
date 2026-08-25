import { request } from './api';
import { ReadingJournalEntry } from '../types';

export const journalApi = {
  getEntries: async (): Promise<ReadingJournalEntry[]> => request('/journal'),
  createEntry: async (data: Partial<ReadingJournalEntry>): Promise<ReadingJournalEntry> =>
    request('/journal', { method: 'POST', body: JSON.stringify(data) }),
  deleteEntry: async (id: string): Promise<{ id: string }> =>
    request(`/journal/${id}`, { method: 'DELETE' }),
};
