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
  DragData,
  WidgetFactory,
  WidgetId,
} from '../../models';
import {
  calculateCollisionInfo,
  calculateHighlightedZones,
} from './utils/collision.utils';
import { DashboardService } from '../../services/dashboard.service';

export interface DragDropState {
  dragData: DragData | null;
  hoveredDropZone: { row: number; col: number } | null;
}

const initialDragDropState: DragDropState = {
  dragData: null,
  hoveredDropZone: null,
};

export const withDragDrop = () =>
  signalStoreFeature(
    withState<DragDropState>(initialDragDropState),
    withComputed((store) => ({
      // Highlighted zones during drag
      highlightedZones: computed(() =>
        calculateHighlightedZones(store.dragData(), store.hoveredDropZone()),
      ),
    })),
    withComputed((store) => ({
      // Map for quick highlight lookup - reuse highlightedZones computation
      highlightMap: computed(() => {
        const zones = store.highlightedZones();
        const map = new Set<CellId>();

        for (const z of zones) {
          map.add(CellIdUtils.create(z.row, z.col));
        }

        return map;
      }),
    })),
    withMethods((store) => ({
      startDrag(dragData: DragData) {
        patchState(store, { dragData });
      },

      endDrag() {
        patchState(store, {
          dragData: null,
          hoveredDropZone: null,
        });
      },

      setHoveredDropZone(zone: { row: number; col: number } | null) {
        patchState(store, { hoveredDropZone: zone });
      },
    })),

    // Second withMethods block for drop handling that can access endDrag
    withMethods((store) => ({
      // Drop handling logic with dependency injection
      _handleDrop(
        dragData: DragData,
        targetPosition: { row: number; col: number },
        dependencies: {
          cells: CellData[];
          rows: number;
          columns: number;
          dashboardService: DashboardService;
          createWidget: (
            row: number,
            col: number,
            factory: WidgetFactory,
            widgetState?: string,
          ) => void;
          updateWidgetPosition: (
            widgetId: WidgetId,
            row: number,
            col: number,
          ) => void;
        },
      ): boolean {
        // 1. Validate placement using existing collision detection
        const collisionInfo = calculateCollisionInfo(
          dragData,
          targetPosition,
          dependencies.cells,
          dependencies.rows,
          dependencies.columns,
        );

        // 2. End drag state first
        store.endDrag();

        // 3. Early return if invalid placement
        if (collisionInfo.hasCollisions || collisionInfo.outOfBounds) {
          return false;
        }

        // 4. Handle widget creation from palette
        if (dragData.kind === 'widget') {
          const factory = dependencies.dashboardService.getFactory(
            dragData.content.widgetTypeid,
          );
          dependencies.createWidget(
            targetPosition.row,
            targetPosition.col,
            factory,
            undefined,
          );
          return true;
        }

        // 5. Handle cell movement
        if (dragData.kind === 'cell') {
          dependencies.updateWidgetPosition(
            dragData.content.widgetId,  // Use widgetId instead of cellId
            targetPosition.row,
            targetPosition.col,
          );
          return true;
        }

        return false;
      },
    })),
  );
