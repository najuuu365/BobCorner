import { request } from './api';
import { GardenDecoration, GardenPlant } from '../types';

interface GardenState {
  plants: GardenPlant[];
  decorations: GardenDecoration[];
}

export interface GardenVisitorResult {
  visitor: string;
  reward: number;
  alreadyMet: boolean;
}

export const gardenApi = {
  getGardenState: async (): Promise<GardenState> =>
    request('/garden'),

  plantSeed: async (plantType: string): Promise<GardenPlant> =>
    request('/garden/plant', {
      method: 'POST',
      body: JSON.stringify({
        plantType,
      }),
    }),

  waterPlant: async (plantId: string): Promise<GardenPlant> =>
    request(`/garden/water/${plantId}`, {
      method: 'POST',
    }),

  removePlant: async (plantId: string): Promise<{ id: string }> =>
    request(`/garden/plant/${plantId}`, {
      method: 'DELETE',
    }),

  interactWithVisitor: async (): Promise<GardenVisitorResult> =>
    request('/garden/visitor', { method: 'POST' }),

  placeDecoration: async (itemKey: string, placedX: number, placedY: number): Promise<GardenDecoration> =>
    request('/garden/decorations', { method: 'POST', body: JSON.stringify({ itemKey, placedX, placedY }) }),

  removeDecoration: async (decorationId: string): Promise<{ id: string }> =>
    request(`/garden/decorations/${decorationId}`, { method: 'DELETE' }),
};