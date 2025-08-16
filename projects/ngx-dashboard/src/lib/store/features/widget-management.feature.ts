import {
  signalStoreFeature,
  withMethods,
  withState,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import {
  CellId,
  CellIdUtils,
  CellData,
  WidgetFactory,
  WidgetId,
  WidgetIdUtils,
} from '../../models';

export interface WidgetManagementState {
  widgetsById: Record<string, CellData>;
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

      createWidget(
        row: number,
        col: number,
        widgetFactory: WidgetFactory,
        widgetState?: string
      ) {
        const widgetId = WidgetIdUtils.generate(); // Generate unique widget ID
        const cellId = CellIdUtils.create(row, col); // Calculate position-based cell ID
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

      updateAllWidgetStates(cellStates: Map<string, unknown>) {
        const updatedWidgetsById = { ...store.widgetsById() };

        // Convert cell ID keys to widget IDs and update states
        for (const [cellIdString, newState] of cellStates) {
          // Find the widget with the matching cell ID
          const widget = Object.values(updatedWidgetsById).find(w => 
            CellIdUtils.toString(w.cellId) === cellIdString
          );
          
          if (widget) {
            const widgetIdString = WidgetIdUtils.toString(widget.widgetId);
            updatedWidgetsById[widgetIdString] = {
              ...updatedWidgetsById[widgetIdString],
              widgetState: newState,
            };
          }
        }

        patchState(store, { widgetsById: updatedWidgetsById });
      },

      clearDashboard() {
        patchState(store, { widgetsById: {} });
      },
    }))
  );
