import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RadialGaugeSegment {
  from: number;
  to: number;
  color: string;
}

@Component({
  selector: 'lib-radial-gauge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radial-gauge.component.html',
  styleUrl: './radial-gauge.component.scss',
  host: { 
    role: 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()'
  },
})
export class RadialGaugeComponent {
  // Input signals
  readonly value = input(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly size = input(300);
  readonly outerThickness = input(36);
  readonly innerThickness = input(12);
  readonly gap = input(8);
  readonly segments = input<RadialGaugeSegment[]>();
  readonly labelFormatter = input<(value: number) => string>();
  readonly title = input('Gauge');
  readonly description = input('');
  readonly showValue = input(true);


  // Computed dimensions with dynamic padding for stroke thickness
  private readonly svgPadding = computed(() => Math.max(20, this.outerThickness() + 10)); // Dynamic padding based on stroke
  readonly svgWidth = computed(() => this.size() + this.svgPadding() * 2);
  readonly svgHeight = computed(() => Math.ceil(this.size() / 2 + this.svgPadding() + 40)); // Extra space for text label
  readonly centerX = computed(() => this.size() / 2 + this.svgPadding());
  readonly centerY = computed(() => this.size() / 2 + this.svgPadding());
  
  // Computed radii
  readonly outerRadius = computed(() => this.size() / 2 - Math.max(5, this.outerThickness() / 2)); // Account for stroke width
  readonly innerRadius = computed(() => this.outerRadius() - this.outerThickness());
  readonly legendOuterRadius = computed(() => this.innerRadius() - this.gap());
  readonly legendInnerRadius = computed(() => this.legendOuterRadius() - this.innerThickness());

  // Angle constants (semicircle from left to right)
  private readonly startAngle = -180;
  private readonly endAngle = 0;

  // Computed percentage based on input value
  private readonly percentage = computed(() => {
    const val = this.value();
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;
    if (range === 0) return 0;
    return this.clamp((val - minVal) / range, 0, 1);
  });

  // Default segments if none provided
  private readonly defaultSegments = computed<RadialGaugeSegment[]>(() => {
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;
    return [
      { 
        from: minVal, 
        to: minVal + 0.6 * range, 
        color: 'var(--gauge-value-critical, var(--mat-sys-error, #dc2626))' 
      },
      { 
        from: minVal + 0.6 * range, 
        to: minVal + 0.8 * range, 
        color: 'var(--gauge-value-warning, var(--mat-sys-secondary, #f59e0b))' 
      },
      { 
        from: minVal + 0.8 * range, 
        to: maxVal, 
        color: 'var(--gauge-value-good, var(--mat-sys-tertiary, #10b981))' 
      },
    ];
  });

  // Actual segments to use
  readonly actualSegments = computed(() => this.segments() || this.defaultSegments());

  // Computed display value
  readonly displayValue = computed(() => {
    const percentage = this.percentage();
    const minVal = this.min();
    const maxVal = this.max();
    return minVal + percentage * (maxVal - minVal);
  });

  // Formatted label
  readonly formattedLabel = computed(() => {
    const formatter = this.labelFormatter();
    const value = this.displayValue();
    if (formatter) {
      return formatter(value);
    }
    // Default formatting
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(1);
  });

  // Dynamic font size based on SVG size
  readonly fontSize = computed(() => {
    const width = this.svgWidth();
    return Math.max(16, Math.min(48, width * 0.12));
  });

  // Aria label for accessibility
  readonly ariaLabel = computed(() => {
    const title = this.title();
    const value = this.formattedLabel();
    const min = this.min();
    const max = this.max();
    return `${title}: ${value} (range ${min} to ${max})`;
  });

  // Color for the value arc based on current value
  readonly valueColor = computed(() => {
    const val = this.value(); // Use actual value instead of animated value
    const segments = this.actualSegments();
    
    // Find which segment the value falls into
    for (const segment of segments) {
      if (val >= segment.from && val <= segment.to) {
        return segment.color;
      }
    }
    
    // Fallback to last segment color if value is out of range
    return segments[segments.length - 1]?.color || 'var(--mat-sys-primary)';
  });

  // Arc path generation
  readonly backgroundArcPath = computed(() => 
    this.createArcPath(this.outerRadius(), this.startAngle, this.endAngle)
  );

  readonly valueArcPath = computed(() => {
    const percentage = this.percentage();
    const endAngleDeg = this.angleForPercentage(percentage);
    return this.createArcPath(this.outerRadius(), this.startAngle, endAngleDeg);
  });

  // Segment paths for the legend
  readonly segmentPaths = computed(() => {
    const segments = this.actualSegments();
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;
    
    if (range === 0) return [];
    
    return segments.map((segment, index) => {
      const startPct = this.clamp((segment.from - minVal) / range, 0, 1);
      const endPct = this.clamp((segment.to - minVal) / range, 0, 1);
      
      // Add small gaps between segments (2 degrees)
      const gapAngle = 2;
      const startAngle = this.angleForPercentage(startPct) + (index > 0 ? gapAngle / 2 : 0);
      const endAngle = this.angleForPercentage(endPct) - (index < segments.length - 1 ? gapAngle / 2 : 0);
      
      if (endAngle <= startAngle) return null;
      
      return {
        path: this.createArcPath(this.legendOuterRadius(), startAngle, endAngle),
        color: segment.color
      };
    }).filter(Boolean) as { path: string; color: string }[];
  });



  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private angleForPercentage(percentage: number): number {
    return this.startAngle + (this.endAngle - this.startAngle) * percentage;
  }

  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  private createArcPath(radius: number, startAngle: number, endAngle: number): string {
    const cx = this.centerX();
    const cy = this.centerY();
    
    const start = this.polarToCartesian(cx, cy, radius, startAngle);
    const end = this.polarToCartesian(cx, cy, radius, endAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }
}