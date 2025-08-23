import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClockWidgetState } from './clock-widget.component';

@Component({
  selector: 'lib-clock-state-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Clock Settings</h2>
    <mat-dialog-content>
      <div class="mode-selection">
        <label class="section-label" for="mode-selection-group">Display Mode</label>
        <mat-radio-group
          id="mode-selection-group"
          [value]="mode()"
          (change)="mode.set($any($event.value))"
        >
          <mat-radio-button value="digital">Digital</mat-radio-button>
          <mat-radio-button value="analog">Analog</mat-radio-button>
        </mat-radio-group>
      </div>

      <!-- Time Format (only for digital mode) -->
      @if (mode() === 'digital') {
      <div class="format-selection">
        <label class="section-label" for="time-format-group">Time Format</label>
        <mat-radio-group
          id="time-format-group"
          [value]="timeFormat()"
          (change)="timeFormat.set($any($event.value))"
        >
          <mat-radio-button value="24h">24 Hour (14:30:45)</mat-radio-button>
          <mat-radio-button value="12h">12 Hour (2:30:45 PM)</mat-radio-button>
        </mat-radio-group>
      </div>
      }

      <!-- Show Seconds Toggle (for both digital and analog modes) -->
      <div class="toggle-section">
        <mat-slide-toggle 
          [checked]="showSeconds()"
          (change)="showSeconds.set($event.checked)">
          Show Seconds
        </mat-slide-toggle>
        <span class="toggle-description">
          @if (mode() === 'digital') {
            Display seconds in the time
          } @else {
            Show the second hand on the clock
          }
        </span>
      </div>

      <!-- Background Toggle -->
      <div class="toggle-section">
        <mat-slide-toggle 
          [checked]="hasBackground()"
          (change)="hasBackground.set($event.checked)">
          Background
        </mat-slide-toggle>
        <span class="toggle-description"
          >Adds a background behind the clock</span
        >
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="!hasChanged()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: block;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .mode-selection,
      .format-selection {
        margin-top: 1rem;
        margin-bottom: 2rem;
      }

      .section-label {
        display: block;
        margin-bottom: 0.75rem;
        font-weight: 500;
      }

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      mat-radio-button {
        margin: 0;
      }

      /* Toggle section */
      .toggle-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .toggle-description {
        margin: 0;
      }
    `,
  ],
})
export class ClockStateDialogComponent {
  private readonly data = inject<ClockWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ClockStateDialogComponent>);

  // State signals
  readonly mode = signal<'analog' | 'digital'>(this.data.mode ?? 'digital');
  readonly hasBackground = signal<boolean>(this.data.hasBackground ?? true);
  readonly timeFormat = signal<'12h' | '24h'>(this.data.timeFormat ?? '24h');
  readonly showSeconds = signal<boolean>(this.data.showSeconds ?? true);

  // Store original values for comparison
  private readonly originalMode = this.data.mode ?? 'digital';
  private readonly originalHasBackground = this.data.hasBackground ?? true;
  private readonly originalTimeFormat = this.data.timeFormat ?? '24h';
  private readonly originalShowSeconds = this.data.showSeconds ?? true;

  // Computed values
  readonly hasChanged = computed(
    () =>
      this.mode() !== this.originalMode ||
      this.hasBackground() !== this.originalHasBackground ||
      this.timeFormat() !== this.originalTimeFormat ||
      this.showSeconds() !== this.originalShowSeconds
  );

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close({
      mode: this.mode(),
      hasBackground: this.hasBackground(),
      timeFormat: this.timeFormat(),
      showSeconds: this.showSeconds(),
    } as ClockWidgetState);
  }
}