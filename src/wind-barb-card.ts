import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, WindBarbCardConfig, WindData, LovelaceCard, TimeRangeConfig, TimePreset } from './types';
import { WindDataAPI } from './utils/ha-api';
import { Logger } from './utils/logger';
import { windBarbCardStyles } from './styles/wind-barb-card.styles';
import { WindBarbCardTemplates } from './templates/wind-barb-card.templates';
import './components/wind-barb-chart';

// Enable debug logging
Logger.setDebug(false);

@customElement('wind-barb-card')
export class WindBarbCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: WindBarbCardConfig;
  @state() private windData: WindData[] = [];
  @state() private allWindData: WindData[] = []; // Store all data
  @state() private loading = false;
  @state() private error?: string;
  @state() private showForecast = true;



  private debug(...args: any[]): void {
    Logger.debug('WindBarbCard', ...args);
  }

  private api?: WindDataAPI;
  private updateInterval?: number;

  static styles = windBarbCardStyles;

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
        this.api = new WindDataAPI(this.hass);
        this.refreshData();
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

  private async refreshData(): Promise<void> {
    if (!this.api || !this.config) return;

    this.loading = true;
    this.error = undefined;

    try {
      // Store original time range - this should NEVER change
      const originalTimeRange = { ...this.config.time_range! };
      
      this.debug('=== FETCH WIND DATA START ===');
      this.debug('Original time range:', originalTimeRange);
      this.debug('Forecast enabled:', this.showForecast);
      
      // Fetch forecast data first
      let allForecastData: WindData[] = [];
      if (this.config.forecast_direction_entity && this.config.forecast_speed_entity) {
        allForecastData = await this.api.fetchTimeSeriesForecast(
          this.config.forecast_direction_entity,
          this.config.forecast_speed_entity,
          this.config.forecast_hours || 48
        );
      }
      
      // Calculate display time range (extend to include available forecast)
      let displayTimeRange = originalTimeRange;
      const hasForecast = !!(this.config.forecast_direction_entity && this.config.forecast_speed_entity);
      if (hasForecast && this.showForecast && allForecastData.length > 0) {
        // Extend to include first few hours of forecast
        const forecastHours = Math.min(6, this.config.forecast_hours || 48); // Max 6 hours
        const extendedEnd = new Date(Date.now() + (forecastHours * 60 * 60 * 1000));
        
        displayTimeRange = {
          ...originalTimeRange,
          end: extendedEnd.toISOString()
        };
        
        this.debug('Extended display range:', displayTimeRange);
        this.debug('Extension duration (hours):', forecastHours);
      }
      
      // Fetch historical data using ORIGINAL time range
      this.debug('Fetching historical data with original range');
      const historicalData = await this.api.fetchWindData(
        this.config.wind_direction_entity,
        this.config.wind_speed_entity,
        this.config.wind_gust_entity,
        originalTimeRange
      );
      
      this.debug('Historical data points:', historicalData.length);
      if (historicalData.length > 0) {
        this.debug('Historical range:', historicalData[0].timestamp, 'to', historicalData[historicalData.length - 1].timestamp);
      }
      
      // Filter forecast data to display window (already fetched above)
      let forecastData: WindData[] = [];
      if (hasForecast && allForecastData) {
        
        // Filter forecast to fit display window (include recent past data)
        const displayStart = new Date(Date.now() - 2 * 60 * 60 * 1000); // Include last 2 hours
        const displayEnd = new Date(displayTimeRange.end);
        
        this.debug('All forecast data points:', allForecastData.length);
        this.debug('Display window:', displayStart, 'to', displayEnd);
        if (allForecastData.length > 0) {
          this.debug('First forecast:', allForecastData[0].timestamp);
          this.debug('Last forecast:', allForecastData[allForecastData.length - 1].timestamp);
        }
        
        forecastData = allForecastData.filter(d => 
          d.timestamp >= displayStart && d.timestamp <= displayEnd
        );
        
        this.debug('Filtered forecast data points:', forecastData.length);
        if (forecastData.length > 0) {
          this.debug('Forecast range:', forecastData[0].timestamp, 'to', forecastData[forecastData.length - 1].timestamp);
        }
      }
      
      // Store all data and update display
      this.allWindData = [...historicalData, ...forecastData];
      this.updateDisplayData();
      
      // Update config with display time range for chart
      this.config = {
        ...this.config,
        time_range: displayTimeRange
      };
      
      this.debug('Final wind data points:', this.windData.length);
      this.debug('=== FETCH WIND DATA END ===');
      
      if (this.windData.length === 0) {
        this.error = 'No historical data available. Check entity names and history retention.';
      }
    } catch (err) {
      this.error = `Failed to fetch wind data: ${err}`;
      this.debug('Wind data fetch error:', err);
    } finally {
      this.loading = false;
    }
  }



  private startAutoUpdate(): void {
    // Update every 5 minutes
    this.updateInterval = window.setInterval(() => {
      this.refreshData();
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
    
    this.refreshData();
  }

  private renderTimePresets() {
    const presets = this.config.time_presets || this.getDefaultPresets();
    const currentStart = this.config.time_range?.start;
    
    return WindBarbCardTemplates.renderTimePresets(
      !!this.config.show_time_presets,
      presets,
      currentStart,
      (preset) => this.handlePresetClick(preset)
    );
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
    
    this.refreshData();
  }

  private handleForecastToggle(): void {
    this.showForecast = !this.showForecast;
    this.updateDisplayData();
  }

  private updateDisplayData(): void {
    const filteredForecastData = this.showForecast ? 
      this.allWindData.filter(d => d.isForecast) : [];
    const historicalData = this.allWindData.filter(d => !d.isForecast);
    this.windData = [...historicalData, ...filteredForecastData];
  }

  private renderForecastToggle() {
    const hasForecast = !!(this.config.forecast_direction_entity && this.config.forecast_speed_entity);
    return WindBarbCardTemplates.renderForecastToggle(
      hasForecast,
      this.showForecast,
      () => this.handleForecastToggle()
    );
  }

  private renderWindowControl() {
    const currentWindow = this.config.time_range?.window_size || '10min';
    
    return WindBarbCardTemplates.renderWindowControl(
      !!this.config.show_window_control,
      currentWindow,
      (event) => this.handleWindowSizeChange(event)
    );
  }



  render() {
    if (this.loading && !this.windData.length) {
      return WindBarbCardTemplates.renderLoadingState();
    }

    if (this.error && !this.windData.length) {
      return WindBarbCardTemplates.renderErrorState(this.error);
    }

    if (!this.windData.length && !this.loading) {
      return WindBarbCardTemplates.renderNoDataState(
        this.config.wind_direction_entity,
        this.config.wind_speed_entity
      );
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
        ${this.renderForecastToggle()}
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