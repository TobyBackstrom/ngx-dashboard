import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
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
    role: 'meter',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'clampedValue()',
    '[attr.aria-valuetext]': 'formattedLabel()',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'descId',
  },
})
export class RadialGaugeComponent {
  // Inputs
  readonly value = input(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly size = input(300);
  readonly outerThickness = input(36);
  readonly innerThickness = input(12);
  readonly gap = input(8);
  readonly segments = input<RadialGaugeSegment[]>();
  readonly title = input('Gauge');
  readonly description = input('');
  readonly segmentGapPx = input(4);

  readonly titleId = `rg-title-${Math.random().toString(36).slice(2)}`;
  readonly descId = `rg-desc-${Math.random().toString(36).slice(2)}`;

  private readonly locale = inject(LOCALE_ID);
  private readonly nf = new Intl.NumberFormat(this.locale, {
    maximumFractionDigits: 1,
  });

  private readonly svgPadding = computed(() => this.outerThickness() / 2);
  readonly svgWidth = computed(() => this.size() + this.outerThickness());
  readonly svgHeight = computed(() => 
    Math.ceil(this.size() / 2 + this.outerThickness() / 2)
  );
  readonly centerX = computed(() => this.size() / 2 + this.outerThickness() / 2);
  readonly centerY = computed(() => this.size() / 2 + this.outerThickness() / 2);

  readonly outerRadius = computed(() => this.size() / 2);
  readonly innerRadius = computed(
    () => this.outerRadius() - this.outerThickness()
  );
  readonly legendOuterRadius = computed(() => 
    this.innerRadius() - this.gap() + (this.outerThickness() - this.innerThickness()) / 2
  );
  readonly legendInnerRadius = computed(
    () => this.legendOuterRadius() - this.innerThickness()
  );

  private readonly startAngle = -180;
  private readonly endAngle = 0;

  readonly clampedValue = computed(() =>
    this.clamp(this.value(), this.min(), this.max())
  );

  readonly percentage = computed(() => {
    const range = this.max() - this.min();
    if (range === 0) return 0;
    return (this.clampedValue() - this.min()) / range;
  });

  readonly percent = computed(() => Math.round(this.percentage() * 100));

  private readonly defaultSegments = computed<RadialGaugeSegment[]>(() => {
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;
    return [
      {
        from: minVal,
        to: minVal + 0.6 * range,
        color: 'var(--gauge-value-critical, #dc2626)',
      },
      {
        from: minVal + 0.6 * range,
        to: minVal + 0.8 * range,
        color: 'var(--gauge-value-warning, #f59e0b)',
      },
      {
        from: minVal + 0.8 * range,
        to: maxVal,
        color: 'var(--gauge-value-good, #10b981)',
      },
    ];
  });

  readonly actualSegments = computed(
    () => this.segments() || this.defaultSegments()
  );

  readonly formattedLabel = computed(() => this.nf.format(this.clampedValue()));

  readonly valueColor = computed(() => {
    const v = this.clampedValue();
    const segs = this.actualSegments();
    for (const s of segs) {
      if (v >= s.from && v <= s.to) return s.color;
    }
    return segs.at(-1)?.color ?? 'var(--mat-sys-primary)';
  });

  readonly backgroundArcPath = computed(() =>
    this.createArcPath(this.outerRadius(), this.startAngle, this.endAngle)
  );

  readonly segmentPaths = computed(() => {
    const segs = this.actualSegments();
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;
    if (!range) return [];

    const r = this.legendOuterRadius();
    const gapDeg = this.gapDegreesForRadius(this.segmentGapPx(), r);

    return segs
      .map((s, i) => {
        const startPct = this.clamp((s.from - minVal) / range, 0, 1);
        const endPct = this.clamp((s.to - minVal) / range, 0, 1);
        let a0 = this.angleForPercentage(startPct);
        let a1 = this.angleForPercentage(endPct);
        if (i > 0) a0 += gapDeg / 2;
        if (i < segs.length - 1) a1 -= gapDeg / 2;
        if (a1 <= a0) return null;
        return { path: this.createArcPath(r, a0, a1), color: s.color };
      })
      .filter((x): x is { path: string; color: string } => !!x);
  });

  readonly ariaLabel = computed(
    () =>
      `${this.title()}: ${this.formattedLabel()} (range ${this.min()}–${this.max()})`
  );

  /**
   * Clamps a numeric value between minimum and maximum bounds.
   * @param v - The value to be clamped
   * @param min - The minimum allowed value
   * @param max - The maximum allowed value
   * @returns The clamped value that is guaranteed to be within [min, max]
   */
  private clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
  }

