import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { WindData } from '../types';

Chart.register(...registerables);

@customElement('wind-chart')
export class WindChart extends LitElement {
  @property({ type: Array }) windData: WindData[] = [];
  @property({ type: Number }) height = 300;
  @property({ type: String }) primaryColor = '#1976d2';
  @property({ type: String }) secondaryColor = '#ff9800';
  @property({ type: String }) units = 'm/s';

  @state() private chart?: Chart;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    
    .chart-container {
      position: relative;
      width: 100%;
    }
    
    canvas {
      max-width: 100%;
    }
  `;

  protected firstUpdated(): void {
    this.createChart();
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('windData') && this.chart) {
      this.updateChart();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Wind Speed',
            data: [],
            borderColor: this.primaryColor,
            backgroundColor: this.primaryColor + '20',
            yAxisID: 'speed',
            tension: 0.1
          },
          {
            label: 'Wind Direction',
            data: [],
            borderColor: this.secondaryColor,
            backgroundColor: this.secondaryColor + '20',
            yAxisID: 'direction',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
              displayFormats: {
                hour: 'HH:mm',
                day: 'MMM dd'
              },
              tooltipFormat: 'MMM dd HH:mm'
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              maxTicksLimit: 12
            }
          },
          speed: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: `Speed (${this.units || 'm/s'})`
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          direction: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 360,
            title: {
              display: true,
              text: 'Direction (°)'
            },
            ticks: {
              callback: (value) => {
                const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                const index = Math.round((value as number) / 45) % 8;
                return directions[index];
              }
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                if (context.datasetIndex === 1) {
                  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                  const index = Math.round((context.parsed.y) / 45) % 8;
                  return `(${directions[index]})`;
                }
                return '';
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(canvas, config);
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart || !this.windData.length) return;

    const labels = this.windData.map(d => d.timestamp);
    const speedData = this.windData.map(d => d.speed);
    const directionData = this.windData.map(d => d.direction);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = speedData;
    this.chart.data.datasets[1].data = directionData;

    this.chart.update('none');
  }

  render() {
    return html`
      <div class="chart-container">
        <canvas style="height: ${this.height}px;"></canvas>
      </div>
    `;
  }
}