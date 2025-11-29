import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, WindBarbCardConfig, WindData, LovelaceCard } from './types';
import { HomeAssistantAPI } from './utils/ha-api';
import { WindBarbRenderer } from './utils/wind-barbs';
import './components/wind-chart';
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
      background: var(--ha-card-background, var(--card-background-color, white));
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

    .current-conditions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 8px;
    }

    .wind-barb-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .wind-values {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .wind-speed {
      font-size: 1.4em;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .wind-direction {
      font-size: 0.9em;
      color: var(--secondary-text-color);
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
      show_barbs: true,
      show_graph: true,
      barb_timeline: false,
      barb_size: 40,
      graph_height: 300,
      ...config
    };
  }

  getCardSize(): number {
    let size = 2; // Base size for current conditions
    if (this.config?.show_graph) size += 4;
    return size;
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

  private getCurrentWindData(): WindData | null {
    if (this.windData.length > 0) {
      return this.windData[this.windData.length - 1];
    }
    
    // Fallback to current state if no history data
    if (this.hass) {
      const directionEntity = this.hass.states[this.config.wind_direction_entity];
      const speedEntity = this.hass.states[this.config.wind_speed_entity];
      
      if (directionEntity && speedEntity) {
        const direction = parseFloat(directionEntity.state);
        const speed = parseFloat(speedEntity.state);
        
        if (!isNaN(direction) && !isNaN(speed)) {
          return {
            timestamp: new Date(),
            direction,
            speed
          };
        }
      }
    }
    
    return null;
  }

  private renderCurrentConditions(): any {
    const current = this.getCurrentWindData();
    if (!current) return null;

    const displaySpeed = this.convertToDisplayUnits(current.speed);
    const displayGust = current.gust ? this.convertToDisplayUnits(current.gust) : null;
    const units = this.config.units || 'm/s';

    const windBarb = this.config.show_barbs ? 
      WindBarbRenderer.createWindBarb(
        current.direction, 
        current.speed, 
        { 
          size: this.config.barb_size,
          color: this.config.theme?.primary_color || '#1976d2'
        }
      ) : null;

    return html`
      <div class="current-conditions">
        ${windBarb ? html`
          <div class="wind-barb-container">
            ${windBarb}
            <span class="wind-direction">${this.formatDirection(current.direction)}</span>
          </div>
        ` : ''}
        <div class="wind-values">
          <div class="wind-speed">${displaySpeed.toFixed(1)} ${units}</div>
          ${displayGust ? html`
            <div class="wind-direction">Gust: ${displayGust.toFixed(1)} ${units}</div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private convertToDisplayUnits(speedMs: number): number {
    if (!this.api) return speedMs;
    return this.api.convertWindSpeed(speedMs, 'm/s', this.config.units || 'm/s');
  }

  private formatDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return `${directions[index]} (${Math.round(degrees)}°)`;
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

    return html`
      <div class="card-header">
        ${this.config.name || 'Wind Barb Card'}
      </div>
      
      ${!this.config.barb_timeline ? this.renderCurrentConditions() : ''}
      
      ${this.config.show_graph ? html`
        <div class="chart-section">
          ${this.config.barb_timeline ? html`
            <wind-barb-chart
              .windData=${this.windData}
              .height=${this.config.graph_height}
              .units=${this.config.units || 'm/s'}
              .primaryColor=${this.config.theme?.primary_color || '#1976d2'}
            ></wind-barb-chart>
          ` : html`
            <wind-chart
              .windData=${this.windData}
              .height=${this.config.graph_height}
              .units=${this.config.units || 'm/s'}
              .primaryColor=${this.config.theme?.primary_color || '#1976d2'}
              .secondaryColor=${this.config.theme?.secondary_color || '#ff9800'}
            ></wind-chart>
          `}
        </div>
      ` : ''}
    `;
  }
}

// Register the card with Home Assistant
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'wind-barb-card',
  name: 'Wind Barb Card',
  description: 'A card for displaying wind data with barbs and time-series graphs'
});

declare global {
  interface HTMLElementTagNameMap {
    'wind-barb-card': WindBarbCard;
  }
}