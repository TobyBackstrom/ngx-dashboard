import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, map, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface RadialGaugeSegment {
  from: number;
  to: number;
  color: string;
}

/**
 * Responsive radial gauge component with hybrid sizing and thickness control.
 *
 * This component provides a highly flexible gauge system with three independent
 * control dimensions that can be mixed and matched for different use cases:
 *
 * ## Size Control:
 * - **Fixed Size**: Use manual `size` input (traditional behavior)
 * - **Container Responsive**: Enable `fitToContainer` for automatic sizing
 *
 * ## Thickness Control:
 * - **Manual Thickness**: Use individual thickness inputs (traditional behavior)
 * - **Proportional Thickness**: Enable `responsiveMode` for size-based scaling
 *
 * ## Usage Scenarios:
 *
 * ### 1. Dashboard Widgets (Recommended)
 * ```html
 * <ngx-radial-gauge
 *   [value]="cpuUsage"
 *   [fitToContainer]="true"
 *   [responsiveMode]="true"
 *   [sizeToThicknessRatio]="12" />
 * ```
 * **Best for**: Grid layouts, dashboard panels, adaptive containers
 * **Behavior**: Automatically resizes to fit available space while maintaining
 * consistent proportional appearance across all sizes.
 *
 * ### 2. Fixed Layouts (Traditional)
 * ```html
 * <ngx-radial-gauge
 *   [value]="temperature"
 *   [size]="300"
 *   [outerThickness]="36"
 *   [innerThickness]="12" />
 * ```
 * **Best for**: Static designs, precise sizing requirements, print layouts
 * **Behavior**: Exact pixel control over all dimensions, predictable appearance.
 *
 * ### 3. Scalable Designs
 * ```html
 * <ngx-radial-gauge
 *   [value]="batteryLevel"
 *   [size]="gaugeSize"
 *   [responsiveMode]="true"
 *   [sizeToThicknessRatio]="20" />
 * ```
 * **Best for**: User-configurable sizing, responsive breakpoints, zoom interfaces
 * **Behavior**: Manual size control with automatic thickness scaling. As size
 * increases/decreases, ring thickness scales proportionally to maintain visual balance.
 *
 * ## Mathematical Relationships:
 *
 * When `responsiveMode=true`, thickness follows this formula:
 * ```
 * baseThickness = effectiveSize / sizeToThicknessRatio
 * outerThickness = baseThickness × responsiveProportions.outer (default: 3)
 * innerThickness = baseThickness × responsiveProportions.inner (default: 1)
 * gap = baseThickness × responsiveProportions.gap (default: 0.5)
 * totalThickness = baseThickness × 4.5 (outer + inner + gap)
 * ```
 *
 * Example with 300px gauge and ratio=20 (ultra-thin):
 * - baseThickness = 15px
 * - outerThickness = 45px (15×3)
 * - innerThickness = 15px (15×1)
 * - gap = 7.5px (15×0.5)
 * - totalThickness = 67.5px (22.5% of diameter)
 *
 * ## Container Responsiveness:
 *
 * When `fitToContainer=true`, the component uses ResizeObserver to:
 * 1. Monitor parent container dimension changes
 * 2. Calculate maximum diameter maintaining 2:1 aspect ratio (width:height)
 * 3. Apply containerPadding for safe margins
 * 4. Update gauge size in real-time
 *
 * This provides true responsive behavior for dashboard widgets, grid layouts,
 * and adaptive interfaces.
 *
 * ## Accessibility:
 *
 * The component implements ARIA meter role with proper labeling:
 * - `role="meter"` for semantic meaning
 * - `aria-valuemin/max/now` for screen readers
 * - `aria-label` with contextual information
 * - Internationalized number formatting
 *
 */
@Component({
  selector: 'ngx-radial-gauge',
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
    '[class.fit-container]': 'fitToContainer()',
    '[class.has-background]': 'hasBackground()',
  },
})
export class RadialGaugeComponent {
  private readonly valueTextEl = viewChild<ElementRef<SVGTextElement>>('valueText');
  private readonly valueGroupEl = viewChild<ElementRef<SVGGElement>>('valueGroup');
  private readonly refTextEl =
    viewChild.required<ElementRef<SVGTextElement>>('refText');

