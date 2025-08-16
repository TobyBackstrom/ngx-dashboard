import {
  signalStore,
  withProps,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { DashboardService } from '../services/dashboard.service';
import { inject, computed } from '@angular/core';
import { calculateCollisionInfo } from './features/utils/collision.utils';
import {
  CellId,
  CellIdUtils,
  CellData,
  DragData,
  DashboardDataDto,
  WidgetId,
  WidgetIdUtils,
} from '../models';
import { withGridConfig } from './features/grid-config.feature';
import { withWidgetManagement } from './features/widget-management.feature';
import { withDragDrop } from './features/drag-drop.feature';
import { withResize, ResizePreviewUtils } from './features/resize.feature';

type DashboardState = {
  dashboardId: string;
};

const initialState: DashboardState = {
  dashboardId: '',
};

export const DashboardStore = signalStore(
  withState(initialState),
  withProps(() => ({
    dashboardService: inject(DashboardService),
  })),
  withGridConfig(),
  withWidgetManagement(),
  withResize(),
  withDragDrop(),

  // Cross-feature computed properties (need access to multiple features)
  withComputed((store) => ({
    // Invalid zones (collision detection)
    invalidHighlightMap: computed(() => {
      const collisionInfo = calculateCollisionInfo(
        store.dragData(),
        store.hoveredDropZone(),
        store.cells(),
        store.rows(),
        store.columns()
      );

      return new Set(collisionInfo.invalidCells);
    }),

    // Check if placement would be valid (for drop validation)
    isValidPlacement: computed(() => {
      const collisionInfo = calculateCollisionInfo(
        store.dragData(),
        store.hoveredDropZone(),
        store.cells(),
        store.rows(),
        store.columns()
      );

      return !collisionInfo.hasCollisions && !collisionInfo.outOfBounds;
    }),
  })),

  // Cross-feature methods (need access to multiple features)
  withMethods((store) => ({
    // DROP HANDLING (delegate to drag-drop feature with dependency injection)
    handleDrop(
      dragData: DragData,
      targetPosition: { row: number; col: number }
    ): boolean {
      return store._handleDrop(dragData, targetPosition, {
        cells: store.cells(),
        rows: store.rows(),
        columns: store.columns(),
        dashboardService: store.dashboardService,
        createWidget: store.createWidget,
        updateWidgetPosition: store.updateWidgetPosition,
      });
    },

    // RESIZE METHODS (delegate to resize feature with dependency injection)
    startResize(cellId: CellId) {
      store._startResize(cellId, {
        cells: store.cells(),
      });
    },

    updateResizePreview(direction: 'horizontal' | 'vertical', delta: number) {
      store._updateResizePreview(direction, delta, {
        cells: store.cells(),
        rows: store.rows(),
        columns: store.columns(),
      });
    },

    endResize(apply: boolean) {
      store._endResize(apply, {
        updateWidgetSpan: store.updateWidgetSpanByCellId,  // Use backwards compatibility helper
      });
    },

    // EXPORT/IMPORT METHODS (need access to multiple features)
    exportDashboard(
      getCurrentWidgetStates?: () => Map<string, unknown>
    ): DashboardDataDto {
      // Get live widget states if callback provided, otherwise use stored states
      const liveWidgetStates =
        getCurrentWidgetStates?.() || new Map<string, unknown>();

      return {
        version: '1.0.0',
        dashboardId: store.dashboardId(),
        rows: store.rows(),
        columns: store.columns(),
        gutterSize: store.gutterSize(),
        cells: store.cells()
          .filter((cell) => cell.widgetFactory.widgetTypeid !== '__internal/unknown-widget')
          .map((cell) => {
            // Try to get live state by widgetId first, then fall back to cellId for backwards compatibility
            const widgetIdString = WidgetIdUtils.toString(cell.widgetId);
            const cellIdString = CellIdUtils.toString(cell.cellId);
            const currentState = liveWidgetStates.get(widgetIdString) ?? liveWidgetStates.get(cellIdString);

            return {
              row: cell.row,
              col: cell.col,
              rowSpan: cell.rowSpan,
              colSpan: cell.colSpan,
              flat: cell.flat,
              widgetTypeid: cell.widgetFactory.widgetTypeid,
              widgetState:
                currentState !== undefined ? currentState : cell.widgetState,
            };
          }),
      };
    },

    loadDashboard(data: DashboardDataDto): void {
      // Import full dashboard data with grid configuration
      const widgetsById: Record<string, CellData> = {};
      
      data.cells.forEach((cellData) => {
        const factory = store.dashboardService.getFactory(
          cellData.widgetTypeid
        );

        const widgetId = WidgetIdUtils.generate();
        const cell: CellData = {
          widgetId,
          cellId: CellIdUtils.create(cellData.row, cellData.col),
          row: cellData.row,
          col: cellData.col,
          rowSpan: cellData.rowSpan,
          colSpan: cellData.colSpan,
          flat: cellData.flat,
          widgetFactory: factory,
          widgetState: cellData.widgetState,
        };
        
        widgetsById[WidgetIdUtils.toString(widgetId)] = cell;
      });

      patchState(store, {
        dashboardId: data.dashboardId,
        rows: data.rows,
        columns: data.columns,
        gutterSize: data.gutterSize,
        widgetsById,
      });
    },

    // INITIALIZATION METHODS
    initializeFromDto(dashboardData: DashboardDataDto): void {
      // Inline the loadDashboard logic since it's defined later in the same methods block
      const widgetsById: Record<string, CellData> = {};
      
      dashboardData.cells.forEach((cellData) => {
        const factory = store.dashboardService.getFactory(
          cellData.widgetTypeid
        );

        const widgetId = WidgetIdUtils.generate();
        const cell: CellData = {
          widgetId,
          cellId: CellIdUtils.create(cellData.row, cellData.col),
          row: cellData.row,
          col: cellData.col,
          rowSpan: cellData.rowSpan,
          colSpan: cellData.colSpan,
          flat: cellData.flat,
          widgetFactory: factory,
          widgetState: cellData.widgetState,
        };
        
        widgetsById[WidgetIdUtils.toString(widgetId)] = cell;
      });

      patchState(store, {
        dashboardId: dashboardData.dashboardId,
        rows: dashboardData.rows,
        columns: dashboardData.columns,
        gutterSize: dashboardData.gutterSize,
        widgetsById,
      });
    },
  })),

  // Cross-feature computed properties that depend on resize + widget data (using utility functions)
  withComputed((store) => ({
    // Compute preview cells during resize using utility function
    resizePreviewCells: computed(() => {
      return ResizePreviewUtils.computePreviewCells(
        store.resizeData(),
        store.cells()
      );
    }),
  })),

  // Second computed block that depends on the first
  withComputed((store) => ({
    // Map for resize preview highlighting using utility function
    resizePreviewMap: computed(() => {
      return ResizePreviewUtils.computePreviewMap(store.resizePreviewCells());
    }),
  }))
);
