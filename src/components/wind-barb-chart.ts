import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { WindData } from '../types';

Chart.register(...registerables);

@customElement('wind-barb-chart')
export class WindBarbChart extends LitElement {
  @property({ type: Array }) windData: WindData[] = [];
  @property({ type: Number }) height = 300;
  @property({ type: String }) primaryColor = '#1976d2';
  @property({ type: String }) secondaryColor = '#ff9800';
  @property({ type: String }) units = 'm/s';
  @property({ type: Number }) barbStemLength = 25;
  @property({ type: Number }) barbFlagLength = 12;
  @property({ type: Number }) barbLineWidth = 2;
  @property({ type: Number }) graphLineWidth = 2;
  @property({ type: String }) timeFormat = '24';
  @property({ type: Boolean }) showLegend = true;
  @property({ type: Boolean }) showYAxisLabel = false;
  @property({ type: Boolean }) hasGustEntity = false;

  @state() private chart?: Chart;

  static styles = css`
    :host {
      display: block;
      width: 100%;
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

    /* Custom legend styling */
    :host ::ng-deep .chartjs-legend ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      gap: 8px;
    }

    :host ::ng-deep .chartjs-legend li {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      font-weight: 500;
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
      afterDraw: (chart: Chart) => {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        
        if (!this.windData.length) return;
        
        ctx.save();
        
        // Split data for different barb spacing strategies
        const historicalData = this.windData.filter(d => !d.isForecast);
        const forecastData = this.windData.filter(d => d.isForecast);
        
        // Draw all forecast barbs (they're already sparse)
        forecastData.forEach(windPoint => {
          const x = xScale.getPixelForValue(windPoint.timestamp.getTime());
          const y = yScale.getPixelForValue(windPoint.speed);
          this.drawWindBarb(ctx, x, y, windPoint.direction, windPoint.speed, windPoint.isForecast);
        });
        
        // Draw historical barbs with spacing
        if (historicalData.length > 0) {
          const chartWidth = xScale.width;
          const maxHistoricalBarbs = Math.floor(chartWidth / 60); // 60px spacing for historical
          const step = Math.max(1, Math.ceil(historicalData.length / maxHistoricalBarbs));
          
          for (let i = 0; i < historicalData.length; i += step) {
            const windPoint = historicalData[i];
            const x = xScale.getPixelForValue(windPoint.timestamp.getTime());
            const y = yScale.getPixelForValue(windPoint.speed);
            this.drawWindBarb(ctx, x, y, windPoint.direction, windPoint.speed, windPoint.isForecast);
          }
        }
        
        ctx.restore();
      }
    };

    const presentMomentPlugin = {
      id: 'presentMoment',
      afterDraw: (chart: Chart) => {
        const ctx = chart.ctx;
        const now = new Date();
        
        // Find if 'now' falls within the chart time range
        const labels = chart.data.labels as Date[];
        if (!labels.length) return;
        
        const startTime = labels[0].getTime();
        const endTime = labels[labels.length - 1].getTime();
        const nowTime = now.getTime();
        
        if (nowTime >= startTime && nowTime <= endTime) {
          const xScale = chart.scales.x;
          const yScale = chart.scales.y;
          const x = xScale.getPixelForValue(nowTime);
          
          ctx.save();
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(x, yScale.top);
          ctx.lineTo(x, yScale.bottom);
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    const customLegendPlugin = {
      id: 'customLegend',
      beforeDraw: (chart: Chart) => {
        const ctx = chart.ctx;
        const datasets = chart.data.datasets;
        
        ctx.save();
        
        // Calculate total width needed for all legend items
        ctx.font = '11px sans-serif';
        let totalWidth = 0;
        const rectWidths: number[] = [];
        
        datasets.forEach((dataset) => {
          if (!dataset.label || dataset.label.trim() === '') return;
          const textWidth = ctx.measureText(dataset.label).width;
          const rectWidth = textWidth + 12;
          rectWidths.push(rectWidth);
          totalWidth += rectWidth;
        });
        totalWidth += (rectWidths.length - 1) * 10; // Add gaps
        
        // Start from right side
        let x = chart.width - totalWidth - 10;
        const y = 15;
        
        let rectIndex = 0;
        datasets.forEach((dataset) => {
          if (!dataset.label || dataset.label.trim() === '') return;
          
          const rectWidth = rectWidths[rectIndex];
          
          // Draw colored background rectangle
          ctx.fillStyle = dataset.borderColor as string;
          ctx.fillRect(x, y - 10, rectWidth, 16);
          
          // Draw white text
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(dataset.label, x + rectWidth/2, y + 2);
          
          x += rectWidth + 10; // Move to next legend item with gap
          rectIndex++;
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
          borderColor: this.primaryColor,
          backgroundColor: this.primaryColor + '20',
          borderWidth: this.graphLineWidth,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          order: 2
        }, {
          label: '',
          data: [],
          borderColor: this.primaryColor,
          backgroundColor: this.primaryColor + '10',
          borderWidth: this.graphLineWidth,
          borderDash: [5, 5],
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          order: 2
        }, ...(this.hasGustEntity ? [{
          label: `Wind Gusts (${this.units})`,
          data: [],
          borderColor: this.secondaryColor,
          backgroundColor: this.secondaryColor + '20',
          borderWidth: this.graphLineWidth,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5,
          order: 1
        }] : [])]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: this.showLegend ? 30 : 10 // Add space for legend if shown
          }
        },
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
                hour: (this.timeFormat === '12') ? 'h:mm a' : 'HH:mm',
                day: 'MMM dd'
              },
              tooltipFormat: (this.timeFormat === '12') ? 'MMM dd h:mm a' : 'MMM dd HH:mm'
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
              display: this.showYAxisLabel,
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
            display: false // Hide default legend
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const windPoint = this.windData[context.dataIndex];
                if (!windPoint) return '';
                
                const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                const dirIndex = Math.round(windPoint.direction / 45) % 8;
                
                return [
                  `Speed: ${Math.round(context.parsed.y || 0)} ${this.units}`,
                  `Direction: ${Math.round(windPoint.direction)}° (${directions[dirIndex]})`
                ];
              }
            }
          }
        }
      },
      plugins: [windBarbPlugin, presentMomentPlugin, ...(this.showLegend ? [customLegendPlugin] : [])]
    };

    this.chart = new Chart(canvas, config);
    this.updateChart();
  }

  private drawWindBarb(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    direction: number,
    speed: number,
    isForecast?: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);
    
    // Rotate barb - meteorological convention: barb points INTO wind
    const rotationRadians = (direction * Math.PI) / 180;
    ctx.rotate(rotationRadians);
    
    // Remove forecast styling from barbs (line will be dashed instead)
    // Wind barbs remain solid for both historical and forecast
    
    // Draw stem
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = this.barbLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -this.barbStemLength);
    ctx.stroke();
    
    // Draw flags at stem top
    ctx.translate(0, -this.barbStemLength);
    const speedKnots = speed * 1.944;
    this.drawBarbFlags(ctx, speedKnots, isForecast);
    ctx.restore();
  }

  private drawBarbFlags(ctx: CanvasRenderingContext2D, speedKnots: number, isForecast?: boolean): void {
    let remainingSpeed = Math.round(speedKnots);
    let yOffset = 0; // Start at stem top
    const barbColor = '#2e7d32';
    
    // Wind barb flags remain solid for both historical and forecast
    
    // 50-knot pennants
    while (remainingSpeed >= 50) {
      ctx.fillStyle = barbColor;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(this.barbFlagLength, yOffset);
      ctx.lineTo(0, yOffset + 6);
      ctx.closePath();
      ctx.fill();
      remainingSpeed -= 50;
      yOffset += 7;
    }
    
    // 10-knot flags
    while (remainingSpeed >= 10) {
      ctx.strokeStyle = barbColor;
      ctx.lineWidth = this.barbLineWidth;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(this.barbFlagLength, yOffset);
      ctx.stroke();
      remainingSpeed -= 10;
      yOffset += 4;
    }
    
    // 5-knot half-barbs
    if (remainingSpeed >= 5) {
      ctx.strokeStyle = barbColor;
      ctx.lineWidth = this.barbLineWidth;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(this.barbFlagLength / 2, yOffset);
      ctx.stroke();
    }
  }

  private updateChart(): void {
    if (!this.chart || !this.windData.length) return;

    // Split data into historical and forecast
    const historicalData = this.windData.filter(d => !d.isForecast);
    const forecastData = this.windData.filter(d => d.isForecast);
    
    const allLabels = this.windData.map(d => d.timestamp);
    
    // Historical speed data
    const historicalSpeed = this.windData.map(d => d.isForecast ? null : d.speed);
    
    // Forecast speed data  
    const forecastSpeed = this.windData.map(d => d.isForecast ? d.speed : null);
    
    // Gust data (only for historical)
    const gustData = this.windData.map(d => {
      if (!d.gust || d.isForecast) return null;
      
      const sustainedKnots = d.speed * 1.944;
      const gustKnots = d.gust * 1.944;
      const gustDiff = gustKnots - sustainedKnots;
      
      return gustDiff >= 10 ? d.gust : null;
    });

    this.chart.data.labels = allLabels;
    this.chart.data.datasets[0].data = historicalSpeed;
    this.chart.data.datasets[1].data = forecastSpeed;
    
    if (this.hasGustEntity && this.chart.data.datasets[2]) {
      this.chart.data.datasets[2].data = gustData;
    }

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