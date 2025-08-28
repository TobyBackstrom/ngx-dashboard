import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { RadialGaugeWidgetState } from './radial-gauge-widget.component';

@Component({
  selector: 'lib-radial-gauge-state-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Radial Gauge Settings</h2>
    <mat-dialog-content>
      <div class="row-layout">
        <mat-form-field>
          <mat-label>Value</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="localState.value"
            [min]="localState.min ?? 0"
            [max]="localState.max ?? 100"
          />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Min</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="localState.min"
          />
        </mat-form-field>
      </div>

      <mat-form-field>
        <mat-label>Max</mat-label>
        <input
          matInput
          type="number"
          [(ngModel)]="localState.max"
        />
      </mat-form-field>

      <div class="toggle-section">
        <mat-slide-toggle [(ngModel)]="localState.hasBackground">
          Background
        </mat-slide-toggle>
        <p class="toggle-description">Add a background color to the widget</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button (click)="onSave()">Save</button>
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

      .row-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .row-layout mat-form-field {
        margin-bottom: 0;
      }

      .toggle-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .toggle-description {
        margin: 0;
        flex: 1;
      }
    `,
  ],
})
export class RadialGaugeStateDialogComponent {
  private readonly data = inject<RadialGaugeWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RadialGaugeStateDialogComponent>);

  localState: RadialGaugeWidgetState = {
    value: this.data.value ?? 50,
    min: this.data.min ?? 0,
    max: this.data.max ?? 100,
    hasBackground: this.data.hasBackground ?? true,
  };

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.localState);
  }
}