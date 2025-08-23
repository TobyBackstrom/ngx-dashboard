// sparkbar-widget.component.ts
import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  AfterViewInit,
  ElementRef,
  DestroyRef,
  viewChild,
  effect,
} from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { svgIcon } from './sparkbar-widget.metadata';
import { SparkbarStateDialogComponent } from './sparkbar-state-dialog.component';
import { barChart, linearGradient } from 'sparklib';
import { ThemeService } from '../../services/theme.service';
import { resolveCssColor, VolatileTimeSeries } from '../../utils';

export interface SparkbarWidgetState {
  hasBackground?: boolean;
  realtime?: boolean;
  frameRate?: number; // FPS value for realtime updates
  numberOfBars?: number; // Number of bars to display in the chart
  responsiveBarColors?: boolean; // Enable/disable theme-based colors
}

@Component({
  selector: 'demo-sparkbar-widget',
  standalone: true,
  imports: [],
  templateUrl: './sparkbar-widget.component.html',
  styleUrl: './sparkbar-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkbarWidgetComponent implements Widget, AfterViewInit {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@demo/sparkbar-widget',
    name: 'Sparkbar',
    description: 'A sparkbar graph',
    svgIcon,
  };

  readonly #sanitizer = inject(DomSanitizer);
  readonly #dialog = inject(MatDialog);
  readonly #destroyRef = inject(DestroyRef);
  readonly #themeService = inject(ThemeService);

  readonly safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);
  readonly canvasContainer =
    viewChild<ElementRef<HTMLDivElement>>('canvasContainer');

  #resizeObserver?: ResizeObserver;
  #realtimeTimer?: ReturnType<typeof setInterval>;

  #chart: HTMLCanvasElement | undefined;
  #chartWidth = 0;
  #chartHeight = 0;
  #lastBackgroundColor = '';
  #lastGradientStop0 = '';
  #lastGradientStop1 = '';
  #lastResponsiveBarColors = true;
  #dataGenerators: VolatileTimeSeries[] = [];
  #data: number[] = [];

  readonly state = signal<SparkbarWidgetState>({
    hasBackground: true,
    realtime: false,
    frameRate: 20, // Default to 20 FPS
    numberOfBars: 5, // Default to 5 bars
    responsiveBarColors: true, // Default to current behavior
  });

  constructor() {
    effect(() => {
      this.#handleRealtimeStateChange();
    });
  }

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as SparkbarWidgetState),
      }));
    }
  }

  dashboardGetState(): SparkbarWidgetState {
    return this.state();
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(SparkbarStateDialogComponent, {
      data: this.state(),
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.state.set(result);
      }
    });
  }

  ngAfterViewInit(): void {
    this.#destroyRef.onDestroy(() => {
      this.#resizeObserver?.disconnect();
      this.#stopRealtimeTimer();
      this.#cleanupCanvas();
    });
  }

  #handleRealtimeStateChange(): void {
    // Watch for realtime state changes, frame rate changes, numberOfBars changes, and theme changes
    const isRealtime = this.state().realtime;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.state().frameRate; // Required for effect tracking - triggers chart update on frame rate changes
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.state().numberOfBars; // Required for effect tracking - triggers chart update on bar count changes
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.state().responsiveBarColors; // Required for effect tracking - triggers chart update on color mode changes
    this.#themeService.isDarkMode(); // Required for effect tracking - triggers chart update on theme mode changes
    this.#themeService.theme(); // Required for effect tracking - triggers chart update on theme changes

    if (isRealtime && this.canvasContainer()) {
      // Stop existing timer to restart with new frame rate
      this.#stopRealtimeTimer();

      // Force re-render when theme changes
      if (this.#chart) {
        const container = this.#getCanvasContainer();
        if (container) {
          const rect = container.getBoundingClientRect();
          this.#handleCanvasResize(rect.width, rect.height);
        }
      } else {
        this.#setupCanvasChart();
      }
      this.#startRealtimeTimer();
    } else {
      this.#stopRealtimeTimer();
      if (this.#chart) {
        this.#cleanupCanvas();
      }
    }
  }

  #setupCanvasChart(): void {
    const container = this.#getCanvasContainer();
    if (!container) return;

    try {
      // Set up ResizeObserver to monitor canvas container size changes
      this.#resizeObserver?.disconnect();
      this.#resizeObserver = new ResizeObserver((entries) => {
        try {
          const entry = entries[0];
          const { width, height } = entry.contentRect;
          this.#handleCanvasResize(width, height);
        } catch (error) {
          console.warn('ResizeObserver callback error:', error);
          // Graceful degradation - continue without this resize event
        }
      });

      this.#resizeObserver.observe(container);

      // Initial chart render
      const rect = container.getBoundingClientRect();
      this.#handleCanvasResize(rect.width, rect.height);
    } catch (error) {
      console.warn('Failed to setup canvas chart:', error);
      // Component continues to function, just without dynamic resizing
    }
  }

  #cleanupCanvas(): void {
    this.#removeChart();
    this.#resizeObserver?.disconnect();
  }

  #startRealtimeTimer(): void {
    if (!this.#realtimeTimer) {
      // Initialize data immediately before timer starts
      const numberOfBars = this.state().numberOfBars || 5;
      this.#generateData(numberOfBars);

      const intervalMs = Math.max(1000 / (this.state().frameRate || 20), 16); // Min 16ms for 60+ FPS cap
      this.#realtimeTimer = setInterval(() => {
        // More robust checks - ensure component is in valid state
        if (this.#chart && this.#chartWidth > 0 && this.state().realtime) {
          const numberOfBars = this.state().numberOfBars || 5;
          this.#generateData(numberOfBars);
          // update an existing chart with the latest data
          if (this.#chart) {
            this.#createChart(
              this.#chartWidth,
              this.#chartHeight,
              this.#lastBackgroundColor,
              this.#chart
            );
          }
        }
      }, intervalMs);
    }
  }

  #stopRealtimeTimer(): void {
    if (this.#realtimeTimer) {
      clearInterval(this.#realtimeTimer);
      this.#realtimeTimer = undefined;
    }
  }

  #getCanvasContainer(): HTMLDivElement | null {
    return this.canvasContainer()?.nativeElement || null;
  }

  #resolveThemeColor(cssProperty: string, fallback: string): string {
    return resolveCssColor(
      cssProperty,
      this.#themeService.isDarkMode(),
      fallback
    );
  }

  #removeChart(): void {
    if (this.#chart) {
      this.#chart.remove();
      this.#chart = undefined;
    }
  }

  #generateData(length: number): void {
    const currentLength = this.#dataGenerators.length;

    if (currentLength === 0) {
      // Initial generation - create array from scratch
      this.#dataGenerators = Array.from({ length }, () =>
        VolatileTimeSeries.createValueSeries(0, 95, 1)
      );
      this.#data = Array.from({ length }, (_, i) =>
        this.#dataGenerators[i].next()
      );
    } else if (currentLength === length) {
      // Same size - change value for each bar
      for (let i = 0; i < length; i++) {
        this.#data[i] = this.#dataGenerators[i].next();
      }
    } else if (currentLength > length) {
      // Array needs to shrink - truncate from the beginning
      const excess = currentLength - length;
      this.#dataGenerators.splice(0, excess);
      this.#data.splice(0, excess);
    } else {
      // Array needs to grow - add new values to the end
      const needed = length - currentLength;
      for (let i = 0; i < needed; i++) {
        this.#dataGenerators.push(
          VolatileTimeSeries.createValueSeries(0, 95, 1)
        );
        this.#data.push(this.#dataGenerators[currentLength + i].next());
      }
    }
  }

  #handleCanvasResize(width: number, height: number): void {
    const container = this.#getCanvasContainer();
    if (!container || !this.state().realtime) return;

    const newWidth = Math.floor(width);
    const newHeight = Math.floor(height);
    const backgroundColor = this.#resolveThemeColor(
      '--mat-sys-surface-variant',
      '#f3f3f3'
    );

    const currentResponsiveBarColors = this.state().responsiveBarColors ?? true;

    // Check if we need to update (size or color changed)
    if (
      newWidth === this.#chartWidth &&
      newHeight === this.#chartHeight &&
      backgroundColor === this.#lastBackgroundColor &&
      currentResponsiveBarColors === this.#lastResponsiveBarColors &&
      this.#chart !== null
    ) {
      return;
    }

    const isDarkMode = this.#themeService.isDarkMode();

    if (this.state().responsiveBarColors) {
      this.#lastGradientStop0 = this.#resolveThemeColor(
        '--mat-sys-tertiary-container',
        '#90ee90'
      );

      this.#lastGradientStop1 = this.#resolveThemeColor(
        '--mat-sys-on-tertiary-container',
        '#000000'
      );

      if (isDarkMode) {
        const tmp = this.#lastGradientStop0;
        this.#lastGradientStop0 = this.#lastGradientStop1;
        this.#lastGradientStop1 = tmp;
      }
    } else {
      this.#lastGradientStop0 = '#90ee90';
      this.#lastGradientStop1 = '#000000';
    }

    // Generate data with configured number of bars
    const numberOfBars = this.state().numberOfBars || 5;
    this.#generateData(numberOfBars);

    this.#chartWidth = newWidth;
    this.#chartHeight = newHeight;
    this.#lastBackgroundColor = backgroundColor;
    this.#lastResponsiveBarColors = currentResponsiveBarColors;

    this.#removeChart();

    this.#chart = this.#createChart(newWidth, newHeight, backgroundColor);
    container.appendChild(this.#chart);
  }

  #createChart(
    width: number,
    height: number,
    backgroundColor: string,
    canvas?: HTMLCanvasElement
  ): HTMLCanvasElement {
    return barChart()
      .background(backgroundColor)
      .width(width)
      .height(height)
      .fillStyle(
        linearGradient(0, 0, 0, this.#chartHeight)
          .addColorStop(0, this.#lastGradientStop0)
          .addColorStop(1, this.#lastGradientStop1)
      )
      .render(this.#data, canvas);
  }
}
