import { InjectionToken } from '@angular/core';
import { CellSettingsDialogProvider } from './cell-settings-dialog.provider';
import { DefaultCellSettingsDialogProvider } from './default-cell-settings-dialog.provider';

/**
 * Injection token for the cell dialog provider.
 * Use this to provide your custom dialog implementation.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: CELL_SETTINGS_DIALOG_PROVIDER, useClass: MyCellSettingsDialogProvider }
 * ]
 * ```
 */
export const CELL_SETTINGS_DIALOG_PROVIDER =
  new InjectionToken<CellSettingsDialogProvider>('CellSettingsDialogProvider', {
    providedIn: 'root',
    factory: () => new DefaultCellSettingsDialogProvider(),
  });