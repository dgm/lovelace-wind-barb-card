import { WindData, TimeRangeConfig, TimeInterval } from '../types';
import { TimeRangeUtils } from './time-range';

export interface SamplingStrategy {
  sample(data: WindData[], timeRange: TimeInterval, intervalMs: number, config?: TimeRangeConfig): WindData[];
}

export class SinglePointSampler implements SamplingStrategy {
  sample(data: WindData[], timeRange: TimeInterval, intervalMs: number): WindData[] {
    const sampleTimes = TimeRangeUtils.generateSampleTimes(timeRange, intervalMs);
    return sampleTimes.map(sampleTime => {
      const closest = data.reduce((prev, curr) => 
        Math.abs(curr.timestamp.getTime() - sampleTime.getTime()) < 
        Math.abs(prev.timestamp.getTime() - sampleTime.getTime()) ? curr : prev
      );
      return { ...closest, timestamp: sampleTime };
    }).filter(Boolean);
  }
}

export class WindowedRepresentativeSampler implements SamplingStrategy {
  sample(data: WindData[], timeRange: TimeInterval, intervalMs: number, config?: TimeRangeConfig): WindData[] {
    const windowSizeMs = config?.window_size ? 
      TimeRangeUtils.parseDuration(config.window_size) : 10 * 60 * 1000;
    const minPoints = config?.min_points || 3;
    
    const sampleTimes = TimeRangeUtils.generateSampleTimes(timeRange, intervalMs);
    const sampledData: WindData[] = [];
    
    sampleTimes.forEach(sampleTime => {
      const windowStart = sampleTime.getTime() - windowSizeMs / 2;
      const windowEnd = sampleTime.getTime() + windowSizeMs / 2;
      
      const windowData = data.filter(point => {
        const time = point.timestamp.getTime();
        return time >= windowStart && time <= windowEnd;
      });
      
      if (windowData.length >= minPoints) {
        const speeds = windowData.map(p => p.speed).sort((a, b) => a - b);
        const directions = windowData.map(p => p.direction);
        const gusts = windowData.filter(p => p.gust).map(p => p.gust!).sort((a, b) => a - b);
        
        const medianSpeed = speeds[Math.floor(speeds.length / 2)];
        const avgDirection = this.averageDirection(directions);
        const medianGust = gusts.length > 0 ? gusts[Math.floor(gusts.length / 2)] : undefined;
        
        sampledData.push({
          timestamp: sampleTime,
          speed: medianSpeed,
          direction: avgDirection,
          gust: medianGust
        });
      } else if (windowData.length > 0) {
        const closest = windowData.reduce((prev, curr) => 
          Math.abs(curr.timestamp.getTime() - sampleTime.getTime()) < 
          Math.abs(prev.timestamp.getTime() - sampleTime.getTime()) ? curr : prev
        );
        
        sampledData.push({
          ...closest,
          timestamp: sampleTime
        });
      }
    });
    
    return sampledData;
  }

  private averageDirection(directions: number[]): number {
    const x = directions.reduce((sum, dir) => sum + Math.cos(dir * Math.PI / 180), 0) / directions.length;
    const y = directions.reduce((sum, dir) => sum + Math.sin(dir * Math.PI / 180), 0) / directions.length;
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  }
}

export class SamplingStrategyFactory {
  static create(samplingType?: string): SamplingStrategy {
    switch (samplingType) {
      case 'windowed_representative':
        return new WindowedRepresentativeSampler();
      case 'single_point':
      default:
        return new SinglePointSampler();
    }
  }
}