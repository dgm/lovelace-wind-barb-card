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

export interface WindBarbCardConfig {
  type: string;
  name?: string;
  wind_direction_entity: string;
  wind_speed_entity: string;
  wind_gust_entity?: string;
  time_period?: number; // hours
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
}

export interface HistoryData {
  entity_id: string;
  state: string;
  attributes: { [key: string]: any };
  last_changed: string;
  last_updated: string;
}