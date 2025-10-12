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
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" i18n="@@demo.common.cancel">Cancel</button>
      <button mat-flat-button (click)="onZoom()" color="accent" i18n="@@demo.dashboard.zoomToSelection">Zoom to Selection</button>
    </mat-dialog-actions>
  `,
  styles: [],
})
export class CellSelectionDialogComponent {
  protected readonly data = inject<GridSelection>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<CellSelectionDialogComponent>
  );

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onZoom(): void {
    this.dialogRef.close('zoom');
  }
}
