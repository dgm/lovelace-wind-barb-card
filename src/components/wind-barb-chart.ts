import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { WindData } from '../types';
import { WindBarbRenderer } from '../utils/wind-barbs';

Chart.register(...registerables);

@customElement('wind-barb-chart')
export class WindBarbChart extends LitElement {
  @property({ type: Array }) windData: WindData[] = [];
  @property({ type: Number }) height = 300;
  @property({ type: String }) primaryColor = '#1976d2';
  @property({ type: String }) units = 'm/s';

  @state() private chart?: Chart;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 300px;
    }
    
    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    canvas {
      width: 100% !important;
      height: 100% !important;
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

    const windBarbPlugin = {
      id: 'windBarbs',
      afterDraw: (chart: Chart) => { // afterDraw renders on top
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        
        ctx.save();
        ctx.globalCompositeOperation = 'source-over'; // Ensure barbs are on top
        
        meta.data.forEach((point, index) => {
          if (index >= this.windData.length) return;
          
          const windPoint = this.windData[index];
          const x = point.x;
          const y = point.y; // Position at wind speed value on line
          
          this.drawWindBarb(ctx, null, x, y, windPoint.direction, windPoint.speed);
        });
        
        ctx.restore();
      }
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: `Wind Speed (${this.units})`,
          data: [],
          borderColor: '#8e24aa', // Purple like NWS
          backgroundColor: '#8e24aa20',
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 2 // Behind barbs
        }, {
          label: `Wind Gusts (${this.units})`,
          data: [],
          borderColor: '#ff4444',
          backgroundColor: '#ff444420',
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5,
          order: 1 // Above wind speed line
        }]
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
          y: {
            title: {
              display: true,
              text: `Wind Speed (${this.units})`
            },
            grid: {
              color: 'rgba(0,0,0,0.2)',
              drawOnChartArea: true
            },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const windPoint = this.windData[context.dataIndex];
                if (!windPoint) return '';
                
                const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                const dirIndex = Math.round(windPoint.direction / 45) % 8;
                
                return [
                  `Speed: ${context.parsed.y.toFixed(1)} ${this.units}`,
                  `Direction: ${windPoint.direction}° (${directions[dirIndex]})`
                ];
              }
            }
          }
        }
      },
      plugins: [windBarbPlugin]
    };

    this.chart = new Chart(canvas, config);
    this.updateChart();
  }

  private drawWindBarb(
    ctx: CanvasRenderingContext2D, 
    barbSvg: SVGElement | null, 
    x: number, 
    y: number, 
    direction: number,
    speed: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    
    // Rotate barb - meteorological convention: barb points INTO wind
    const rotationRadians = (direction * Math.PI) / 180;
    ctx.rotate(rotationRadians);
    
    // Draw stem
    const stemLength = 25;
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stemLength);
    ctx.stroke();
    
    // Draw flags at stem top
    ctx.translate(0, -stemLength);
    const speedKnots = speed * 1.944;
    this.drawBarbFlags(ctx, speedKnots);
    ctx.restore();
  }

  private drawBarbFlags(ctx: CanvasRenderingContext2D, speedKnots: number): void {
    let remainingSpeed = Math.round(speedKnots);
    let yOffset = 0; // Start at stem top
    const barbColor = '#2e7d32';
    
    // 50-knot pennants
    while (remainingSpeed >= 50) {
      ctx.fillStyle = barbColor;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(12, yOffset); // Extend perpendicular to rotated stem
      ctx.lineTo(0, yOffset + 6);
      ctx.closePath();
      ctx.fill();
      remainingSpeed -= 50;
      yOffset += 7; // Move down stem for next flag
      
    }
    
    // 10-knot flags
    while (remainingSpeed >= 10) {
      ctx.strokeStyle = barbColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(12, yOffset); // Extend perpendicular to rotated stem
      ctx.stroke();
      remainingSpeed -= 10;
      yOffset += 4; // Move down stem for next flag
    }
    
    // 5-knot half-barbs
    if (remainingSpeed >= 5) {
      ctx.strokeStyle = barbColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(6, yOffset); // Extend perpendicular to rotated stem
      ctx.stroke();
    }
  }

  private updateChart(): void {
    if (!this.chart || !this.windData.length) return;

    const labels = this.windData.map(d => d.timestamp);
    const speedData = this.windData.map(d => d.speed);
    
    // Only show gusts when significantly higher than wind speed
    const gustData = this.windData.map(d => {
      if (!d.gust) return null;
      
      // Convert to same units for comparison (assuming mph threshold)
      const gustDiff = d.gust - d.speed;
      const thresholdMs = 2.24; // ~5 mph in m/s
      
      return gustDiff >= thresholdMs ? d.gust : null;
    });

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = speedData;
    this.chart.data.datasets[1].data = gustData;

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