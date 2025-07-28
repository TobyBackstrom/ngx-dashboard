import {
  signalStoreFeature,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import { CellId, CellIdUtils, CellData } from '../../models';
import { calculateResizePreview, type ResizeData } from './utils/resize.utils';

export interface ResizeState {
  resizeData: ResizeData | null;
}

const initialResizeState: ResizeState = {
  resizeData: null,
};

// Utility functions for resize preview computations
export const ResizePreviewUtils = {
  computePreviewCells(
    resizeData: ResizeData | null,
    cells: CellData[],
  ): { row: number; col: number }[] {
    if (!resizeData) return [];

    const cell = cells.find((cell) =>
      CellIdUtils.equals(cell.cellId, resizeData.cellId),
    );
    if (!cell) return [];

    const previewCells: { row: number; col: number }[] = [];
    for (let r = 0; r < resizeData.previewRowSpan; r++) {
      for (let c = 0; c < resizeData.previewColSpan; c++) {
        previewCells.push({
          row: cell.row + r,
          col: cell.col + c,
        });
      }
    }

    return previewCells;
  },

  computePreviewMap(previewCells: { row: number; col: number }[]): Set<CellId> {
    const map = new Set<CellId>();
    for (const cell of previewCells) {
      map.add(CellIdUtils.create(cell.row, cell.col));
    }
    return map;
  },
};

export const withResize = () =>
  signalStoreFeature(
    withState<ResizeState>(initialResizeState),
    withMethods((store) => ({
      // Resize methods that need cross-feature dependencies
      _startResize(
        cellId: CellId,
        dependencies: {
          cells: CellData[];
        },
      ) {
        const cell = dependencies.cells.find((c) =>
          CellIdUtils.equals(c.cellId, cellId),
        );
        if (!cell) return;

        patchState(store, {
          resizeData: {
            cellId,
            originalRowSpan: cell.rowSpan,
            originalColSpan: cell.colSpan,
            previewRowSpan: cell.rowSpan,
            previewColSpan: cell.colSpan,
          },
        });
      },

      _updateResizePreview(
        direction: 'horizontal' | 'vertical',
        delta: number,
        dependencies: {
          cells: CellData[];
          rows: number;
          columns: number;
        },
      ) {
        const resizeData = store.resizeData();
        if (!resizeData) return;

        const newSpans = calculateResizePreview(
          resizeData,
          direction,
          delta,
          dependencies.cells,
          dependencies.rows,
          dependencies.columns,
        );

        if (newSpans) {
          patchState(store, {
            resizeData: {
              ...resizeData,
              previewRowSpan: newSpans.rowSpan,
              previewColSpan: newSpans.colSpan,
            },
          });
        }
      },

      _endResize(
        apply: boolean,
        dependencies: {
          updateWidgetSpan: (
            id: CellId,
            rowSpan: number,
            colSpan: number,
          ) => void;
        },
      ) {
        const resizeData = store.resizeData();
        if (!resizeData) return;

        if (
          apply &&
          (resizeData.previewRowSpan !== resizeData.originalRowSpan ||
            resizeData.previewColSpan !== resizeData.originalColSpan)
        ) {
          dependencies.updateWidgetSpan(
            resizeData.cellId,
            resizeData.previewRowSpan,
            resizeData.previewColSpan,
          );
        }

        patchState(store, { resizeData: null });
      },
    })),
  );
