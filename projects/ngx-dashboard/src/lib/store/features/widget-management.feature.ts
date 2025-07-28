import {
  signalStoreFeature,
  withMethods,
  withState,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { CellId, CellIdUtils, CellData, WidgetFactory } from '../../models';

export interface WidgetManagementState {
  cellsById: Record<string, CellData>;
}

const initialWidgetManagementState: WidgetManagementState = {
  cellsById: {},
};

export const withWidgetManagement = () =>
  signalStoreFeature(
    withState<WidgetManagementState>(initialWidgetManagementState),
    
    // Computed cells array - lazy evaluation, automatic memoization
    withComputed((store) => ({
      cells: computed(() => Object.values(store.cellsById())),
    })),
    
    withMethods((store) => ({
      addWidget(cell: CellData) {
        const cellKey = CellIdUtils.toString(cell.cellId);
        patchState(store, {
          cellsById: { ...store.cellsById(), [cellKey]: cell },
        });
      },

      removeWidget(cellId: CellId) {
        const cellKey = CellIdUtils.toString(cellId);
        const { [cellKey]: removed, ...remaining } = store.cellsById();
        patchState(store, { cellsById: remaining });
      },

      updateWidgetPosition(cellId: CellId, row: number, col: number) {
        const cellKey = CellIdUtils.toString(cellId);
        const existingCell = store.cellsById()[cellKey];
        
        if (existingCell) {
          patchState(store, {
            cellsById: {
              ...store.cellsById(),
              [cellKey]: { ...existingCell, row, col },
            },
          });
        }
      },

      createWidget(
        row: number,
        col: number,
        widgetFactory: WidgetFactory,
        widgetState?: string,
      ) {
        const cellId = CellIdUtils.create(row, col);
        const cell: CellData = {
          cellId,
          row,
          col,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory,
          widgetState,
        };

        const cellKey = CellIdUtils.toString(cellId);
        patchState(store, {
          cellsById: { ...store.cellsById(), [cellKey]: cell },
        });
      },

      updateCellSettings(id: CellId, flat: boolean) {
        const cellKey = CellIdUtils.toString(id);
        const existingCell = store.cellsById()[cellKey];
        
        if (existingCell) {
          patchState(store, {
            cellsById: {
              ...store.cellsById(),
              [cellKey]: { ...existingCell, flat },
            },
          });
        }
      },

      updateWidgetSpan(id: CellId, rowSpan: number, colSpan: number) {
        const cellKey = CellIdUtils.toString(id);
        const existingCell = store.cellsById()[cellKey];
        
        if (existingCell) {
          patchState(store, {
            cellsById: {
              ...store.cellsById(),
              [cellKey]: { ...existingCell, rowSpan, colSpan },
            },
          });
        }
      },

      updateWidgetState(cellId: CellId, widgetState: unknown) {
        const cellKey = CellIdUtils.toString(cellId);
        const existingCell = store.cellsById()[cellKey];
        
        if (existingCell) {
          patchState(store, {
            cellsById: {
              ...store.cellsById(),
              [cellKey]: { ...existingCell, widgetState },
            },
          });
        }
      },

      updateAllWidgetStates(widgetStates: Map<string, unknown>) {
        const updatedCellsById = { ...store.cellsById() };
        
        for (const [cellIdString, newState] of widgetStates) {
          const existingCell = updatedCellsById[cellIdString];
          if (existingCell) {
            updatedCellsById[cellIdString] = { ...existingCell, widgetState: newState };
          }
        }
        
        patchState(store, { cellsById: updatedCellsById });
      },

      clearDashboard() {
        patchState(store, { cellsById: {} });
      },
    })),
  );
