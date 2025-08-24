import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RadialGaugeComponent, RadialGaugeSegment } from '@dragonworks/ngx-dashboard-widgets';

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
    RadialGaugeComponent
  ],
  templateUrl: './radial-gauge-demo.component.html',
  styleUrl: './radial-gauge-demo.component.scss'
})
export class RadialGaugeDemoComponent {
  // Gauge values
  value = signal(75);
  min = signal(0);
  max = signal(100);
  size = signal(300);
  outerThickness = signal(36);
  innerThickness = signal(12);
  gap = signal(8);
  showValue = signal(true);
  
  // Custom segments for different examples
  defaultSegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 60, color: 'var(--mat-sys-error)' },
    { from: 60, to: 80, color: 'var(--mat-sys-secondary)' },
    { from: 80, to: 100, color: 'var(--mat-sys-tertiary)' }
  ]);
  
  temperatureSegments = signal<RadialGaugeSegment[]>([
    { from: -20, to: 0, color: '#3b82f6' },  // Cold - blue
    { from: 0, to: 15, color: '#06b6d4' },   // Cool - cyan
    { from: 15, to: 25, color: '#10b981' },  // Comfortable - green
    { from: 25, to: 35, color: '#f59e0b' },  // Warm - orange
    { from: 35, to: 50, color: '#dc2626' }   // Hot - red
  ]);
  
  performanceSegments = signal<RadialGaugeSegment[]>([
    { from: 0, to: 25, color: '#dc2626' },   // Poor
    { from: 25, to: 50, color: '#f59e0b' },  // Fair
    { from: 50, to: 75, color: '#3b82f6' },  // Good
    { from: 75, to: 100, color: '#10b981' }  // Excellent
  ]);
  
  // Active configuration
  activeConfig = signal<'default' | 'temperature' | 'performance'>('default');
  
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
      default:
        return this.defaultSegments();
    }
  }
  
  // Custom formatter examples
  defaultFormatter = (value: number) => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(1);
  };
  
  percentageFormatter = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  temperatureFormatter = (value: number) => {
    return `${value.toFixed(1)}°C`;
  };
}