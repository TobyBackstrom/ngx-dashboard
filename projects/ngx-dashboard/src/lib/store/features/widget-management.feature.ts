import {
  signalStoreFeature,
  withMethods,
  withState,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import {
  CellIdUtils,
  CellData,
  WidgetFactory,
  WidgetId,
  WidgetIdUtils,
} from '../../models';
import { DashboardService } from '../../services/dashboard.service';

export interface WidgetManagementState {
  widgetsById: Record<string, CellData>;
}

const initialWidgetManagementState: WidgetManagementState = {
  widgetsById: {},
};

export const withWidgetManagement = () =>
  signalStoreFeature(
    withState<WidgetManagementState>(initialWidgetManagementState),

    // Computed cells array, re-resolved against the widget registry in both
    // directions: a type that registers late heals its fallback into the real
    // widget, and an unregistered type puts the fallback back. widgetsById keeps
    // the factory each cell was created with, so either change can be undone.
    withComputed((store) => {
      const dashboardService = inject(DashboardService);
      // The copy last derived for a stored cell, so a healed or reverted cell
      // keeps its reference instead of being copied on every run.
      const resolvedCells = new WeakMap<CellData, CellData>();

      return {
        cells: computed(
          () => {
            dashboardService.widgetTypes(); // re-run on every registry change

            return Object.values(store.widgetsById()).map((cell) => {
              if (!cell.widgetTypeid) return cell;

              // Compared by reference, see getFactory()
              const factory = dashboardService.getFactory(cell.widgetTypeid);
              if (factory === cell.widgetFactory) return cell;

              const previous = resolvedCells.get(cell);
              if (previous?.widgetFactory === factory) return previous;

              const resolved = { ...cell, widgetFactory: factory };
              resolvedCells.set(cell, resolved);
              return resolved;
            });
          },
          {
            // Every cell kept its reference: keep the array too, so a registry
            // change that resolves nothing new recomputes nothing downstream.
            equal: (a, b) =>
              a.length === b.length && a.every((cell, i) => cell === b[i]),
          }
        ),
      };
    }),

    withMethods((store) => ({
      addWidget(cell: CellData) {
        const widgetKey = WidgetIdUtils.toString(cell.widgetId);
        patchState(store, {
          widgetsById: { ...store.widgetsById(), [widgetKey]: cell },
        });
      },

      removeWidget(widgetId: WidgetId) {
        const widgetKey = WidgetIdUtils.toString(widgetId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [widgetKey]: _, ...remaining } = store.widgetsById();
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
          widgetTypeid: widgetFactory.widgetTypeid,
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
