import { request } from './api';
import { Achievement } from '../types';

export const achievementApi = {
  getAchievements: async (): Promise<Achievement[]> => request('/achievements'),
  unlockAchievement: async (achievementKey: string): Promise<Achievement> =>
    request('/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementKey }),
    }),
};
