import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RadialGaugeWidgetState } from './radial-gauge-widget.component';

@Component({
  selector: 'lib-radial-gauge-state-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Radial Gauge Settings</h2>
    <mat-dialog-content>
      <div class="placeholder-message">
        <p>Settings coming soon</p>
        <p>This widget is currently in development. Configuration options will be available in a future update.</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: block;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .placeholder-message {
        margin: 1.5rem 0;
        text-align: center;
      }

      .placeholder-message p {
        margin-bottom: 1rem;
      }

      .placeholder-message p:last-child {
        margin-bottom: 0;
      }
    `,
  ],
})
export class RadialGaugeStateDialogComponent {
  private readonly data = inject<RadialGaugeWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RadialGaugeStateDialogComponent>);

  onCancel(): void {
    this.dialogRef.close();
  }
}