import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TemperatureWidgetState } from './temperature-widget.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TemperatureSharedState } from './temperature-shared-state.service';

export interface TemperatureDialogData {
  instanceState: TemperatureWidgetState;
  sharedStateProvider: TemperatureSharedState;
}

@Component({
  selector: 'demo-temperature-state-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title i18n="@@demo.widgets.temperature.dialog.title">
      Temperature Settings
    </h2>
    <mat-dialog-content>
      <!-- Temperature Value Input -->
      <mat-form-field appearance="outline" class="temperature-field">
        <mat-label i18n="@@demo.widgets.temperature.dialog.temperatureValue"
          >Temperature Value (°C)</mat-label
        >
        <input
          matInput
          type="number"
          step="0.1"
          [ngModel]="temperature()"
          (ngModelChange)="onTemperatureChange($event)"
          placeholder="{{
            temperaturePlaceholder
          }}"
          i18n-placeholder="@@demo.widgets.temperature.dialog.temperatureValuePlaceholder"
        />
        <mat-hint i18n="@@demo.widgets.temperature.dialog.temperatureHint"
          >Value stored in Celsius and converted for display</mat-hint
        >
      </mat-form-field>

      <!-- Use Shared Unit Toggle -->
      <div class="toggle-field">
        <mat-slide-toggle
          [checked]="useSharedUnit()"
          (change)="useSharedUnit.set($event.checked)"
          i18n="@@demo.widgets.temperature.dialog.useSharedUnit"
        >
          Use shared unit
        </mat-slide-toggle>
        <span
          class="toggle-hint"
          i18n="@@demo.widgets.temperature.dialog.useSharedUnitDescription"
          >Use the same unit across all temperature widgets</span
        >
      </div>

      <!-- Unit Selection (when not using shared) -->
      @if (!useSharedUnit()) {
        <mat-form-field appearance="outline" class="unit-field">
          <mat-label i18n="@@demo.widgets.temperature.dialog.unit"
            >Temperature Unit</mat-label
          >
          <mat-select
            [value]="unit()"
            (selectionChange)="unit.set($any($event.value))"
          >
            <mat-option
              value="C"
              i18n="@@demo.widgets.temperature.dialog.unitCelsius"
              >Celsius (°C)</mat-option
            >
            <mat-option
              value="F"
              i18n="@@demo.widgets.temperature.dialog.unitFahrenheit"
              >Fahrenheit (°F)</mat-option
            >
            <mat-option
              value="K"
              i18n="@@demo.widgets.temperature.dialog.unitKelvin"
              >Kelvin (K)</mat-option
            >
          </mat-select>
        </mat-form-field>
      }

      <!-- Shared Unit Display (when using shared) -->
      @if (useSharedUnit()) {
        <mat-form-field appearance="outline" class="unit-field">
          <mat-label i18n="@@demo.widgets.temperature.dialog.sharedUnit"
            >Shared Unit</mat-label
          >
          <input
            matInput
            type="text"
            [value]="sharedUnitDisplay()"
            readonly
          />
          <mat-hint i18n="@@demo.widgets.temperature.dialog.sharedUnitHint"
            >This unit is shared across all temperature widgets</mat-hint
          >
        </mat-form-field>
      }

      <!-- Label Input -->
      <mat-form-field appearance="outline" class="label-field">
        <mat-label i18n="@@demo.widgets.temperature.dialog.label"
          >Label (optional)</mat-label
        >
        <input
          matInput
          type="text"
          maxlength="20"
          [(ngModel)]="label"
          placeholder="{{
            labelPlaceholder
          }}"
          i18n-placeholder="@@demo.widgets.temperature.dialog.labelPlaceholder"
        />
      </mat-form-field>

      <!-- Background Toggle -->
      <div class="toggle-field">
        <mat-slide-toggle
          [checked]="hasBackground()"
          (change)="hasBackground.set($event.checked)"
          i18n="@@demo.widgets.temperature.dialog.background"
        >
          Background
        </mat-slide-toggle>
        <span
          class="toggle-hint"
          i18n="@@demo.widgets.temperature.dialog.backgroundDescription"
          >Adds a background behind the temperature</span
        >
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-button
        (click)="onCancel()"
        i18n="@@demo.common.cancel"
      >
        Cancel
      </button>
      <button
        mat-flat-button
        (click)="save()"
        [disabled]="!hasChanged()"
        i18n="@@demo.common.save"
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

      .temperature-field {
        margin-top: 1rem;
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
export class TemperatureStateDialogComponent {
  private readonly data = inject<TemperatureDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TemperatureStateDialogComponent>);

  // Placeholders for i18n extraction
  readonly temperaturePlaceholder = $localize`:@@demo.widgets.temperature.dialog.temperatureValuePlaceholder:Enter temperature`;
  readonly labelPlaceholder = $localize`:@@demo.widgets.temperature.dialog.labelPlaceholder:e.g., Room Temp, CPU`;

  // State signals
  readonly temperature = signal<number | null>(this.data.instanceState.temperature ?? null);
  readonly unit = signal<'C' | 'F' | 'K'>(this.data.instanceState.unit ?? 'C');
  readonly label = signal<string>(this.data.instanceState.label ?? '');
  readonly hasBackground = signal<boolean>(this.data.instanceState.hasBackground ?? true);
  readonly useSharedUnit = signal<boolean>(this.data.instanceState.useSharedUnit ?? false);

  // Store original values for comparison
  private readonly originalTemperature = this.data.instanceState.temperature ?? null;
  private readonly originalUnit = this.data.instanceState.unit ?? 'C';
  private readonly originalLabel = this.data.instanceState.label ?? '';
  private readonly originalHasBackground = this.data.instanceState.hasBackground ?? true;
  private readonly originalUseSharedUnit = this.data.instanceState.useSharedUnit ?? false;

  // Computed property for displaying shared unit
  readonly sharedUnitDisplay = computed(() => {
    const unit = this.data.sharedStateProvider.config().unit;
    switch (unit) {
      case 'C':
        return 'Celsius (°C)';
      case 'F':
        return 'Fahrenheit (°F)';
      case 'K':
        return 'Kelvin (K)';
    }
  });

  // Computed change detection
  readonly hasChanged = computed(
    () =>
      this.temperature() !== this.originalTemperature ||
      this.unit() !== this.originalUnit ||
      this.label() !== this.originalLabel ||
      this.hasBackground() !== this.originalHasBackground ||
      this.useSharedUnit() !== this.originalUseSharedUnit
  );

  onTemperatureChange(value: string | number | null): void {
    if (value === '' || value === null) {
      this.temperature.set(null);
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        this.temperature.set(numValue);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close({
      temperature: this.temperature(),
      unit: this.unit(),
      label: this.label(),
      hasBackground: this.hasBackground(),
      useSharedUnit: this.useSharedUnit(),
    } as TemperatureWidgetState);
  }
}