  /**
   * Converts a percentage (0-1) to an angle position on the gauge arc.
   * The gauge spans from startAngle (-180°) to endAngle (0°), creating a semicircle.
   * @param p - Percentage value between 0 and 1
   * @returns Angle in degrees for the given percentage along the gauge arc
   * @example
   * angleForPercentage(0) => -180° (start of gauge)
   * angleForPercentage(0.5) => -90° (middle of gauge)
   * angleForPercentage(1) => 0° (end of gauge)
   */
  private angleForPercentage(p: number) {
    return this.startAngle + (this.endAngle - this.startAngle) * p;
  }

  /**
   * Converts polar coordinates (radius, angle) to Cartesian coordinates (x, y).
   * Uses standard trigonometric conversion where angle 0° points to the right (3 o'clock).
   * @param cx - Center X coordinate of the circle
   * @param cy - Center Y coordinate of the circle
   * @param r - Radius distance from center
   * @param angle - Angle in degrees (0° = right, 90° = down, 180° = left, -90° = up)
   * @returns Object with x and y Cartesian coordinates
   * @example
   * polarToCartesian(100, 100, 50, 0) => {x: 150, y: 100} // 3 o'clock
   * polarToCartesian(100, 100, 50, -90) => {x: 100, y: 50} // 12 o'clock
   */
  private polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const a = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  /**
   * Creates an SVG path string for a circular arc segment.
   * Uses SVG arc path commands to draw an arc from start angle to end angle.
   * @param r - Radius of the arc
   * @param a0 - Starting angle in degrees
   * @param a1 - Ending angle in degrees
   * @returns SVG path string defining the arc
   * @example
   * createArcPath(50, -180, 0) => "M cx-50 cy A 50 50 0 1 1 cx+50 cy"
   * This creates a semicircle from left (-180°) to right (0°)
   * 
   * SVG Arc Parameters:
   * - rx, ry: Radii (equal for circular arc)
   * - x-axis-rotation: 0 (no rotation for circles)
   * - large-arc-flag: 1 if arc > 180°, 0 otherwise
   * - sweep-flag: 1 for clockwise, 0 for counter-clockwise
   */
  private createArcPath(r: number, a0: number, a1: number) {
    const cx = this.centerX(),
      cy = this.centerY();
    const start = this.polarToCartesian(cx, cy, r, a0);
    const end = this.polarToCartesian(cx, cy, r, a1);
    const largeArc = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
  }

  /**
   * Calculates the angular gap in degrees needed for a specific pixel gap at a given radius.
   * Used to create visual separation between legend segments.
   * @param px - Desired gap size in pixels
   * @param r - Radius at which the gap will appear
   * @returns Gap size in degrees, clamped between 0° and 180°
   * @example
   * For a 4px gap on a radius of 100px:
   * Arc length = π * 100 = 314.16px (semicircle)
   * Degrees = 180 * (4 / 314.16) ≈ 2.3°
   * 
   * Mathematical basis:
   * - Semicircle arc length = π * r
   * - Ratio of gap to semicircle = px / (π * r)
   * - Convert ratio to degrees by multiplying by 180°
   */
  private gapDegreesForRadius(px: number, r: number) {
    const semicircumference = Math.PI * r;
    return 180 * this.clamp(px / semicircumference, 0, 1);
  }
}
