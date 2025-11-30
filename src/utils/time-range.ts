import { TimeRangeConfig, TimeInterval } from '../types';

export class TimeRangeUtils {
  static parseTimeRange(config: TimeRangeConfig): TimeInterval {
    const end = this.parseEndTime(config.end);
    const start = this.parseStartTime(config.start, end);
    
    if (start.getTime() >= end.getTime()) {
      throw new Error(`Start time (${start.toISOString()}) must be before end time (${end.toISOString()})`);
    }
    
    return {
      start,
      end,
      duration: end.getTime() - start.getTime()
    };
  }

  static parseEndTime(endStr: string): Date {
    if (endStr === 'now') {
      return new Date();
    }
    if (endStr.startsWith('-')) {
      const duration = this.parseDuration(endStr.substring(1));
      return new Date(Date.now() - duration);
    }
    return new Date(endStr);
  }

  static parseStartTime(startStr: string, endTime: Date): Date {
    if (startStr.startsWith('-')) {
      const duration = this.parseDuration(startStr.substring(1));
      return new Date(endTime.getTime() - duration);
    }
    return new Date(startStr);
  }

  static parseDuration(durationStr: string): number {
    const match = durationStr.match(/^(\d+(?:\.\d+)?)(min|h|d)$/);
    if (!match) throw new Error(`Invalid duration format: ${durationStr}`);
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'min': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Unknown duration unit: ${unit}`);
    }
  }

  static calculateOptimalInterval(
    timeRange: TimeInterval, 
    config: TimeRangeConfig,
    screenWidth: number = window.innerWidth
  ): number {
    const { interval, screen_multiplier, min_interval, max_interval } = config;
    
    if (interval && interval !== 'auto') {
      return this.parseDuration(interval);
    }

    // Determine screen category and multiplier
    const multipliers = {
      mobile: screen_multiplier?.mobile || 20,
      tablet: screen_multiplier?.tablet || 40,
      desktop: screen_multiplier?.desktop || 80
    };

    let maxPoints: number;
    if (screenWidth < 400) maxPoints = multipliers.mobile;
    else if (screenWidth < 800) maxPoints = multipliers.tablet;
    else maxPoints = multipliers.desktop;

    // Calculate base interval
    let calculatedInterval = timeRange.duration / maxPoints;

    // Apply constraints
    if (min_interval) {
      const minMs = this.parseDuration(min_interval);
      calculatedInterval = Math.max(calculatedInterval, minMs);
    }
    
    if (max_interval) {
      const maxMs = this.parseDuration(max_interval);
      calculatedInterval = Math.min(calculatedInterval, maxMs);
    }

    return calculatedInterval;
  }

  static generateSampleTimes(timeRange: TimeInterval, intervalMs: number): Date[] {
    const times: Date[] = [];
    
    // Start from the first hour boundary at or after the start time
    const startTime = new Date(timeRange.start);
    const firstHour = new Date(startTime);
    firstHour.setMinutes(0, 0, 0); // Round down to hour
    if (firstHour < startTime) {
      firstHour.setHours(firstHour.getHours() + 1); // Move to next hour if needed
    }
    
    let current = firstHour.getTime();
    const endTime = timeRange.end.getTime();
    
    while (current <= endTime) {
      times.push(new Date(current));
      current += intervalMs;
    }
    
    return times;
  }
}