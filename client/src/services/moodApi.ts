import { request } from './api';
import { MoodCheckIn } from '../types';

export const moodApi = {
  getTodayMood: async (): Promise<MoodCheckIn | null> => request('/mood'),
  logMood: async (mood: string): Promise<MoodCheckIn> =>
    request('/mood', { method: 'POST', body: JSON.stringify({ mood }) }),
};
