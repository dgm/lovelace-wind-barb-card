import { html, TemplateResult } from 'lit';
import { TimePreset } from '../types';

export class WindBarbCardTemplates {
  static renderTimePresets(
    showTimePresets: boolean,
    presets: TimePreset[],
    currentStart: string | undefined,
    onPresetClick: (preset: TimePreset) => void
  ): TemplateResult | string {
    if (!showTimePresets) return '';
    
    return html`
      <div class="time-presets">
        ${presets.map(preset => html`
          <button 
            class="preset-button ${currentStart === preset.start ? 'active' : ''}"
            @click=${() => onPresetClick(preset)}
          >
            ${preset.label}
          </button>
        `)}
      </div>
    `;
  }

  static renderForecastToggle(
    hasForecastEntity: boolean,
    showForecast: boolean,
    onToggle: () => void
  ): TemplateResult | string {
    if (!hasForecastEntity) return '';
    
    return html`
      <div class="time-presets">
        <button 
          class="preset-button ${showForecast ? 'active' : ''}"
          @click=${onToggle}
        >
          Forecast ${showForecast ? 'ON' : 'OFF'}
        </button>
      </div>
    `;
  }

  static renderWindowControl(
    showWindowControl: boolean,
    currentWindow: string,
    onWindowChange: (event: Event) => void
  ): TemplateResult | string {
    if (!showWindowControl) return '';
    
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
          @input=${onWindowChange}
        >
      </div>
    `;
  }

  static renderLoadingState(): TemplateResult {
    return html`<div class="loading">Loading wind data...</div>`;
  }

  static renderErrorState(error: string): TemplateResult {
    return html`<div class="error">${error}</div>`;
  }

  static renderNoDataState(
    directionEntity: string,
    speedEntity: string
  ): TemplateResult {
    return html`
      <div class="no-data">
        <div>No historical wind data available</div>
        <div style="font-size: 0.8em; margin-top: 8px; color: var(--secondary-text-color);">
          Check browser console for details. Current entities:
          <br>Direction: ${directionEntity}
          <br>Speed: ${speedEntity}
        </div>
      </div>
    `;
  }
}