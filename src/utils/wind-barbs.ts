/**
 * Wind barb utilities for meteorological wind visualization
 */

export interface WindBarbOptions {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export class WindBarbRenderer {
  private static readonly STEM_LENGTH = 30;
  private static readonly FLAG_LENGTH = 15;

  static createWindBarb(
    direction: number, 
    speed: number, 
    options: WindBarbOptions = {}
  ): SVGElement {
    const { size = 40, color = '#333', strokeWidth = 2 } = options;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size.toString());
    svg.setAttribute('height', size.toString());
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${size/2}, ${size/2}) rotate(${direction})`);
    
    // Main shaft (longer stem)
    const shaft = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    shaft.setAttribute('x1', '0');
    shaft.setAttribute('y1', '0');
    shaft.setAttribute('x2', '0');
    shaft.setAttribute('y2', (-this.STEM_LENGTH).toString());
    shaft.setAttribute('stroke', color);
    shaft.setAttribute('stroke-width', strokeWidth.toString());
    g.appendChild(shaft);
    
    // Add barbs based on wind speed (knots conversion)
    const speedKnots = speed * 1.944; // m/s to knots
    this.addBarbs(g, speedKnots, color, strokeWidth);
    
    svg.appendChild(g);
    return svg;
  }

  private static addBarbs(
    g: SVGGElement, 
    speedKnots: number, 
    color: string, 
    strokeWidth: number
  ): void {
    let remainingSpeed = Math.round(speedKnots);
    let yOffset = -this.STEM_LENGTH + 5;
    
    // 50-knot pennants (triangular flags)
    while (remainingSpeed >= 50) {
      this.addPennant(g, yOffset, color, strokeWidth);
      remainingSpeed -= 50;
      yOffset += 6;
    }
    
    // 10-knot flags (full barbs)
    while (remainingSpeed >= 10) {
      this.addFlag(g, yOffset, color, strokeWidth);
      remainingSpeed -= 10;
      yOffset += 4;
    }
    
    // 5-knot half-barbs
    if (remainingSpeed >= 5) {
      this.addHalfBarb(g, yOffset, color, strokeWidth);
    }
  }

  private static addPennant(
    g: SVGGElement, 
    yOffset: number, 
    color: string, 
    strokeWidth: number
  ): void {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M 0,${yOffset} L ${this.FLAG_LENGTH},${yOffset-3} L 0,${yOffset-6} Z`);
    path.setAttribute('fill', color);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', strokeWidth.toString());
    g.appendChild(path);
  }

  private static addFlag(
    g: SVGGElement, 
    yOffset: number, 
    color: string, 
    strokeWidth: number
  ): void {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', yOffset.toString());
    line.setAttribute('x2', this.FLAG_LENGTH.toString());
    line.setAttribute('y2', (yOffset - 3).toString());
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', strokeWidth.toString());
    g.appendChild(line);
  }

  private static addHalfBarb(
    g: SVGGElement, 
    yOffset: number, 
    color: string, 
    strokeWidth: number
  ): void {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', yOffset.toString());
    line.setAttribute('x2', (this.FLAG_LENGTH / 2).toString());
    line.setAttribute('y2', (yOffset - 1.5).toString());
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', strokeWidth.toString());
    g.appendChild(line);
  }
}