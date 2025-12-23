import { Component, inject, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ArrowWidgetState } from './arrow-widget.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'lib-arrow-state-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule
],
  template: `
    <h2 mat-dialog-title i18n="@@ngx.dashboard.widgets.arrow.dialog.title">
      Arrow Settings
    </h2>
    <mat-dialog-content>
      <!-- Direction Selection -->
      <mat-form-field appearance="outline" class="direction-field">
        <mat-label i18n="@@ngx.dashboard.widgets.arrow.dialog.direction"
          >Arrow Direction</mat-label
        >
        <mat-select
          [value]="direction()"
          (selectionChange)="direction.set($any($event.value))"
        >
          <mat-option
            value="up"
            i18n="@@ngx.dashboard.widgets.arrow.dialog.direction.up"
            >Up</mat-option
          >
          <mat-option
            value="right"
            i18n="@@ngx.dashboard.widgets.arrow.dialog.direction.right"
            >Right</mat-option
          >
          <mat-option
            value="down"
            i18n="@@ngx.dashboard.widgets.arrow.dialog.direction.down"
            >Down</mat-option
          >
          <mat-option
            value="left"
            i18n="@@ngx.dashboard.widgets.arrow.dialog.direction.left"
            >Left</mat-option
          >
        </mat-select>
      </mat-form-field>

      <!-- Opacity Slider -->
      <div class="slider-field">
        <div
          class="field-label"
          i18n="@@ngx.dashboard.widgets.arrow.dialog.opacity"
        >
          Opacity: {{ formatOpacity(opacity()) }}%
        </div>
        <mat-slider [min]="0.1" [max]="1" [step]="0.1">
          <input matSliderThumb [(ngModel)]="opacity" />
        </mat-slider>
      </div>

      <!-- Background Toggle -->
      <div class="toggle-field">
        <mat-slide-toggle
          [checked]="hasBackground()"
          (change)="onBackgroundToggle($event.checked)"
          i18n="@@ngx.dashboard.widgets.arrow.dialog.background"
        >
          Background
        </mat-slide-toggle>
        <span
          class="toggle-hint"
          i18n="@@ngx.dashboard.widgets.arrow.dialog.backgroundHint"
          >Adds a background behind the arrow</span
        >
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-button
        (click)="onCancel()"
        i18n="@@ngx.dashboard.common.cancel"
      >
        Cancel
      </button>
      <button
        mat-flat-button
        (click)="save()"
        [disabled]="!hasChanged()"
        i18n="@@ngx.dashboard.common.save"
      >
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

      mat-form-field {
        width: 100%;
        display: block;
        margin-bottom: 1rem;
      }

      .direction-field {
        margin-top: 1rem;
      }

      /* Opacity slider section */
      .slider-field {
        margin-bottom: 1.5rem;
        margin-right: 1rem;
      }

      .field-label {
        display: block;
        margin-bottom: 0.5rem;
      }

      mat-slider {
        width: 100%;
        display: block;
      }

      /* Toggle section */
      .toggle-field {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .toggle-hint {
        margin: 0;
      }
    `,
  ],
})
export class ArrowStateDialogComponent {
  private readonly data = inject<ArrowWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ArrowStateDialogComponent>);

  // State signals
  readonly direction = signal<'left' | 'up' | 'right' | 'down'>(
    this.data.direction
  );
  readonly opacity = signal<number>(this.data.opacity ?? 1);
  readonly hasBackground = signal<boolean>(this.data.hasBackground ?? true);
  readonly transparentBackground = signal<boolean>(
    !(this.data.hasBackground ?? true)
  );

  // Store original values for comparison
  private readonly originalDirection = this.data.direction;
  private readonly originalOpacity = this.data.opacity ?? 1;
  private readonly originalHasBackground = this.data.hasBackground ?? true;

  // Computed values
  readonly rotation = computed(() => {
    const rotationMap = {
      up: 0,
      right: 90,
      down: 180,
      left: 270,
    };
    return rotationMap[this.direction()];
  });

  readonly rotationTransform = computed(() => `rotate(${this.rotation()}deg)`);

  readonly directionName = computed(() => {
    const nameMap = {
      up: 'Up',
      right: 'Right',
      down: 'Down',
      left: 'Left',
    };
    return nameMap[this.direction()];
  });

  readonly hasChanged = computed(
    () =>
      this.direction() !== this.originalDirection ||
      this.opacity() !== this.originalOpacity ||
      this.hasBackground() !== this.originalHasBackground
  );

  formatOpacity(value: number): number {
    return Math.round(value * 100);
  }

  onBackgroundToggle(hasBackground: boolean): void {
    this.hasBackground.set(hasBackground);
    this.transparentBackground.set(!hasBackground);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close({
      direction: this.direction(),
      opacity: this.opacity(),
      hasBackground: this.hasBackground(),
    } as ArrowWidgetState);
  }
}
