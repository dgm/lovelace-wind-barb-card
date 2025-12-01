import { HomeAssistant, WindData, TimeRangeConfig } from '../types';
import { TimeRangeUtils } from './time-range';
import { WindDataProcessor } from './wind-data-processor';
import { HomeAssistantClient } from './ha-client';
import { Logger } from './logger';

export class WindDataAPI {
  private client: HomeAssistantClient;

  constructor(hass: HomeAssistant) {
    this.client = new HomeAssistantClient(hass);
  }

  async fetchWindData(
    directionEntity: string,
    speedEntity: string,
    gustEntity?: string,
    timeRangeConfig?: TimeRangeConfig
  ): Promise<WindData[]> {
    const config = timeRangeConfig || {
      start: '-24h',
      end: 'now',
      sampling: 'windowed_representative'
    };
    
    const timeRange = TimeRangeUtils.parseTimeRange(config);
    const intervalMs = TimeRangeUtils.calculateOptimalInterval(timeRange, config);
    
    const entities = [directionEntity, speedEntity];
    if (gustEntity) entities.push(gustEntity);
    
    const historyData = await this.client.fetchHistory(entities, timeRange.start, timeRange.end);
    const rawData = WindDataProcessor.processWindHistory(historyData, directionEntity, speedEntity, gustEntity);
    
    return WindDataProcessor.sampleWindData(rawData, timeRange, intervalMs, config);
  }

  async fetchForecastData(forecastEntity: string, hours: number = 48): Promise<WindData[]> {
    const entity = this.client.getEntityState(forecastEntity);
    if (!entity) {
      Logger.warn('WindDataAPI', 'Forecast entity not found:', forecastEntity);
      return [];
    }

    if (entity.attributes.windSpeed?.values && entity.attributes.windDirection?.values) {
      return WindDataProcessor.parseGriddedForecast(entity.attributes, hours);
    }

    Logger.warn('WindDataAPI', 'No gridded forecast data found in entity attributes');
    return [];
  }


}