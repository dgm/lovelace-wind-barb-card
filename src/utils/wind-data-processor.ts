import { HistoryData, WindData, TimeRangeConfig, TimeInterval } from '../types';
import { SamplingStrategyFactory } from './sampling-strategies';

export class WindDataProcessor {
  static processWindHistory(
    historyData: HistoryData[][],
    directionEntity: string,
    speedEntity: string,
    gustEntity?: string
  ): WindData[] {
    const windData: WindData[] = [];
    
    if (historyData.length === 0) return windData;
    
    const directionData = historyData.find(data => 
      data.length > 0 && data[0].entity_id === directionEntity
    ) || [];
    
    const speedData = historyData.find(data => 
      data.length > 0 && data[0].entity_id === speedEntity
    ) || [];
    
    const gustData = gustEntity ? historyData.find(data => 
      data.length > 0 && data[0].entity_id === gustEntity
    ) || [] : [];

    speedData.forEach(speedPoint => {
      const speed = parseFloat(speedPoint.state);
      if (isNaN(speed)) return;
      
      const timestamp = new Date(speedPoint.last_updated);
      const directionPoint = this.findClosestDataPoint(directionData, speedPoint.last_updated, 10 * 60 * 1000);
      
      if (directionPoint) {
        const direction = parseFloat(directionPoint.state);
        if (!isNaN(direction)) {
          const gustPoint = gustData.length > 0 ? 
            this.findClosestDataPoint(gustData, speedPoint.last_updated, 10 * 60 * 1000) : null;
          const gust = gustPoint ? parseFloat(gustPoint.state) : undefined;
          
          windData.push({
            timestamp,
            direction,
            speed,
            gust: !isNaN(gust!) ? gust : undefined
          });
        }
      }
    });
    
    return windData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  static sampleWindData(
    data: WindData[], 
    timeRange: TimeInterval, 
    intervalMs: number,
    config?: TimeRangeConfig
  ): WindData[] {
    const strategy = SamplingStrategyFactory.create(config?.sampling);
    return strategy.sample(data, timeRange, intervalMs, config);
  }

  static parseTimeSeriesForecast(
    directionValues: any[],
    speedValues: any[],
    gustValues?: any[],
    hours: number = 48
  ): WindData[] {
    const now = new Date();
    const maxTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const forecastData: WindData[] = [];
    
    const maxEntries = Math.min(directionValues.length, speedValues.length);
    
    for (let i = 0; i < maxEntries; i++) {
      const dirEntry = directionValues[i];
      const speedEntry = speedValues[i];
      
      if (!dirEntry?.validTime || !speedEntry?.validTime) continue;
      if (dirEntry.value === null || speedEntry.value === null) continue;
      
      // Find matching gust entry by validTime
      const gustEntry = gustValues?.find(g => g?.validTime === speedEntry.validTime);
      
      const [startTimeStr, durationStr] = speedEntry.validTime.split('/');
      const startTime = new Date(startTimeStr);
      
      let durationHours = 1;
      if (durationStr) {
        const match = durationStr.match(/PT(\d+)H/);
        if (match) durationHours = parseInt(match[1]);
      }
      
      // Convert speed from kph to m/s (NWS returns kph)
      const speedMps = speedEntry.value / 3.6;
      const gustMps = gustEntry?.value ? gustEntry.value / 3.6 : undefined;
      
      // Direction is already in degrees, no conversion needed
      const direction = dirEntry.value;
      
      for (let h = 0; h < durationHours; h++) {
        const timestamp = new Date(startTime.getTime() + h * 60 * 60 * 1000);
        
        if (timestamp > now && timestamp <= maxTime) {
          forecastData.push({
            timestamp,
            direction,
            speed: speedMps,
            gust: gustMps,
            isForecast: true
          });
        }
      }
    }
    
    return forecastData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  static aggregateWindData(data: WindData[], totalHours: number): WindData[] {
    if (data.length === 0) return data;
    
    const binCount = Math.min(12, Math.ceil(totalHours / 2));
    const binSizeMs = (totalHours * 60 * 60 * 1000) / binCount;
    const startTime = new Date().getTime() - (totalHours * 60 * 60 * 1000);
    
    const bins: WindData[][] = Array(binCount).fill(null).map(() => []);
    
    data.forEach(point => {
      const binIndex = Math.floor((point.timestamp.getTime() - startTime) / binSizeMs);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].push(point);
      }
    });
    
    return bins.map((bin, i) => {
      if (bin.length === 0) return null;
      
      const avgSpeed = bin.reduce((sum, p) => sum + p.speed, 0) / bin.length;
      const avgDirection = this.averageDirection(bin.map(p => p.direction));
      const avgGust = bin.some(p => p.gust) ? 
        bin.filter(p => p.gust).reduce((sum, p) => sum + p.gust!, 0) / bin.filter(p => p.gust).length : undefined;
      
      return {
        timestamp: new Date(startTime + (i + 0.5) * binSizeMs),
        speed: avgSpeed,
        direction: avgDirection,
        gust: avgGust
      };
    }).filter(Boolean) as WindData[];
  }

  private static averageDirection(directions: number[]): number {
    const x = directions.reduce((sum, dir) => sum + Math.cos(dir * Math.PI / 180), 0) / directions.length;
    const y = directions.reduce((sum, dir) => sum + Math.sin(dir * Math.PI / 180), 0) / directions.length;
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  }

  private static findClosestDataPoint(data: HistoryData[], targetTime: string, maxDiffMs: number): HistoryData | null {
    const targetTimestamp = new Date(targetTime).getTime();
    let closest: HistoryData | null = null;
    let minDiff = maxDiffMs;
    
    data.forEach(point => {
      const pointTimestamp = new Date(point.last_updated).getTime();
      const diff = Math.abs(pointTimestamp - targetTimestamp);
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    });
    
    return closest;
  }


}