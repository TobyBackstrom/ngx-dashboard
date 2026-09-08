import { signalStoreFeature, withMethods, withState, patchState } from '@ngrx/signals';
import { untracked } from '@angular/core';
import {
  DEFAULT_GRID_SIZE_LIMITS,
  GridSizeLimits,
  sanitizeGutterSize,
} from '../../models';

export interface GridConfigState {
  rows: number;
  columns: number;
  gutterSize: string;
  /** Upper bound for any resize path — typed entry and handle drags alike. */
  gridSizeLimits: GridSizeLimits;
  isEditMode: boolean;
  /**
   * Whether each widget shows its type name as a corner badge.
   *
   * A host-driven view aid rather than dashboard data, so it is deliberately
   * absent from `DashboardDataDto` — an exported dashboard does not carry
   * whichever way the badges happened to be switched when it was saved.
   */
  showWidgetNames: boolean;
  gridCellDimensions: { width: number; height: number };
}

const initialGridConfigState: GridConfigState = {
  rows: 8,
  columns: 16,
  gutterSize: '0.5em',
  gridSizeLimits: DEFAULT_GRID_SIZE_LIMITS,
  isEditMode: false,
  showWidgetNames: false,
  gridCellDimensions: { width: 0, height: 0 },
};

export const withGridConfig = () =>
  signalStoreFeature(
    withState<GridConfigState>(initialGridConfigState),
    withMethods((store) => ({
      /**
       * The single write path for committed grid geometry. Every other
       * geometry setter — including `loadDashboard()` — routes through here,
       * so "the committed gutter has always been sanitized" holds
       * structurally rather than by discipline at each caller.
       */
      setGridConfig(config: {
        rows?: number;
        columns?: number;
        gutterSize?: string;
      }) {
        patchState(store, {
          ...config,
          // An unusable gutter reaches --gutter-size and collapses the grid;
          // see gutter.utils.ts. Reading the fallback untracked keeps this
          // off the dependency list of effects that call the setter.
          gutterSize: sanitizeGutterSize(
            config.gutterSize,
            untracked(() => store.gutterSize())
          ),
        });
      },

      /** Set the ceiling applied to resize requests. */
      setGridSizeLimits(limits: GridSizeLimits) {
        patchState(store, { gridSizeLimits: limits });
      },

      setGridCellDimensions(width: number, height: number) {
        patchState(store, { gridCellDimensions: { width, height } });
      },

      toggleEditMode() {
        patchState(store, { isEditMode: !store.isEditMode() });
      },

      setEditMode(isEditMode: boolean) {
        patchState(store, { isEditMode });
      },

      /** Show or hide the widget type badge on every cell. */
      setShowWidgetNames(showWidgetNames: boolean) {
        patchState(store, { showWidgetNames });
      },
    })),
    withMethods((store) => ({
      /**
       * Apply a validated gutter size. Returns the value actually applied —
       * the current gutter when the requested one was rejected — mirroring
       * how setGridSize reports the size actually applied.
       */
      setGutterSize(value: string): string {
        store.setGridConfig({ gutterSize: value });
        return store.gutterSize();
      },
    }))
  );
