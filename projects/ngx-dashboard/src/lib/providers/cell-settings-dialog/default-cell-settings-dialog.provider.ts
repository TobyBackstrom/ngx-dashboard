import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { CellDisplayData } from '../../models/cell-dialog';
import { CellSettingsDialogProvider } from './cell-settings-dialog.provider';
import { CellSettingsDialogComponent } from './cell-settings-dialog.component';

/**
 * Default cell dialog provider that uses Material Design dialogs.
 * Provides a modern, accessible dialog experience for cell settings.
 */
@Injectable({
  providedIn: 'root',
})
export class DefaultCellSettingsDialogProvider extends CellSettingsDialogProvider {
  private dialog = inject(MatDialog);

  async openCellSettings(
    data: CellDisplayData
  ): Promise<CellDisplayData | undefined> {
    const dialogRef = this.dialog.open(CellSettingsDialogComponent, {
      data,
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result;
  }
}
