import {
  signalStoreFeature,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import { CellData, GridResizeResult } from '../../models';
import { clampGridSize } from './utils/grid-resize.utils';

export interface GridResizeState {
  /** Previewed (clamped) grid size during a handle drag; null when idle. */
  gridResizePreview: GridResizeResult | null;
}

const initialGridResizeState: GridResizeState = {
  gridResizePreview: null,
};

export const withGridResize = () =>
  signalStoreFeature(
    withState<GridResizeState>(initialGridResizeState),
    withMethods((store) => ({
      // Needs cross-feature dependencies (current size + cells for the floor),
      // injected by the store wrapper. Skips the patch when nothing changed so
      // sub-cell pointer movement doesn't trigger redundant grid re-renders.
      _previewGridResize(
        deltaRows: number,
        deltaColumns: number,
        dependencies: { rows: number; columns: number; cells: CellData[] }
      ) {
        const preview = clampGridSize(
          dependencies.rows + deltaRows,
          dependencies.columns + deltaColumns,
          dependencies.cells
        );

        const current = store.gridResizePreview();
        if (
          current &&
          current.rows === preview.rows &&
          current.columns === preview.columns &&
          current.clamped === preview.clamped
        ) {
          return;
        }

        patchState(store, { gridResizePreview: preview });
      },

      clearGridResizePreview() {
        if (store.gridResizePreview() !== null) {
          patchState(store, { gridResizePreview: null });
        }
      },
    }))
  );
