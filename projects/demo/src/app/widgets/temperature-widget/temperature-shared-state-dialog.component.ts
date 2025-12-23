import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TemperatureSharedState } from './temperature-shared-state.service';

@Component({
  selector: 'demo-temperature-shared-state-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule
],
  template: `
    <h2 mat-dialog-title i18n="@@demo.widgets.temperature.sharedDialog.title">
      Shared Temperature Settings
    </h2>
    <mat-dialog-content>
      <p class="description" i18n="@@demo.widgets.temperature.sharedDialog.description">
        These settings apply to all temperature widgets that use shared unit.
      </p>

      <!-- Shared Default Unit Selection -->
      <mat-form-field appearance="outline" class="unit-field">
        <mat-label i18n="@@demo.widgets.temperature.sharedDialog.defaultUnit"
          >Default Temperature Unit</mat-label
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

      .description {
        margin-bottom: 1rem;
      }

      mat-form-field {
        width: 100%;
        display: block;
        margin-bottom: 1rem;
      }

      .unit-field {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class TemperatureSharedStateDialogComponent {
  private readonly sharedStateProvider = inject<TemperatureSharedState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TemperatureSharedStateDialogComponent>);

  // State signals
  readonly unit = signal<'C' | 'F' | 'K'>(
    this.sharedStateProvider.config().unit ?? 'C'
  );

  // Store original value for comparison
  private readonly originalUnit = this.sharedStateProvider.config().unit ?? 'C';

  // Computed change detection
  readonly hasChanged = computed(() => this.unit() !== this.originalUnit);

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.sharedStateProvider.updateUnit(this.unit());
    this.dialogRef.close();
  }
}
