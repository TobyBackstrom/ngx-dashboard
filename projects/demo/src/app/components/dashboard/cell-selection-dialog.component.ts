import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GridSelection } from '@dragonworks/ngx-dashboard';

@Component({
  selector: 'app-cell-selection-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title i18n="@@demo.dashboard.cellSelection.dialog.title">Cell Selection</h2>
    <mat-dialog-content>
      <div class="selection-info">
        <div class="info-section">
          <h3 i18n="@@demo.dashboard.cellSelection.dialog.topLeft">Top Left</h3>
          <p>
            <span i18n="@@demo.dashboard.cellSelection.dialog.row">Row</span>: {{ data.topLeft.row }},
            <span i18n="@@demo.dashboard.cellSelection.dialog.col">Column</span>: {{ data.topLeft.col }}
          </p>
        </div>
        <div class="info-section">
          <h3 i18n="@@demo.dashboard.cellSelection.dialog.bottomRight">Bottom Right</h3>
          <p>
            <span i18n="@@demo.dashboard.cellSelection.dialog.row">Row</span>: {{ data.bottomRight.row }},
            <span i18n="@@demo.dashboard.cellSelection.dialog.col">Column</span>: {{ data.bottomRight.col }}
          </p>
        </div>
        <div class="info-section">
          <h3 i18n="@@demo.dashboard.cellSelection.dialog.dimensions">Dimensions</h3>
          <p>
            <span i18n="@@demo.dashboard.cellSelection.dialog.rows">Rows</span>: {{ rowCount }},
            <span i18n="@@demo.dashboard.cellSelection.dialog.cols">Columns</span>: {{ colCount }}
          </p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" i18n="@@demo.common.cancel">Cancel</button>
      <button mat-flat-button (click)="onOk()" i18n="@@demo.common.ok">OK</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: block;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .selection-info {
        display: block;
        margin: 1rem 0;
      }

      .info-section {
        margin-bottom: 1.5rem;
      }

      .info-section:last-child {
        margin-bottom: 0.5rem;
      }

      .info-section h3 {
        margin: 0 0 0.5rem 0;
      }

      .info-section p {
        margin: 0;
      }
    `,
  ],
})
export class CellSelectionDialogComponent {
  protected readonly data = inject<GridSelection>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<CellSelectionDialogComponent>
  );

  protected get rowCount(): number {
    return this.data.bottomRight.row - this.data.topLeft.row + 1;
  }

  protected get colCount(): number {
    return this.data.bottomRight.col - this.data.topLeft.col + 1;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onOk(): void {
    this.dialogRef.close(true);
  }
}
