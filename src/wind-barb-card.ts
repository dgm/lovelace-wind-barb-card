import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, WindBarbCardConfig, WindData, LovelaceCard, TimeRangeConfig, TimePreset } from './types';
import { HomeAssistantAPI } from './utils/ha-api';
import './components/wind-barb-chart';

@customElement('wind-barb-card')
export class WindBarbCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: WindBarbCardConfig;
  @state() private windData: WindData[] = [];
  @state() private loading = false;
  @state() private error?: string;

  private api?: HomeAssistantAPI;
  private updateInterval?: number;

  static styles = css`
    :host {
      display: block;
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
      padding: 16px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 1.2em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .chart-section {
      margin-top: 16px;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
      color: var(--secondary-text-color);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      right: 0;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 0 0 0 8px;
      font-size: 0.8em;
      z-index: 10;
    }

    .chart-container {
      position: relative;
    }

    .error {
      color: var(--error-color, #f44336);
      text-align: center;
      padding: 16px;
      background: var(--error-color, #f44336)10;
      border-radius: 4px;
    }

    .no-data {
      text-align: center;
      color: var(--secondary-text-color);
      padding: 32px;
    }

    .time-presets {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .preset-button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s;
    }

    .preset-button:hover {
      background: var(--primary-color);
      color: white;
    }

    .preset-button.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .window-control {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      font-size: 0.9em;
    }

    .window-slider {
      flex: 1;
      max-width: 200px;
    }

    .window-label {
      color: var(--secondary-text-color);
      min-width: 80px;
    }
  `;

  setConfig(config: WindBarbCardConfig): void {
    if (!config.wind_direction_entity || !config.wind_speed_entity) {
      throw new Error('wind_direction_entity and wind_speed_entity are required');
    }

    // Set defaults with backward compatibility
    const defaultTimeRange: TimeRangeConfig = {
      start: '-24h',
      end: 'now',
      interval: 'auto',
      sampling: 'windowed_representative',
      window_size: '10min',
      min_interval: '5min',
      max_interval: '4h',
      min_points: 3,
      screen_multiplier: {
        mobile: 8,
        tablet: 8,
        desktop: 8
      }
    };

    this.config = {
      time_period: 24, // Legacy default
      units: 'm/s',
      barb_size: 40,
      graph_height: 300,
      barb_stem_length: 25,
      barb_flag_length: 12,
      barb_line_width: 2,
      graph_line_width: 2,
      time_format: '24',
      show_legend: true,
      show_y_axis_label: false,
      show_time_presets: false,
      show_window_control: false,
      time_range: defaultTimeRange,
      ...config
    };

    // Convert legacy time_period to time_range if no time_range specified
    if (!config.time_range && config.time_period) {
      this.config.time_range = {
        ...defaultTimeRange,
        start: `-${config.time_period}h`
      };
    }

    // Auto-apply first preset if using defaults and presets are enabled
    if (!config.time_range?.interval || config.time_range.interval === 'auto') {
      if (this.config.show_time_presets) {
        const firstPreset = (this.config.time_presets || this.getDefaultPresets())[0];
        if (firstPreset) {
          this.config.time_range = {
            ...this.config.time_range!,
            start: firstPreset.start,
            end: firstPreset.end,
            interval: firstPreset.interval,
            window_size: firstPreset.window_size
          };
        }
      }
    }
  }

  getCardSize(): number {
    return 6; // Fixed size for meteogram
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    
    if (changedProperties.has('hass') && this.hass) {
      if (!this.api) {
        this.api = new HomeAssistantAPI(this.hass);
        this.fetchWindData();
        this.startAutoUpdate();
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private async fetchWindData(): Promise<void> {
    if (!this.api || !this.config) return;

    this.loading = true;
    this.error = undefined;

    try {
      console.log('Fetching wind data for entities:', {
        direction: this.config.wind_direction_entity,
        speed: this.config.wind_speed_entity,
        timeRange: this.config.time_range
      });
      
      let data: WindData[];
      
      if (this.config.time_range) {
        data = await this.api.fetchWindDataWithTimeRange(
          this.config.wind_direction_entity,
          this.config.wind_speed_entity,
          this.config.wind_gust_entity,
          this.config.time_range
        );
      } else {
        // Fallback to legacy method
        data = await this.api.fetchWindData(
          this.config.wind_direction_entity,
          this.config.wind_speed_entity,
          this.config.wind_gust_entity,
          this.config.time_period || 24
        );
      }
      
      console.log('Fetched wind data points:', data.length);
      this.windData = data;
      
      if (data.length === 0) {
        this.error = 'No historical data available. Check entity names and history retention.';
      }
    } catch (err) {
      this.error = `Failed to fetch wind data: ${err}`;
      console.error('Wind data fetch error:', err);
    } finally {
      this.loading = false;
    }
  }

  private startAutoUpdate(): void {
    // Update every 5 minutes
    this.updateInterval = window.setInterval(() => {
      this.fetchWindData();
    }, 5 * 60 * 1000);
  }

  private getDefaultPresets(): TimePreset[] {
    return [
      { label: '6h', start: '-6h', end: 'now', interval: '45min', window_size: '15min' },
      { label: '12h', start: '-12h', end: 'now', interval: '90min', window_size: '30min' },
      { label: '24h', start: '-24h', end: 'now', interval: '3h', window_size: '1h' },
      { label: '48h', start: '-48h', end: 'now', interval: '6h', window_size: '2h' }
    ];
  }

  private handlePresetClick(preset: TimePreset): void {
    if (!this.config.time_range) return;
    
    this.config = {
      ...this.config,
      time_range: {
        ...this.config.time_range,
        start: preset.start,
        end: preset.end,
        interval: preset.interval || this.config.time_range.interval,
        window_size: preset.window_size || this.config.time_range.window_size
      }
    };
    
    this.fetchWindData();
  }

  private renderTimePresets() {
    if (!this.config.show_time_presets) return '';
    
    const presets = this.config.time_presets || this.getDefaultPresets();
    const currentStart = this.config.time_range?.start;
    
    return html`
      <div class="time-presets">
        ${presets.map(preset => html`
          <button 
            class="preset-button ${currentStart === preset.start ? 'active' : ''}"
            @click=${() => this.handlePresetClick(preset)}
          >
            ${preset.label}
          </button>
        `)}
      </div>
    `;
  }

  private handleWindowSizeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const minutes = parseInt(target.value);
    
    if (!this.config.time_range) return;
    
    this.config = {
      ...this.config,
      time_range: {
        ...this.config.time_range,
        window_size: `${minutes}min`
      }
    };
    
    this.fetchWindData();
  }

  private renderWindowControl() {
    if (!this.config.show_window_control) return '';
    
    const currentWindow = this.config.time_range?.window_size || '10min';
    const minutes = parseInt(currentWindow.replace('min', ''));
    
    return html`
      <div class="window-control">
        <span class="window-label">Smoothing: ${currentWindow}</span>
        <input 
          type="range" 
          class="window-slider"
          min="1" 
          max="60" 
          step="1"
          .value=${minutes.toString()}
          @input=${this.handleWindowSizeChange}
        >
      </div>
    `;
  }



  render() {
    if (this.loading && !this.windData.length) {
      return html`<div class="loading">Loading wind data...</div>`;
    }

    if (this.error && !this.windData.length) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (!this.windData.length && !this.loading) {
      return html`
        <div class="no-data">
          <div>No historical wind data available</div>
          <div style="font-size: 0.8em; margin-top: 8px; color: var(--secondary-text-color);">
            Check browser console for details. Current entities:
            <br>Direction: ${this.config.wind_direction_entity}
            <br>Speed: ${this.config.wind_speed_entity}
          </div>
        </div>
      `;
    }

    const cardStyle = this.config.theme?.background_color ? 
      `background: ${this.config.theme.background_color};` : 
      `background: var(--ha-card-background, var(--card-background-color, white));`;
    
    const titleStyle = this.config.theme?.text_color ? 
      `color: ${this.config.theme.text_color};` : 
      `color: var(--primary-text-color);`;

    return html`
      <div style="${cardStyle}">
        <div class="card-header" style="${titleStyle}">
          ${this.config.name || 'Wind Barb Card'}
        </div>
        
        <div class="chart-section">
          <div class="chart-container">
            ${this.loading ? html`<div class="loading-overlay">Updating...</div>` : ''}
            <wind-barb-chart
            .windData=${this.windData}
            .height=${this.config.graph_height}
            .units=${this.config.units || 'm/s'}
            .primaryColor=${this.config.theme?.primary_color || '#1976d2'}
            .secondaryColor=${this.config.theme?.secondary_color || '#ff9800'}
            .barbStemLength=${this.config.barb_stem_length}
            .barbFlagLength=${this.config.barb_flag_length}
            .barbLineWidth=${this.config.barb_line_width}
            .graphLineWidth=${this.config.graph_line_width}
            .timeFormat=${this.config.time_format}
            .showLegend=${this.config.show_legend}
            .showYAxisLabel=${this.config.show_y_axis_label}
            .hasGustEntity=${!!this.config.wind_gust_entity}
          ></wind-barb-chart>
          </div>
        </div>
        
        ${this.renderTimePresets()}
        ${this.renderWindowControl()}
      </div>
    `;
  }
}

// Register the card with Home Assistant
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'wind-barb-card',
  name: 'Wind Barb Card',
  description: 'A meteogram card for displaying wind data with barbs on timeline'
});

declare global {
  interface HTMLElementTagNameMap {
    'wind-barb-card': WindBarbCard;
  }
}