import { signalStoreFeature, withMethods, withState, patchState } from '@ngrx/signals';

export interface GridConfigState {
  rows: number;
  columns: number;
  gutterSize: string;
  isEditMode: boolean;
  gridCellDimensions: { width: number; height: number };
}

const initialGridConfigState: GridConfigState = {
  rows: 8,
  columns: 16,
  gutterSize: '0.5em',
  isEditMode: false,
  gridCellDimensions: { width: 0, height: 0 },
};

export const withGridConfig = () =>
  signalStoreFeature(
    withState<GridConfigState>(initialGridConfigState),
    withMethods((store) => ({
      setGridConfig(config: {
        rows?: number;
        columns?: number;
        gutterSize?: string;
      }) {
        patchState(store, config);
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
    }))
  );