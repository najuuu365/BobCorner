import { request } from './api';
import { GameScore, GameStatistic } from '../types';

export const gamesApi = {
  getScores: async (): Promise<{ scores: GameScore[]; stats: GameStatistic[] }> =>
    request('/games/scores'),
  saveScore: async (
    gameKey: string,
    score: number,
    won: boolean = false,
    statsJson?: string,
    extraStats?: any
  ): Promise<{ gameScore: GameScore; gameStat: GameStatistic }> =>
    request('/games/scores', {
      method: 'POST',
      body: JSON.stringify({ gameKey, score, won, statsJson, extraStats }),
    }),
};
