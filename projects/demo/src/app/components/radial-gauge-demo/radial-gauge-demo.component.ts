import { Component, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  RadialGaugeComponent,
  RadialGaugeSegment,
} from '@dragonworks/ngx-dashboard-widgets';

@Component({
  selector: 'app-radial-gauge-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    RadialGaugeComponent,
  ],
  templateUrl: './radial-gauge-demo.component.html',
  styleUrl: './radial-gauge-demo.component.scss',
})
export class RadialGaugeDemoComponent {
  private readonly destroyRef = inject(DestroyRef);
  // Gauge values
  value = signal(75);
  min = signal(0);
  max = signal(100);
  size = signal(300);
  outerThickness = signal(36);
  innerThickness = signal(12);
  gap = signal(8);
  segmentGapPx = signal(4);

  // Responsive container demo controls
  containerWidth = signal(400);
  containerHeight = signal(250);
  sizeToThicknessRatio = signal(18);
  
  // Advanced feature controls
  showValueLabel = signal(true);
  hasBackground = signal(false);
  labelReference = signal<string | number | undefined>(undefined);
  referenceGlyph = signal('0');
  labelPadding = signal(4);
  baselineSafety = signal(0.95);

  // Animation state
  animatedValue = signal(0);
  isAnimating = signal(false);
  private animationInterval?: number;

  constructor() {
    // Set up cleanup on component destruction
    this.destroyRef.onDestroy(() => {
      this.stopAnimation();
    });
  }

  // Custom segments for different examples
  defaultSegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 60, color: 'var(--mat-sys-error)' },
    { from: 60, to: 80, color: 'var(--mat-sys-secondary)' },
    { from: 80, to: 100, color: 'var(--mat-sys-tertiary)' },
  ]);

  temperatureSegments = signal<RadialGaugeSegment[]>([
    { from: -20, to: 0, color: '#3b82f6' }, // Cold - blue
    { from: 0, to: 15, color: '#06b6d4' }, // Cool - cyan
    { from: 15, to: 25, color: '#10b981' }, // Comfortable - green
    { from: 25, to: 35, color: '#f59e0b' }, // Warm - orange
    { from: 35, to: 50, color: '#dc2626' }, // Hot - red
  ]);

  performanceSegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 25, color: '#dc2626' }, // Poor
    { from: 25, to: 50, color: '#f59e0b' }, // Fair
    { from: 50, to: 75, color: '#3b82f6' }, // Good
    { from: 75, to: 100, color: '#10b981' }, // Excellent
  ]);

  batterySegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 20, color: 'var(--mat-sys-error)' }, // Critical
    { from: 20, to: 50, color: 'var(--mat-sys-secondary)' }, // Low
    { from: 50, to: 80, color: 'var(--mat-sys-tertiary)' }, // Medium
    { from: 80, to: 100, color: 'var(--mat-sys-primary)' }, // Good
  ]);

  networkSegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 1, color: '#dc2626' }, // No signal
    { from: 1, to: 2, color: '#f59e0b' }, // Poor
    { from: 2, to: 3, color: '#eab308' }, // Fair
    { from: 3, to: 4, color: '#3b82f6' }, // Good
    { from: 4, to: 5, color: '#10b981' }, // Excellent
  ]);

  storageSegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 70, color: 'var(--mat-sys-primary)' }, // Safe
    { from: 70, to: 85, color: 'var(--mat-sys-secondary)' }, // Warning
    { from: 85, to: 95, color: 'var(--mat-sys-tertiary)' }, // High
    { from: 95, to: 100, color: 'var(--mat-sys-error)' }, // Critical
  ]);

  // Active configuration
  activeConfig = signal<
    | 'default'
    | 'temperature'
    | 'performance'
    | 'battery'
    | 'network'
    | 'storage'
  >('default');

  // Responsive demo methods
  resetContainerSize() {
    this.containerWidth.set(400);
    this.containerHeight.set(250);
  }

  setSmallContainer() {
    this.containerWidth.set(250);
    this.containerHeight.set(180);
  }

  setLargeContainer() {
    this.containerWidth.set(550);
    this.containerHeight.set(350);
  }

  // Example configurations
  setDefaultConfig() {
    this.activeConfig.set('default');
    this.min.set(0);
    this.max.set(100);
    this.value.set(75);
  }

  setTemperatureConfig() {
    this.activeConfig.set('temperature');
    this.min.set(-20);
    this.max.set(50);
    this.value.set(22);
  }

  setPerformanceConfig() {
    this.activeConfig.set('performance');
    this.min.set(0);
    this.max.set(100);
    this.value.set(85);
  }

  setBatteryConfig() {
    this.activeConfig.set('battery');
    this.min.set(0);
    this.max.set(100);
    this.value.set(72);
  }

  setNetworkConfig() {
    this.activeConfig.set('network');
    this.min.set(0);
    this.max.set(5);
    this.value.set(3.5);
  }

  setStorageConfig() {
    this.activeConfig.set('storage');
    this.min.set(0);
    this.max.set(100);
    this.value.set(62);
  }

  // Random value generator for testing animation
  randomValue() {
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;
    const randomVal = minVal + Math.random() * range;
    this.value.set(Math.round(randomVal * 10) / 10);
  }

  // Get active segments based on configuration
  getActiveSegments(): RadialGaugeSegment[] | undefined {
    switch (this.activeConfig()) {
      case 'temperature':
        return this.temperatureSegments();
      case 'performance':
        return this.performanceSegments();
      case 'battery':
        return this.batterySegments();
      case 'network':
        return this.networkSegments();
      case 'storage':
        return this.storageSegments();
      default:
        return this.defaultSegments();
    }
  }

  // Get title for active configuration
  getTitle(): string {
    switch (this.activeConfig()) {
      case 'temperature':
        return 'Temperature';
      case 'performance':
        return 'Performance';
      case 'battery':
        return 'Battery Level';
      case 'network':
        return 'Network Signal';
      case 'storage':
        return 'Storage Usage';
      default:
        return 'Gauge';
    }
  }

  // Get description for active configuration
  getDescription(): string {
    switch (this.activeConfig()) {
      case 'temperature':
        return 'Celsius';
      case 'performance':
        return 'Score';
      case 'battery':
        return 'Percentage';
      case 'network':
        return 'Bars';
      case 'storage':
        return 'GB Used';
      default:
        return '';
    }
  }

  // Animation methods
  startAnimation() {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    const minVal = this.min();
    const maxVal = this.max();
    const range = maxVal - minVal;

    this.animationInterval = window.setInterval(() => {
      const progress = (Date.now() % 4000) / 4000; // 4 second cycle
      const value =
        minVal + ((Math.sin(progress * Math.PI * 2) + 1) / 2) * range;
      this.animatedValue.set(Math.round(value * 10) / 10);
    }, 50);
  }

  stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
    this.isAnimating.set(false);
  }

}
