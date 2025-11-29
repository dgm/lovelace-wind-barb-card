import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, WindBarbCardConfig, WindData, LovelaceCard } from './types';
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
  `;

  setConfig(config: WindBarbCardConfig): void {
    if (!config.wind_direction_entity || !config.wind_speed_entity) {
      throw new Error('wind_direction_entity and wind_speed_entity are required');
    }

    this.config = {
      time_period: 48, // Default to 48 hours for more data
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
      ...config
    };
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
        period: this.config.time_period
      });
      
      const data = await this.api.fetchWindData(
        this.config.wind_direction_entity,
        this.config.wind_speed_entity,
        this.config.wind_gust_entity,
        this.config.time_period
      );
      
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



  render() {
    if (this.loading) {
      return html`<div class="loading">Loading wind data...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (!this.windData.length) {
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