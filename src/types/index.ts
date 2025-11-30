export interface HomeAssistant {
  callWS: (msg: any) => Promise<any>;
  callApi: (method: string, path: string, parameters?: any) => Promise<any>;
  states: { [entity_id: string]: HassEntity };
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: { [key: string]: any };
  last_changed: string;
  last_updated: string;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: WindBarbCardConfig): void;
  getCardSize(): number;
}

export interface TimeRangeConfig {
  start: string; // ISO datetime or relative (-24h)
  end: string; // ISO datetime or "now"
  interval?: string; // "auto" or fixed ("15min", "1hr", etc.)
  screen_multiplier?: {
    mobile?: number; // Max data points for mobile (< 400px)
    tablet?: number; // Max data points for tablet (400-800px)
    desktop?: number; // Max data points for desktop (> 800px)
  };
  sampling?: 'windowed_representative' | 'single_point';
  window_size?: string; // Time window around each sample point ("10min")
  min_interval?: string; // Minimum interval ("5min")
  max_interval?: string; // Maximum interval ("4hr")
  min_points?: number; // Minimum points required in window
}

export interface TimePreset {
  label: string;
  start: string;
  end: string;
  window_size?: string;
  interval?: string;
}

export interface WindBarbCardConfig {
  type: string;
  name?: string;
  wind_direction_entity: string;
  wind_speed_entity: string;
  wind_gust_entity?: string;
  time_period?: number; // hours - legacy support
  time_range?: TimeRangeConfig; // new time control
  show_time_presets?: boolean; // show preset buttons
  time_presets?: TimePreset[]; // custom presets
  show_window_control?: boolean; // show window size slider
  forecast_entity?: string; // NWS forecast entity
  forecast_hours?: number; // hours of forecast to show
  units?: 'mph' | 'kph' | 'm/s' | 'knots'; // display units
  barb_size?: number;
  graph_height?: number;
  barb_stem_length?: number;
  barb_flag_length?: number;
  barb_line_width?: number;
  graph_line_width?: number;
  time_format?: '12' | '24' | 12 | 24;
  show_legend?: boolean;
  show_y_axis_label?: boolean;
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    text_color?: string;
  };
}

export interface WindData {
  timestamp: Date;
  direction: number; // degrees
  speed: number; // m/s
  gust?: number; // m/s
  isForecast?: boolean; // true for forecast data
}

export interface TimeInterval {
  start: Date;
  end: Date;
  duration: number; // milliseconds
}

export interface HistoryData {
  entity_id: string;
  state: string;
  attributes: { [key: string]: any };
  last_changed: string;
  last_updated: string;
}