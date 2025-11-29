import { HomeAssistant, HistoryData, WindData } from '../types';

export class HomeAssistantAPI {
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
      console.log('Fetching history from path:', path);
      const result = await this.hass.callApi('GET', path);
      console.log('History API response length:', result?.length || 0);
      if (result && result.length > 0) {
        result.forEach((entityData, i) => {
          console.log(`Entity ${i} (${entityData[0]?.entity_id}): ${entityData.length} points`);
        });
      }
      return result || [];
    } catch (error) {
      console.error('Failed to fetch history data:', error);
      return [];
    }
  }

  async fetchWindData(
    directionEntity: string,
    speedEntity: string,
    gustEntity?: string,
    hours: number = 24
  ): Promise<WindData[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
    
    const entities = [directionEntity, speedEntity];
    if (gustEntity) entities.push(gustEntity);
    
    const historyData = await this.fetchHistory(entities, startTime, endTime);
    const rawData = this.processWindHistory(historyData, directionEntity, speedEntity, gustEntity);
    
    // Aggregate into hourly bins
    return this.aggregateWindData(rawData, hours);
  }
  
  private aggregateWindData(data: WindData[], totalHours: number): WindData[] {
    if (data.length === 0) return data;
    
    const binCount = Math.min(12, Math.ceil(totalHours / 2)); // Max 12 bins, 2+ hours each
    const binSizeMs = (totalHours * 60 * 60 * 1000) / binCount;
    const startTime = new Date().getTime() - (totalHours * 60 * 60 * 1000);
    
    const bins: WindData[][] = Array(binCount).fill(null).map(() => []);
    
    // Sort data into bins
    data.forEach(point => {
      const binIndex = Math.floor((point.timestamp.getTime() - startTime) / binSizeMs);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].push(point);
      }
    });
    
    // Average each bin
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
  
  private averageDirection(directions: number[]): number {
    // Convert to vectors, average, convert back
    const x = directions.reduce((sum, dir) => sum + Math.cos(dir * Math.PI / 180), 0) / directions.length;
    const y = directions.reduce((sum, dir) => sum + Math.sin(dir * Math.PI / 180), 0) / directions.length;
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  }

  private processWindHistory(
    historyData: HistoryData[][],
    directionEntity: string,
    speedEntity: string,
    gustEntity?: string
  ): WindData[] {
    const windData: WindData[] = [];
    
    if (historyData.length === 0) return windData;
    
    // Find data arrays for each entity
    const directionData = historyData.find(data => 
      data.length > 0 && data[0].entity_id === directionEntity
    ) || [];
    
    const speedData = historyData.find(data => 
      data.length > 0 && data[0].entity_id === speedEntity
    ) || [];
    
    const gustData = gustEntity ? historyData.find(data => 
      data.length > 0 && data[0].entity_id === gustEntity
    ) || [] : [];
    
    console.log('Processing history data:', {
      directionPoints: directionData.length,
      speedPoints: speedData.length,
      gustPoints: gustData.length
    });
    
    // Use all speed data points as base, find closest direction
    speedData.forEach(speedPoint => {
      const speed = parseFloat(speedPoint.state);
      if (isNaN(speed)) return;
      
      const timestamp = new Date(speedPoint.last_updated);
      
      // Find closest direction point (within 10 minutes)
      const directionPoint = this.findClosestDataPoint(
        directionData, 
        speedPoint.last_updated, 
        10 * 60 * 1000 // 10 minutes in ms
      );
      
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
    
    // Sort by timestamp
    windData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    console.log('Processed wind data points:', windData.length);
    return windData;
  }
  
  private findClosestDataPoint(
    data: HistoryData[], 
    targetTime: string, 
    maxDiffMs: number
  ): HistoryData | null {
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

  convertWindSpeed(speed: number, fromUnit: string, toUnit: string = 'm/s'): number {
    // Convert to m/s first
    let speedMs = speed;
    
    switch (fromUnit.toLowerCase()) {
      case 'mph':
        speedMs = speed * 0.44704;
        break;
      case 'kph':
      case 'km/h':
        speedMs = speed * 0.277778;
        break;
      case 'knots':
      case 'kt':
        speedMs = speed * 0.514444;
        break;
      case 'm/s':
        speedMs = speed;
        break;
    }
    
    // Convert from m/s to target unit
    switch (toUnit.toLowerCase()) {
      case 'mph':
        return speedMs / 0.44704;
      case 'kph':
      case 'km/h':
        return speedMs / 0.277778;
      case 'knots':
      case 'kt':
        return speedMs / 0.514444;
      case 'm/s':
      default:
        return speedMs;
    }
  }
}