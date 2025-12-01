import { css } from 'lit';

export const windBarbCardStyles = css`
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