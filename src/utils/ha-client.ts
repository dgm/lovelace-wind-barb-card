import { HomeAssistant, HistoryData } from '../types';
import { Logger } from './logger';

export class HomeAssistantClient {
  constructor(private hass: HomeAssistant) {}

  async fetchHistory(
    entityIds: string[], 
    startTime: Date, 
    endTime?: Date
  ): Promise<HistoryData[][]> {
    const endTimeStr = endTime ? endTime.toISOString() : new Date().toISOString();
    const startTimeStr = startTime.toISOString();
    
    const path = `history/period/${startTimeStr}?filter_entity_id=${entityIds.join(',')}&end_time=${endTimeStr}`;
    
    try {
      const result = await this.hass.callApi('GET', path);
      return result || [];
    } catch (error) {
      Logger.error('HomeAssistantClient', 'Failed to fetch history data:', error);
      return [];
    }
  }

  getEntityState(entityId: string) {
    return this.hass.states[entityId];
  }
}