import { request } from './api';
import { DailyChallenge } from '../types';

export const challengeApi = {
  getDailyChallenges: async (): Promise<{ dateStr: string; challenges: DailyChallenge[] }> =>
    request('/challenges'),
  updateProgress: async (challengeKey: string, increment: number = 1): Promise<DailyChallenge> =>
    request('/challenges/progress', {
      method: 'POST',
      body: JSON.stringify({ challengeKey, increment }),
    }),
};
