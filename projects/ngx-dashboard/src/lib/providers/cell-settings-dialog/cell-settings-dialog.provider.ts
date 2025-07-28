import { CellDisplayData } from '../../models/cell-dialog';

/**
 * Abstract provider for cell settings dialogs.
 * Implement this to provide custom dialog solutions.
 */
export abstract class CellSettingsDialogProvider {
  /**
   * Open a settings dialog for the given cell.
   * Returns a promise that resolves to the new settings, or undefined if cancelled.
   */
  abstract openCellSettings(
    data: CellDisplayData
  ): Promise<CellDisplayData | undefined>;
}