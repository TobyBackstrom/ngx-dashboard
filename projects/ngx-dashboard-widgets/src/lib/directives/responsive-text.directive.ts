import {
  Directive,
  ElementRef,
  inject,
  DestroyRef,
  numberAttribute,
  booleanAttribute,
  input,
  AfterViewInit,
  effect,
} from '@angular/core';
import { NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Directive that automatically adjusts font size to fit text within its parent container.
 * Uses canvas-based measurement for performance and DOM verification for accuracy.
 *
 * @example
 * <div class="container">
 *   <span libResponsiveText [minFontSize]="12" [maxFontSize]="72">Dynamic text here</span>
 *   <span libResponsiveText [templateString]="'Template for sizing'">Shorter text</span>
 * </div>
 */
@Directive({
  selector: '[libResponsiveText]',
  standalone: true,
  host: {
    '[style.display]': '"block"',
    '[style.width]': '"100%"',
    '[style.white-space]': '"nowrap"',
    '[style.overflow]': '"visible"',
  },
})
export class ResponsiveTextDirective implements AfterViewInit {
  /* ───────────────────────── Inputs with transforms ─────────────── */
  /** Minimum font-size in pixels (accessibility floor) */
  minFontSize = input(8, { transform: numberAttribute });

  /** Maximum font-size in pixels (layout ceiling) */
  maxFontSize = input(512, { transform: numberAttribute });

  /**
   * Line-height: pass a multiplier (e.g. 1.1) or absolute px value.
   * For single-line text a multiplier < 10 is treated as unitless.
   */
  lineHeight = input(1.1, { transform: numberAttribute });

  /** Whether to observe text mutations after first render */
  observeMutations = input(true, { transform: booleanAttribute });

  /** Debounce delay in ms for resize/mutation callbacks */
  debounceMs = input(16, { transform: numberAttribute });

  /** Template string to use for size calculations instead of actual content */
  templateString = input<string | undefined>(undefined);

  /* ───────────────────────── Private state ───────────────────────── */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // Canvas context - lazy initialization
  private _ctx?: CanvasRenderingContext2D;
  private get ctx(): CanvasRenderingContext2D {
    if (!this._ctx) {
      const canvas = document.createElement('canvas');
      this._ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: false,
      })!;
    }
    return this._ctx;
  }

  private ro?: ResizeObserver;
  private mo?: MutationObserver;
  private fitTimeout?: number;

  // Cache for performance
  private lastText = '';
  private lastTemplateString = '';
  private lastMaxW = 0;
  private lastMaxH = 0;
  private lastFontSize = 0;
  private isViewInitialized = false;

  constructor() {
    // Set up cleanup on component destruction using modern DestroyRef
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });

    // Watch for input changes and trigger refit
    effect(() => {
      // Access the signals to track them (triggers when they change)
      this.templateString();
      this.minFontSize();
      this.maxFontSize();

      // Only trigger refit if directive is initialized and view is ready
      if (this.isViewInitialized && isPlatformBrowser(this.platformId)) {
        this.zone.runOutsideAngular(() => {
          this.requestFit();
        });
      }
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Set initial styles
    const span = this.el.nativeElement;
    span.style.transition = 'font-size 0.1s ease-out';

    // Mark as initialized for the effect to start watching
    this.isViewInitialized = true;

    // All observer callbacks run outside Angular's zone
    this.zone.runOutsideAngular(() => {
      this.fit();
      this.observeResize();
      if (this.observeMutations()) {
        this.observeText();
      }
    });
  }

  /* ───────────────────── Core fitting logic ───────────────────── */
  /**
   * Debounced fit handler to prevent excessive recalculations
   */
  private requestFit = () => {
    if (this.fitTimeout) {
      cancelAnimationFrame(this.fitTimeout);
    }

    this.fitTimeout = requestAnimationFrame(() => {
      this.fit();
    });
  };

  /**
   * Recalculate & apply the ideal font-size
   */
  private fit = () => {
    const span = this.el.nativeElement;
    const parent = span.parentElement;

    if (!parent) return;

    const actualText = span.textContent?.trim() || '';
    const templateString = this.templateString()?.trim();
    const measureText = templateString || actualText;

    if (!measureText) {
      span.style.fontSize = `${this.minFontSize()}px`;
      return;
    }

    const { maxW, maxH } = this.getAvailableSpace(parent);

    // Check cache to avoid redundant calculations
    if (
      actualText === this.lastText &&
      (templateString || '') === this.lastTemplateString &&
      maxW === this.lastMaxW &&
      maxH === this.lastMaxH &&
      this.lastFontSize > 0
    ) {
      return;
    }

    // Calculate with conservative buffer for sub-pixel accuracy
    const ideal = this.calcFit(measureText, maxW * 0.98, maxH * 0.98);

    span.style.fontSize = `${ideal}px`;

    // DOM verification pass
    this.verifyFit(span, maxW, maxH, ideal);

    // Update cache
    this.lastText = actualText;
    this.lastTemplateString = templateString || '';
    this.lastMaxW = maxW;
    this.lastMaxH = maxH;
    this.lastFontSize = parseFloat(span.style.fontSize);
  };

  /**
   * Calculate available space accounting for padding and borders
   */
  private getAvailableSpace(parent: HTMLElement): {
    maxW: number;
    maxH: number;
  } {
    const cs = getComputedStyle(parent);
    const maxW =
      parent.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);
    const maxH =
      parent.clientHeight -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom);

    return { maxW: Math.max(0, maxW), maxH: Math.max(0, maxH) };
  }

  /**
   * DOM-based verification to handle sub-pixel discrepancies
   */
  private verifyFit(
    span: HTMLElement,
    maxW: number,
    maxH: number,
    ideal: number
  ) {
    // Simple synchronous verification
    if (span.scrollWidth > maxW || span.scrollHeight > maxH) {
      let safe = ideal;
      let iterations = 0;
      const maxIterations = 10;

      while (
        iterations < maxIterations &&
        safe > this.minFontSize() &&
        (span.scrollWidth > maxW || span.scrollHeight > maxH)
      ) {
        safe -= 0.25;
        span.style.fontSize = `${safe}px`;
        iterations++;
      }

      // Update cache with verified size
      this.lastFontSize = safe;
    }
  }

  /* ───────────────────── Binary search algorithm ────────────────── */
  /**
   * Binary search for optimal font size using canvas measurements
   */
  private calcFit(
    text: string,
    maxW: number,
    maxH: number,
    precision = 0.1
  ): number {
    if (maxW <= 0 || maxH <= 0) return this.minFontSize();

    const computedStyle = getComputedStyle(this.el.nativeElement);
    const fontFamily = computedStyle.fontFamily || 'sans-serif';
    const fontWeight = computedStyle.fontWeight || '400';

    let lo = this.minFontSize();
    let hi = this.maxFontSize();
    let bestFit = this.minFontSize();

    while (hi - lo > precision) {
      const mid = (hi + lo) / 2;
      this.ctx.font = `${fontWeight} ${mid}px ${fontFamily}`;

      const metrics = this.ctx.measureText(text);
      const width = metrics.width;

      // Calculate height based on available metrics
      const height = this.calculateTextHeight(metrics, mid);

      if (width <= maxW && height <= maxH) {
        bestFit = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return Math.floor(bestFit * 100) / 100;
  }

  /**
   * Calculate text height from metrics
   */
  private calculateTextHeight(metrics: TextMetrics, fontSize: number): number {
    // Use font bounding box metrics if available
    if (metrics.fontBoundingBoxAscent && metrics.fontBoundingBoxDescent) {
      return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    }

    // Fallback to actual bounding box
    if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
      return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }

    // Final fallback using line height
    return this.lineHeight() < 10
      ? fontSize * this.lineHeight()
      : this.lineHeight();
  }

  /* ───────────────────────── Observers ─────────────────────────── */
  /**
   * Observe parent container resizes
   */
  private observeResize() {
    if (!('ResizeObserver' in window)) return;

    this.ro = new ResizeObserver((entries) => {
      // Only trigger if size actually changed
      const entry = entries[0];
      if (entry?.contentRect) {
        this.requestFit();
      }
    });

    const parent = this.el.nativeElement.parentElement;
    if (parent) {
      this.ro.observe(parent);
    }
  }

  /**
   * Observe text content changes
   */
  private observeText() {
    if (!('MutationObserver' in window)) return;

    this.mo = new MutationObserver((mutations) => {
      // Check if text actually changed
      const hasTextChange = mutations.some(
        (m) =>
          m.type === 'characterData' ||
          (m.type === 'childList' &&
            (m.addedNodes.length > 0 || m.removedNodes.length > 0))
      );

      if (hasTextChange) {
        this.requestFit();
      }
    });

    this.mo.observe(this.el.nativeElement, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    this.ro?.disconnect();
    this.mo?.disconnect();

    if (this.fitTimeout) {
      cancelAnimationFrame(this.fitTimeout);
    }

    // Clear canvas context
    this._ctx = undefined;
  }
}
