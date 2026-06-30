import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import { CellData, CellIdUtils, WidgetFactory, WidgetIdUtils } from '../../models';

describe('DashboardStore - Grid Configuration', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;

  /** Helper: place a widget at (row,col) with the given span. */
  function placeWidget(
    row: number,
    col: number,
    rowSpan = 1,
    colSpan = 1
  ): void {
    const cell: CellData = {
      widgetId: WidgetIdUtils.generate(),
      cellId: CellIdUtils.create(row, col),
      row,
      col,
      rowSpan,
      colSpan,
      widgetFactory: mockWidgetFactory,
      widgetState: {},
    };
    store.addWidget(cell);
  }

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getFactory', 'collectSharedStates', 'restoreSharedStates', 'widgetTypes']);

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    });

    store = TestBed.inject(DashboardStore);
    store.setGridConfig({ rows: 8, columns: 16 });

    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy(),
    } as unknown as WidgetFactory;
  });

  describe('setGridConfig', () => {
    it('should update rows only', () => {
      store.setGridConfig({ rows: 12 });
      expect(store.rows()).toBe(12);
      expect(store.columns()).toBe(16); // unchanged
      expect(store.gutterSize()).toBe('0.5em'); // unchanged
    });

    it('should update columns only', () => {
      store.setGridConfig({ columns: 20 });
      expect(store.columns()).toBe(20);
      expect(store.rows()).toBe(8); // unchanged
    });

    it('should update gutterSize only', () => {
      store.setGridConfig({ gutterSize: '1em' });
      expect(store.gutterSize()).toBe('1em');
      expect(store.rows()).toBe(8); // unchanged
      expect(store.columns()).toBe(16); // unchanged
    });

    it('should update multiple properties at once', () => {
      store.setGridConfig({ rows: 10, columns: 24, gutterSize: '2rem' });
      expect(store.rows()).toBe(10);
      expect(store.columns()).toBe(24);
      expect(store.gutterSize()).toBe('2rem');
    });

    it('should handle edge case values', () => {
      store.setGridConfig({ rows: 1, columns: 1, gutterSize: '0px' });
      expect(store.rows()).toBe(1);
      expect(store.columns()).toBe(1);
      expect(store.gutterSize()).toBe('0px');
    });
  });

  describe('setGridSize', () => {
    it('should grow rows and columns on an empty dashboard', () => {
      const result = store.setGridSize(12, 24);

      expect(store.rows()).toBe(12);
      expect(store.columns()).toBe(24);
      expect(result).toEqual({ rows: 12, columns: 24, clamped: false });
    });

    it('should shrink freely when no widget blocks the new bounds', () => {
      placeWidget(2, 3); // occupies up to row 2, col 3

      const result = store.setGridSize(4, 6);

      expect(store.rows()).toBe(4);
      expect(store.columns()).toBe(6);
      expect(result.clamped).toBe(false);
    });

    it('should clamp shrink up to the occupied row/column extent', () => {
      placeWidget(6, 10); // furthest widget origin

      const result = store.setGridSize(2, 2);

      expect(store.rows()).toBe(6);
      expect(store.columns()).toBe(10);
      expect(result).toEqual({ rows: 6, columns: 10, clamped: true });
    });

    it('should account for widget span when computing the content floor', () => {
      // Origin at col 14 but spans 3 columns => needs at least 16 columns,
      // origin at row 7 spanning 2 rows => needs at least 8 rows.
      placeWidget(7, 14, 2, 3);

      const result = store.setGridSize(4, 4);

      expect(store.rows()).toBe(8);
      expect(store.columns()).toBe(16);
      expect(result.clamped).toBe(true);
    });

    it('should clamp only the constrained axis', () => {
      placeWidget(6, 2); // tall content, narrow content

      const result = store.setGridSize(3, 5);

      // Rows clamped up to 6, columns honored at 5.
      expect(store.rows()).toBe(6);
      expect(store.columns()).toBe(5);
      expect(result).toEqual({ rows: 6, columns: 5, clamped: true });
    });

    it('should floor fractional requests and never go below 1', () => {
      const result = store.setGridSize(0, 5.9);

      expect(store.rows()).toBe(1);
      expect(store.columns()).toBe(5);
      expect(result).toEqual({ rows: 1, columns: 5, clamped: false });
    });

    it('should sanitize non-finite requests instead of committing NaN', () => {
      const result = store.setGridSize(NaN, Infinity);

      // Non-finite -> 1, then clamped to content (empty dashboard floor = 1).
      expect(store.rows()).toBe(1);
      expect(store.columns()).toBe(1);
      expect(Number.isFinite(result.rows)).toBe(true);
      expect(Number.isFinite(result.columns)).toBe(true);
    });
  });

  describe('grid resize preview', () => {
    it('should start with no preview', () => {
      expect(store.gridResizePreview()).toBeNull();
    });

    it('should store a clamped preview without committing the size', () => {
      store.previewGridResize(3, 4);

      // Preview reflects the would-be size; committed size is untouched.
      expect(store.gridResizePreview()).toEqual({
        rows: 11,
        columns: 20,
        clamped: false,
      });
      expect(store.rows()).toBe(8);
      expect(store.columns()).toBe(16);
    });

    it('should clamp a shrinking preview to the content floor', () => {
      placeWidget(6, 10);

      store.previewGridResize(-5, -8);

      expect(store.gridResizePreview()).toEqual({
        rows: 6,
        columns: 10,
        clamped: true,
      });
    });

    it('should clear the preview', () => {
      store.previewGridResize(2, 2);
      expect(store.gridResizePreview()).not.toBeNull();

      store.clearGridResizePreview();
      expect(store.gridResizePreview()).toBeNull();
    });

    it('should expose effective dimensions that follow the preview', () => {
      expect(store.effectiveRows()).toBe(8);
      expect(store.effectiveColumns()).toBe(16);

      store.previewGridResize(2, 3);
      expect(store.effectiveRows()).toBe(10);
      expect(store.effectiveColumns()).toBe(19);

      store.clearGridResizePreview();
      expect(store.effectiveRows()).toBe(8);
      expect(store.effectiveColumns()).toBe(16);
    });
  });

  describe('endGridResize', () => {
    it('should commit a non-zero delta and clear any active preview', () => {
      store.previewGridResize(2, 3);

      const result = store.endGridResize(2, 3);

      expect(result).toEqual({ rows: 10, columns: 19, clamped: false });
      expect(store.rows()).toBe(10);
      expect(store.columns()).toBe(19);
      expect(store.gridResizePreview()).toBeNull();
    });

    it('should return null and clear the preview for a zero delta', () => {
      store.previewGridResize(0, 0);

      const result = store.endGridResize(0, 0);

      expect(result).toBeNull();
      expect(store.rows()).toBe(8);
      expect(store.columns()).toBe(16);
      expect(store.gridResizePreview()).toBeNull();
    });

    it('should return null when clamp-to-content leaves the size unchanged', () => {
      placeWidget(8, 16); // pins the content floor at the current size

      // Non-zero shrink delta, but it clamps straight back to 8 x 16.
      const result = store.endGridResize(-2, -3);

      expect(result).toBeNull();
      expect(store.rows()).toBe(8);
      expect(store.columns()).toBe(16);
    });

    it('should clamp a relative shrink to the content floor', () => {
      placeWidget(6, 10);

      const result = store.endGridResize(-5, -8);

      expect(result).toEqual({ rows: 6, columns: 10, clamped: true });
      expect(store.rows()).toBe(6);
      expect(store.columns()).toBe(10);
    });
  });

  describe('setGridCellDimensions', () => {
    it('should update grid cell dimensions', () => {
      store.setGridCellDimensions(100, 50);
      expect(store.gridCellDimensions()).toEqual({ width: 100, height: 50 });
    });

    it('should handle zero dimensions', () => {
      store.setGridCellDimensions(0, 0);
      expect(store.gridCellDimensions()).toEqual({ width: 0, height: 0 });
    });

    it('should handle large dimensions', () => {
      store.setGridCellDimensions(9999, 9999);
      expect(store.gridCellDimensions()).toEqual({ width: 9999, height: 9999 });
    });

    it('should handle fractional dimensions', () => {
      store.setGridCellDimensions(100.5, 75.25);
      expect(store.gridCellDimensions()).toEqual({ width: 100.5, height: 75.25 });
    });
  });

  describe('toggleEditMode', () => {
    it('should toggle from false to true', () => {
      expect(store.isEditMode()).toBe(false);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(true);
    });

    it('should toggle from true to false', () => {
      store.setEditMode(true);
      expect(store.isEditMode()).toBe(true);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(false);
    });

    it('should toggle multiple times', () => {
      expect(store.isEditMode()).toBe(false);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(true);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(false);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(true);
    });
  });

  describe('setEditMode', () => {
    it('should set edit mode to true', () => {
      store.setEditMode(true);
      expect(store.isEditMode()).toBe(true);
    });

    it('should set edit mode to false', () => {
      store.setEditMode(false);
      expect(store.isEditMode()).toBe(false);
    });

    it('should be idempotent', () => {
      store.setEditMode(true);
      store.setEditMode(true);
      expect(store.isEditMode()).toBe(true);

      store.setEditMode(false);
      store.setEditMode(false);
      expect(store.isEditMode()).toBe(false);
    });
  });
});