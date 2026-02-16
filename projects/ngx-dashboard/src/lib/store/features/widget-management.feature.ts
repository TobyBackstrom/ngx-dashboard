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
  UNKNOWN_WIDGET_TYPEID,
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

    // Computed cells array with self-healing for late-registered widget types.
    // When loadDashboard() runs before all widget types are registered, unresolved
    // cells get an unknown fallback factory. This computed transparently re-resolves
    // them when new types register, so templates see real widgets replace placeholders.
    withComputed((store) => {
      const dashboardService = inject(DashboardService);

      return {
        cells: computed(() => {
          const widgets = Object.values(store.widgetsById());

          const hasUnresolved = widgets.some(
            (cell) => cell.widgetFactory.widgetTypeid === UNKNOWN_WIDGET_TYPEID
          );

          // Fast path: skip widgetTypes() dependency when all widgets are resolved.
          // This is safe because registerWidgetType() prevents re-registration of
          // existing types, so once healed, a widget's factory cannot change.
          if (!hasUnresolved) return widgets;

          // Establishes reactive dependency on registration changes
          dashboardService.widgetTypes();

          return widgets.map((cell) => {
            if (
              cell.widgetFactory.widgetTypeid === UNKNOWN_WIDGET_TYPEID &&
              cell.widgetTypeid
            ) {
              const resolvedFactory = dashboardService.getFactory(cell.widgetTypeid);
              if (resolvedFactory.widgetTypeid !== UNKNOWN_WIDGET_TYPEID) {
                return { ...cell, widgetFactory: resolvedFactory };
              }
            }
            return cell;
          });
        }),
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