  // Core Inputs - Value and Range
  readonly value = input(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly segments = input<RadialGaugeSegment[]>();
  readonly title = input('Gauge');
  readonly description = input('');
  readonly segmentGapPx = input(4);
  
  // Widget styling inputs
  /**
   * Whether the gauge should display with a background. 
   * Affects text color contrast and other visual elements.
   * @default false
   */
  readonly hasBackground = input(false);

  /**
   * Whether to display the numeric value label in the center of the gauge.
   * @default true
   */
  readonly showValueLabel = input(true);

  // Size Control Inputs
  /**
   * Base gauge diameter in pixels. Used as fallback when fitToContainer is false.
   * @default 300
   */
  readonly size = input(300);

  /**
   * Automatically resize gauge to fit its container dimensions.
   * When true, the gauge will observe container size changes and adjust accordingly.
   * Maintains semicircle aspect ratio (2:1 width:height).
   * @default false
   */
  readonly fitToContainer = input(false);

  /**
   * Padding in pixels to maintain from container edges when fitToContainer is true.
   * @default 10
   */
  readonly containerPadding = input(10);

  // Thickness Control Inputs
  /**
   * Use proportional thickness scaling based on gauge size.
   * When true, all thickness values are calculated as multiples of baseThickness.
   * Overrides manual outerThickness, innerThickness, and gap inputs.
   * @default false
   */
  readonly responsiveMode = input(false);

  /**
   * Ratio used to calculate base thickness from gauge size.
   * baseThickness = effectiveSize / sizeToThicknessRatio
   * Higher values create thinner gauge rings for ultra-thin appearance.
   * @default 20
   * @example
   * - ratio=15: thicker rings (bt = size/15)
   * - ratio=20: ultra-thin balanced appearance (bt = size/20)
   * - ratio=30: extremely thin rings (bt = size/30)
   */
  readonly sizeToThicknessRatio = input(20);

  /**
   * Proportional multipliers for responsive thickness calculations.
   * - outer: Multiplier for outer ring thickness (default: 3)
   * - inner: Multiplier for inner ring thickness (default: 1)
   * - gap: Multiplier for gap between rings (default: 0.5)
   * Total thickness = baseThickness × (outer + inner + gap) = bt × 4.5
   * @default { outer: 3, inner: 1, gap: 0.5 }
   */
  readonly responsiveProportions = input({ outer: 3, inner: 1, gap: 0.5 });

  // Manual Thickness Inputs (used when responsiveMode is false)
  /**
   * Manual outer ring thickness in pixels. Ignored when responsiveMode is true.
   * @default 36
   */
  readonly outerThickness = input(36);

  /**
   * Manual inner ring thickness in pixels. Ignored when responsiveMode is true.
   * @default 12
   */
  readonly innerThickness = input(12);

  /**
   * Manual gap between rings in pixels. Ignored when responsiveMode is true.
   * @default 8
   */
  readonly gap = input(8);

  readonly titleId = `rg-title-${Math.random().toString(36).slice(2)}`;
  readonly descId = `rg-desc-${Math.random().toString(36).slice(2)}`;
  readonly clipId = `rg-clip-${Math.random().toString(36).slice(2)}`;

  private readonly locale = inject(LOCALE_ID);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nf = new Intl.NumberFormat(this.locale, {
    maximumFractionDigits: 1,
  });

  // Container Size Detection
  /**
   * Tracks the container's available size for responsive sizing.
   * Updated by ResizeObserver when fitToContainer is enabled.
   * @private
   */
  private readonly containerSize = signal<number | null>(null);

  /**
   * ResizeObserver instance for monitoring container size changes.
   * Created when fitToContainer is enabled, destroyed on component cleanup.
   * @private
   */
  private resizeObserver: ResizeObserver | null = null;

  readonly viewReady = toSignal(
    from(new Promise<void>((resolve) => afterNextRender(resolve))).pipe(
      map(() => true)
    ),
    { initialValue: false }
  );

  readonly fontsReady = toSignal(
    typeof document !== 'undefined' && 'fonts' in document
      ? from((document as Document & { fonts: FontFaceSet }).fonts.ready).pipe(
          map(() => true)
        )
      : of(true), // SSR or older browsers: treat as ready
    { initialValue: false }
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    });
  }

  /**
   * Effect that manages ResizeObserver lifecycle based on fitToContainer input.
   * Automatically connects/disconnects observer when the input changes.
   * @private
   */
  private readonly containerObserverEffect = effect(() => {
    const shouldObserve = this.fitToContainer();

    if (shouldObserve && !this.resizeObserver) {
      // Create and start observing
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        const padding = this.containerPadding();

        const availW = Math.max(0, width - padding * 2);
        const availH = Math.max(0, height - padding);

        let sFromW: number;
        let sFromH: number;

        if (this.responsiveMode()) {
          // In responsive mode: outerThickness = 3 * baseThickness = 3 * size / ratio
          // Total space needed = size + outerThickness = size + 3*size/ratio = size * (1 + 3/ratio)
          const ratio = this.sizeToThicknessRatio();
          const spaceFactor = 1 + 3 / ratio; // Total space factor
          sFromW = availW / spaceFactor;
          sFromH = (2 * availH) / spaceFactor;
        } else {
          // Manual thickness: outer thickness is fixed
          const outerT = this.outerThickness();
          sFromW = Math.max(0, availW - outerT);
          sFromH = Math.max(0, 2 * availH - outerT);
        }

        const maxDiameter = Math.min(sFromW, sFromH);
        this.containerSize.set(Math.max(maxDiameter, 50));
      });

      this.resizeObserver.observe(this.elementRef.nativeElement);
    } else if (!shouldObserve && this.resizeObserver) {
      // Stop observing and cleanup
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
      this.containerSize.set(null);
    }
  });

  // ── Build the reference string reactively ───────────────────────────────────
  referenceString = computed(() => {
    const ref = this.labelReference();
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'number' && ref > 0) {
      const g = this.referenceGlyph() ?? '0';
      return g.repeat(ref);
    }

    return this.formattedLabel(); // measure actual label
  });

  // ── Core transform: center + uniform scale to fit the reserved box ──────────
  valueTransform = computed(() => {
    if (!this.showValueLabel()) return '';
    
    // ensure we wait for first paint + font shaping
    this.viewReady();
    this.fontsReady();

    const cx = this.centerX();
    const cy = this.centerY();
    const r = this.legendInnerRadius();
    const pad = this.labelPadding();

    const boxWidth = Math.max(0, 2 * r - 2 * pad);
    const boxHeight = Math.max(0, r - pad);

    // If geometry is degenerate, just center.
    if (!boxWidth || !boxHeight) return `translate(${cx},${cy})`;

    // Measure the actual label (for height) and the reference (for width)
    const labelEl = this.valueTextEl()?.nativeElement;
    const refEl = this.refTextEl().nativeElement;

    if (!labelEl) return `translate(${cx},${cy})`;

    // Important: ensure text nodes are up to date before reading BBox
    // (Angular's computed/effect guarantees sync within the same microtask)
    const labelBox = this.safeBBox(labelEl);
    const refBox = this.safeBBox(refEl);

    // Use reference width and actual label height
    const widthForFit = refBox.width || labelBox.width || 1;
    const heightForFit = labelBox.height || refBox.height || 1;

    const s =
      Math.min(boxWidth / widthForFit, boxHeight / heightForFit) *
      this.baselineSafety();

    return `translate(${cx},${cy}) scale(${s})`;
  });

  /** Guarded getBBox that avoids 0/NaN on detached or invisible nodes. */
  safeBBox(node: SVGGraphicsElement): DOMRect {
    try {
      const box = node.getBBox();
      // Firefox/Safari can occasionally return 0 when text hasn’t painted yet; fall back to a rough estimate.
      if (box && (box.width > 0 || box.height > 0)) return box;
    } catch {
      /* ignore */
    }
    // Fallback guess to avoid divide-by-zero (tuned small; will get corrected next tick)
    return new DOMRect(0, 0, 1, 1);
  }

  // Responsive Size and Thickness Calculations
  /**
   * The effective gauge diameter, accounting for container sizing and manual size input.
   * Priority: containerSize (when fitToContainer=true) > manual size input
   * @returns Effective diameter in pixels
   *
   * @example
   * // Fixed size mode
   * fitToContainer=false, size=300 → effectiveSize=300
   *
   * // Container responsive mode
   * fitToContainer=true, container=400px wide → effectiveSize=380 (minus padding)
   */
  private readonly effectiveSize = computed(() => {
    const containerDiameter = this.containerSize();
    if (this.fitToContainer() && containerDiameter !== null) {
      return containerDiameter;
    }
    return this.size();
  });

  /**
   * Base thickness calculated from effective size for proportional scaling.
   * Only used when responsiveMode is enabled.
   * Formula: baseThickness = effectiveSize / sizeToThicknessRatio
   * @returns Base thickness in pixels, or 0 when responsiveMode is false
   *
   * @example
   * // effectiveSize=300, sizeToThicknessRatio=12
   * baseThickness = 300/12 = 25px
   * // Total ring thickness = 25 × 4.5 = 112.5px (37.5% of diameter)
   */
  private readonly baseThickness = computed(() => {
    if (!this.responsiveMode()) return 0;
    return this.effectiveSize() / this.sizeToThicknessRatio();
  });

  /**
   * Effective outer ring thickness, supporting both manual and responsive modes.
   * - Responsive mode: baseThickness × responsiveProportions.outer
   * - Manual mode: outerThickness input value
   * @returns Outer ring thickness in pixels
   */
  readonly effectiveOuterThickness = computed(() => {
    if (this.responsiveMode()) {
      return this.baseThickness() * this.responsiveProportions().outer;
    }
    return this.outerThickness();
  });

  /**
   * Effective inner ring thickness, supporting both manual and responsive modes.
   * - Responsive mode: baseThickness × responsiveProportions.inner
   * - Manual mode: innerThickness input value
   * @returns Inner ring thickness in pixels
   */
  readonly effectiveInnerThickness = computed(() => {
    if (this.responsiveMode()) {
      return this.baseThickness() * this.responsiveProportions().inner;
    }
    return this.innerThickness();
  });

  /**
   * Effective gap between rings, supporting both manual and responsive modes.
   * - Responsive mode: baseThickness × responsiveProportions.gap
   * - Manual mode: gap input value
   * @returns Gap between rings in pixels
   */
  readonly effectiveGap = computed(() => {
    if (this.responsiveMode()) {
      return this.baseThickness() * this.responsiveProportions().gap;
    }
    return this.gap();
  });

  // SVG Layout Calculations
  private readonly svgPadding = computed(
    () => this.effectiveOuterThickness() / 2
  );
  readonly svgWidth = computed(
    () => this.effectiveSize() + this.effectiveOuterThickness()
  );
  readonly svgHeight = computed(() =>
    Math.ceil(this.effectiveSize() / 2 + this.effectiveOuterThickness() / 2)
  );
  readonly centerX = computed(
    () => this.effectiveSize() / 2 + this.effectiveOuterThickness() / 2
  );
  readonly centerY = computed(
    () => this.effectiveSize() / 2 + this.effectiveOuterThickness() / 2
  );

  /**
   * If a string is provided, we measure it and allocate space for that width.
   * If a number is provided, we build a string of that many `referenceGlyph`s.
   * If omitted, we fall back to measuring the actual label.
   */
  labelReference = input<string | number | undefined>(undefined);

  /** Glyph to repeat when labelReference is a number (defaults to '0'). */
  referenceGlyph = input<string>('0');

  /** Extra breathing room inside the inner semicircle box (in px). */
  labelPadding = input<number>(4);

  /** Safety multiplier to avoid clipping ascenders/descenders. */
  baselineSafety = input<number>(0.95);

  readonly outerRadius = computed(() => this.effectiveSize() / 2);
  readonly innerRadius = computed(
    () =>
      this.outerRadius() -
      this.effectiveOuterThickness() / 2 -
      this.effectiveGap()
  );
  readonly legendOuterRadius = computed(
    () =>
      this.outerRadius() -
      this.effectiveOuterThickness() / 2 -
      this.effectiveGap() -
      this.effectiveInnerThickness() / 2
  );
  readonly legendInnerRadius = computed(
    () => this.legendOuterRadius() - this.effectiveInnerThickness()
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
