import {
  signalStoreFeature,
  withMethods,
  withState,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { CellId, CellIdUtils, CellData, WidgetFactory, WidgetId, WidgetIdUtils } from '../../models';

export interface WidgetManagementState {
  widgetsById: Record<string, CellData>;  // Changed: Now keyed by WidgetId instead of CellId
}

const initialWidgetManagementState: WidgetManagementState = {
  widgetsById: {},
};

export const withWidgetManagement = () =>
  signalStoreFeature(
    withState<WidgetManagementState>(initialWidgetManagementState),
    
    // Computed cells array - lazy evaluation, automatic memoization
    withComputed((store) => ({
      cells: computed(() => Object.values(store.widgetsById())),
    })),
    
    withMethods((store) => ({
      addWidget(cell: CellData) {
        const widgetKey = WidgetIdUtils.toString(cell.widgetId);
        patchState(store, {
          widgetsById: { ...store.widgetsById(), [widgetKey]: cell },
        });
      },

      removeWidget(widgetId: WidgetId) {
        const widgetKey = WidgetIdUtils.toString(widgetId);
        const { [widgetKey]: removed, ...remaining } = store.widgetsById();
        patchState(store, { widgetsById: remaining });
      },

      removeWidgetByCellId(cellId: CellId) {
        // Helper method to remove by cell position (for backwards compatibility)
        const widgets = store.widgetsById();
        const widgetToRemove = Object.entries(widgets).find(
          ([_, widget]) => CellIdUtils.equals(widget.cellId, cellId)
        );
        if (widgetToRemove) {
          const [widgetKey] = widgetToRemove;
          const { [widgetKey]: removed, ...remaining } = widgets;
          patchState(store, { widgetsById: remaining });
        }
      },

      updateWidgetPosition(widgetId: WidgetId, row: number, col: number) {
        const widgetKey = WidgetIdUtils.toString(widgetId);
        const existingWidget = store.widgetsById()[widgetKey];
        
        if (existingWidget) {
          // Update position and recalculate cellId based on new position
          const newCellId = CellIdUtils.create(row, col);
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...existingWidget, row, col, cellId: newCellId },
            },
          });
        }
      },

      updateWidgetPositionByCellId(cellId: CellId, row: number, col: number) {
        // Helper method for backwards compatibility
        const widgets = store.widgetsById();
        const widgetEntry = Object.entries(widgets).find(
          ([_, widget]) => CellIdUtils.equals(widget.cellId, cellId)
        );
        if (widgetEntry) {
          const [widgetKey, widget] = widgetEntry;
          const newCellId = CellIdUtils.create(row, col);
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...widget, row, col, cellId: newCellId },
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
        const widgetId = WidgetIdUtils.generate();  // Generate unique widget ID
        const cellId = CellIdUtils.create(row, col);  // Calculate position-based cell ID
        const cell: CellData = {
          widgetId,
          cellId,
          row,
          col,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory,
          widgetState,
        };

        const widgetKey = WidgetIdUtils.toString(widgetId);
        patchState(store, {
          widgetsById: { ...store.widgetsById(), [widgetKey]: cell },
        });
      },

      updateCellSettings(widgetId: WidgetId, flat: boolean) {
        const widgetKey = WidgetIdUtils.toString(widgetId);
        const existingWidget = store.widgetsById()[widgetKey];
        
        if (existingWidget) {
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...existingWidget, flat },
            },
          });
        }
      },

      updateCellSettingsByCellId(cellId: CellId, flat: boolean) {
        // Helper for backwards compatibility
        const widgets = store.widgetsById();
        const widgetEntry = Object.entries(widgets).find(
          ([_, widget]) => CellIdUtils.equals(widget.cellId, cellId)
        );
        if (widgetEntry) {
          const [widgetKey, widget] = widgetEntry;
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...widget, flat },
            },
          });
        }
      },

      updateWidgetSpan(widgetId: WidgetId, rowSpan: number, colSpan: number) {
        const widgetKey = WidgetIdUtils.toString(widgetId);
        const existingWidget = store.widgetsById()[widgetKey];
        
        if (existingWidget) {
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...existingWidget, rowSpan, colSpan },
            },
          });
        }
      },

      updateWidgetSpanByCellId(cellId: CellId, rowSpan: number, colSpan: number) {
        // Helper for backwards compatibility
        const widgets = store.widgetsById();
        const widgetEntry = Object.entries(widgets).find(
          ([_, widget]) => CellIdUtils.equals(widget.cellId, cellId)
        );
        if (widgetEntry) {
          const [widgetKey, widget] = widgetEntry;
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...widget, rowSpan, colSpan },
            },
          });
        }
      },

      updateWidgetState(widgetId: WidgetId, widgetState: unknown) {
        const widgetKey = WidgetIdUtils.toString(widgetId);
        const existingWidget = store.widgetsById()[widgetKey];
        
        if (existingWidget) {
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...existingWidget, widgetState },
            },
          });
        }
      },

      updateWidgetStateByCellId(cellId: CellId, widgetState: unknown) {
        // Helper for backwards compatibility
        const widgets = store.widgetsById();
        const widgetEntry = Object.entries(widgets).find(
          ([_, widget]) => CellIdUtils.equals(widget.cellId, cellId)
        );
        if (widgetEntry) {
          const [widgetKey, widget] = widgetEntry;
          patchState(store, {
            widgetsById: {
              ...store.widgetsById(),
              [widgetKey]: { ...widget, widgetState },
            },
          });
        }
      },

      updateAllWidgetStates(widgetStates: Map<string, unknown>) {
        const updatedWidgetsById = { ...store.widgetsById() };
        
        // The map could contain either widget IDs or cell ID strings for backwards compatibility
        for (const [idString, newState] of widgetStates) {
          // First try as widget ID
          if (updatedWidgetsById[idString]) {
            updatedWidgetsById[idString] = { ...updatedWidgetsById[idString], widgetState: newState };
          } else {
            // Fall back to searching by cell ID string for backwards compatibility
            const widgetEntry = Object.entries(updatedWidgetsById).find(
              ([_, widget]) => CellIdUtils.toString(widget.cellId) === idString
            );
            if (widgetEntry) {
              const [widgetKey] = widgetEntry;
              updatedWidgetsById[widgetKey] = { ...updatedWidgetsById[widgetKey], widgetState: newState };
            }
          }
        }
        
        patchState(store, { widgetsById: updatedWidgetsById });
      },

      clearDashboard() {
        patchState(store, { widgetsById: {} });
      },
    })),
  );
