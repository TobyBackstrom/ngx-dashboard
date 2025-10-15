import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetFactory } from '../../models';
import { GridQueryInternalUtils } from '../features/utils/grid-query-internal.utils';

describe('DashboardStore - Resize Operations', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getFactory', 'collectSharedStates', 'restoreSharedStates']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    store.setGridConfig({ rows: 16, columns: 16 });
    
    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy()
    } as unknown as WidgetFactory;
  });

  describe('startResize', () => {
    it('should start resize for existing widget', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      store.startResize(cellId);

      expect(store.resizeData()).toEqual({
        cellId,
        originalRowSpan: 3,
        originalColSpan: 2,
        previewRowSpan: 3,
        previewColSpan: 2,
      });
    });

    it('should handle resize for single cell widget', () => {
      const cellId = CellIdUtils.create(8, 8);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 8,
        col: 8,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      store.startResize(cellId);

      expect(store.resizeData()).toEqual({
        cellId,
        originalRowSpan: 1,
        originalColSpan: 1,
        previewRowSpan: 1,
        previewColSpan: 1,
      });
    });

    it('should handle non-existent widget gracefully', () => {
      const nonExistentCellId = CellIdUtils.create(10, 10);

      store.startResize(nonExistentCellId);

      expect(store.resizeData()).toBeNull();
    });

    it('should replace existing resize data when starting new resize', () => {
      const cellId1 = CellIdUtils.create(3, 3);
      const cellId2 = CellIdUtils.create(8, 8);
      
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: cellId1,
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      
      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: cellId2,
        row: 8,
        col: 8,
        rowSpan: 1,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      store.startResize(cellId1);
      expect(store.resizeData()?.cellId).toEqual(cellId1);

      store.startResize(cellId2);
      expect(store.resizeData()?.cellId).toEqual(cellId2);
      expect(store.resizeData()?.originalColSpan).toBe(3);
    });

    it('should handle widget with maximum spans', () => {
      const cellId = CellIdUtils.create(1, 1);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 1,
        col: 1,
        rowSpan: 16,
        colSpan: 16,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      store.startResize(cellId);

      expect(store.resizeData()).toEqual({
        cellId,
        originalRowSpan: 16,
        originalColSpan: 16,
        previewRowSpan: 16,
        previewColSpan: 16,
      });
    });
  });

  describe('updateResizePreview', () => {
    beforeEach(() => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
      store.startResize(cellId);
    });

    describe('horizontal resizing', () => {
      it('should increase column span by positive delta', () => {
        store.updateResizePreview('horizontal', 2);

        expect(store.resizeData()?.previewColSpan).toBe(4);
        expect(store.resizeData()?.previewRowSpan).toBe(2); // unchanged
      });

      it('should decrease column span by negative delta', () => {
        store.updateResizePreview('horizontal', -1);

        expect(store.resizeData()?.previewColSpan).toBe(1);
        expect(store.resizeData()?.previewRowSpan).toBe(2); // unchanged
      });

      it('should not allow column span below 1', () => {
        store.updateResizePreview('horizontal', -5);

        expect(store.resizeData()?.previewColSpan).toBe(1);
      });

      it('should respect grid boundaries', () => {
        // Widget at (5,5) with original colSpan 2, grid has 16 columns
        // So max possible colSpan is 16 - 5 + 1 = 12
        store.updateResizePreview('horizontal', 20);

        expect(store.resizeData()?.previewColSpan).toBe(12);
      });
    });

    describe('vertical resizing', () => {
      it('should increase row span by positive delta', () => {
        store.updateResizePreview('vertical', 3);

        expect(store.resizeData()?.previewRowSpan).toBe(5);
        expect(store.resizeData()?.previewColSpan).toBe(2); // unchanged
      });

      it('should decrease row span by negative delta', () => {
        store.updateResizePreview('vertical', -1);

        expect(store.resizeData()?.previewRowSpan).toBe(1);
        expect(store.resizeData()?.previewColSpan).toBe(2); // unchanged
      });

      it('should not allow row span below 1', () => {
        store.updateResizePreview('vertical', -10);

        expect(store.resizeData()?.previewRowSpan).toBe(1);
      });

      it('should respect grid boundaries', () => {
        // Widget at (5,5) with original rowSpan 2, grid has 16 rows
        // So max possible rowSpan is 16 - 5 + 1 = 12
        store.updateResizePreview('vertical', 15);

        expect(store.resizeData()?.previewRowSpan).toBe(12);
      });
    });

    describe('collision detection during resize', () => {
      beforeEach(() => {
        // Add blocking widget at (5, 8) to (6, 9)
        const blockingCell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 8),
          row: 5,
          col: 8,
          rowSpan: 2,
          colSpan: 2,
          widgetFactory: mockWidgetFactory,
          widgetState: {},
        };
        store.addWidget(blockingCell);
      });

      it('should be limited by horizontal collision', () => {
        // Widget at (5,5) with colSpan 2, blocking widget at (5,8)
        // Max possible expansion is to column 7 (colSpan = 3)
        store.updateResizePreview('horizontal', 5);

        expect(store.resizeData()?.previewColSpan).toBe(3);
      });

      it('should be limited by vertical collision', () => {
        // Add blocking widget at (8, 5) to test vertical collision
        const verticalBlockingCell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(8, 5),
          row: 8,
          col: 5,
          rowSpan: 2,
          colSpan: 2,
          widgetFactory: mockWidgetFactory,
          widgetState: {},
        };
        store.addWidget(verticalBlockingCell);

        // Widget at (5,5) with rowSpan 2, blocking widget at (8,5)
        // Max possible expansion is to row 7 (rowSpan = 3)
        store.updateResizePreview('vertical', 10);

        expect(store.resizeData()?.previewRowSpan).toBe(3);
      });
    });

    it('should handle no active resize data gracefully', () => {
      store.endResize(false); // Clear resize data

      store.updateResizePreview('horizontal', 2);

      expect(store.resizeData()).toBeNull();
    });

    it('should handle multiple consecutive preview updates', () => {
      store.updateResizePreview('horizontal', 1);
      expect(store.resizeData()?.previewColSpan).toBe(3);

      store.updateResizePreview('horizontal', 2);
      expect(store.resizeData()?.previewColSpan).toBe(4);

      store.updateResizePreview('vertical', 1);
      expect(store.resizeData()?.previewRowSpan).toBe(3);
      expect(store.resizeData()?.previewColSpan).toBe(4); // Should remain unchanged
    });
  });

  describe('endResize', () => {
    let cellId: ReturnType<typeof CellIdUtils.create>;

    beforeEach(() => {
      cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
      store.startResize(cellId);
    });

    it('should apply resize changes when apply is true and preview differs', () => {
      store.updateResizePreview('horizontal', 2);
      store.updateResizePreview('vertical', 1);

      store.endResize(true);

      const updatedCell = GridQueryInternalUtils.getCellAt(store.cells(), 5, 5);
      expect(updatedCell?.rowSpan).toBe(3);
      expect(updatedCell?.colSpan).toBe(4);
      expect(store.resizeData()).toBeNull();
    });

    it('should not apply changes when apply is false', () => {
      store.updateResizePreview('horizontal', 3);
      store.updateResizePreview('vertical', 2);

      store.endResize(false);

      const cell = GridQueryInternalUtils.getCellAt(store.cells(), 5, 5);
      expect(cell?.rowSpan).toBe(2); // Original value
      expect(cell?.colSpan).toBe(2); // Original value
      expect(store.resizeData()).toBeNull();
    });

    it('should not apply changes when preview equals original', () => {
      // Don't change anything in preview
      store.endResize(true);

      const cell = GridQueryInternalUtils.getCellAt(store.cells(), 5, 5);
      expect(cell?.rowSpan).toBe(2);
      expect(cell?.colSpan).toBe(2);
      expect(store.resizeData()).toBeNull();
    });

    it('should handle partial changes (only one dimension changed)', () => {
      store.updateResizePreview('horizontal', 1); // Only change colSpan

      store.endResize(true);

      const cell = GridQueryInternalUtils.getCellAt(store.cells(), 5, 5);
      expect(cell?.rowSpan).toBe(2); // Unchanged
      expect(cell?.colSpan).toBe(3); // Changed
      expect(store.resizeData()).toBeNull();
    });

    it('should handle no active resize data gracefully', () => {
      store.endResize(false); // Clear resize data first

      store.endResize(true); // Try to end again

      expect(store.resizeData()).toBeNull();
    });

    it('should clear resize data even when widget no longer exists', () => {
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!; store.removeWidget(widget.widgetId); // Remove the widget

      store.endResize(true);

      expect(store.resizeData()).toBeNull();
    });

    it('should handle apply with maximum size changes', () => {
      // Try to resize to maximum grid size
      store.updateResizePreview('horizontal', 20);
      store.updateResizePreview('vertical', 20);

      store.endResize(true);

      const cell = GridQueryInternalUtils.getCellAt(store.cells(), 5, 5);
      expect(cell?.rowSpan).toBe(12); // Max possible from position (5,5)
      expect(cell?.colSpan).toBe(12); // Max possible from position (5,5)
      expect(store.resizeData()).toBeNull();
    });
  });

  describe('resizePreviewCells computed property', () => {
    let cellId: ReturnType<typeof CellIdUtils.create>;

    beforeEach(() => {
      cellId = CellIdUtils.create(3, 4);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 3,
        col: 4,
        rowSpan: 2,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
    });

    it('should return empty array when no resize is active', () => {
      expect(store.resizePreviewCells()).toEqual([]);
    });

    it('should return preview cells for current resize operation', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 1);
      store.updateResizePreview('vertical', 1);

      const previewCells = store.resizePreviewCells();

      // Should be 3x4 grid starting at (3,4)
      expect(previewCells.length).toBe(12);
      expect(previewCells).toContain(jasmine.objectContaining({ row: 3, col: 4 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 3, col: 7 })); // rightmost
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 4 })); // bottommost
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 7 })); // bottom-right corner
    });

    it('should update when resize preview changes', () => {
      store.startResize(cellId);

      // Initial preview
      let previewCells = store.resizePreviewCells();
      expect(previewCells.length).toBe(6); // 2x3

      // Update preview
      store.updateResizePreview('horizontal', 2);
      previewCells = store.resizePreviewCells();
      expect(previewCells.length).toBe(10); // 2x5

      store.updateResizePreview('vertical', 1);
      previewCells = store.resizePreviewCells();
      expect(previewCells.length).toBe(15); // 3x5
    });

    it('should handle single cell preview', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', -2);
      store.updateResizePreview('vertical', -1);

      const previewCells = store.resizePreviewCells();

      expect(previewCells.length).toBe(1);
      expect(previewCells[0]).toEqual({ row: 3, col: 4 });
    });

    it('should return empty array when widget is removed during resize', () => {
      store.startResize(cellId);
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!; store.removeWidget(widget.widgetId);

      expect(store.resizePreviewCells()).toEqual([]);
    });
  });

  describe('resizePreviewMap computed property', () => {
    let cellId: ReturnType<typeof CellIdUtils.create>;

    beforeEach(() => {
      cellId = CellIdUtils.create(8, 8);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 8,
        col: 8,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
    });

    it('should return empty set when no resize is active', () => {
      expect(store.resizePreviewMap().size).toBe(0);
    });

    it('should contain cell IDs for all preview cells', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 2);
      store.updateResizePreview('vertical', 1);

      const previewMap = store.resizePreviewMap();

      expect(previewMap.size).toBe(6); // 2x3 grid
      expect(previewMap.has(CellIdUtils.create(8, 8))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 9))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 10))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(9, 8))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(9, 9))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(9, 10))).toBe(true);
    });

    it('should update when preview cells change', () => {
      store.startResize(cellId);

      let previewMap = store.resizePreviewMap();
      expect(previewMap.size).toBe(1);

      store.updateResizePreview('horizontal', 1);
      previewMap = store.resizePreviewMap();
      expect(previewMap.size).toBe(2);

      store.updateResizePreview('vertical', 1);
      previewMap = store.resizePreviewMap();
      expect(previewMap.size).toBe(4);
    });

    it('should efficiently check cell membership', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 1);

      const previewMap = store.resizePreviewMap();

      expect(previewMap.has(CellIdUtils.create(8, 8))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 9))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 10))).toBe(false);
      expect(previewMap.has(CellIdUtils.create(9, 8))).toBe(false);
    });
  });

  describe('resize integration scenarios', () => {
    it('should handle complete resize workflow', () => {
      const cellId = CellIdUtils.create(2, 2);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      // Start resize
      store.startResize(cellId);
      expect(store.resizeData()).toBeTruthy();
      expect(store.resizePreviewCells().length).toBe(1);

      // Update preview multiple times
      store.updateResizePreview('horizontal', 2);
      expect(store.resizePreviewCells().length).toBe(3);

      store.updateResizePreview('vertical', 1);
      expect(store.resizePreviewCells().length).toBe(6);

      // Apply changes
      store.endResize(true);
      expect(store.resizeData()).toBeNull();
      expect(store.resizePreviewCells().length).toBe(0);

      const updatedCell = GridQueryInternalUtils.getCellAt(store.cells(), 2, 2);
      expect(updatedCell?.rowSpan).toBe(2);
      expect(updatedCell?.colSpan).toBe(3);
    });

    it('should handle resize cancellation workflow', () => {
      const cellId = CellIdUtils.create(10, 10);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 10,
        col: 10,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      // Start resize and make changes
      store.startResize(cellId);
      store.updateResizePreview('horizontal', -1);
      store.updateResizePreview('vertical', -2);

      // Cancel changes
      store.endResize(false);

      const cell_after = GridQueryInternalUtils.getCellAt(store.cells(), 10, 10);
      expect(cell_after?.rowSpan).toBe(3); // Original values preserved
      expect(cell_after?.colSpan).toBe(3);
      expect(store.resizeData()).toBeNull();
    });

    it('should handle resize with complex grid layout', () => {
      // Create a complex layout with multiple widgets
      const widgets = [
        { cellId: CellIdUtils.create(1, 1), row: 1, col: 1, rowSpan: 2, colSpan: 2 },
        { cellId: CellIdUtils.create(1, 4), row: 1, col: 4, rowSpan: 1, colSpan: 3 },
        { cellId: CellIdUtils.create(3, 1), row: 3, col: 1, rowSpan: 1, colSpan: 6 },
        { cellId: CellIdUtils.create(5, 5), row: 5, col: 5, rowSpan: 2, colSpan: 2 },
      ];

      widgets.forEach(w => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: w.cellId,
          row: w.row,
          col: w.col,
          rowSpan: w.rowSpan,
          colSpan: w.colSpan,
          widgetFactory: mockWidgetFactory,
          widgetState: {},
        };
        store.addWidget(cell);
      });

      // Try to resize widget at (1,1) - should be limited by other widgets
      store.startResize(widgets[0].cellId);
      store.updateResizePreview('horizontal', 5);
      store.updateResizePreview('vertical', 5);

      // Should be limited by the widget at (1,4) horizontally and (3,1) vertically
      expect(store.resizeData()?.previewColSpan).toBe(3); // Limited by widget at (1,4)
      expect(store.resizeData()?.previewRowSpan).toBe(2); // Limited by widget at (3,1)
    });

    it('should handle edge case: resize at grid boundaries', () => {
      const cellId = CellIdUtils.create(16, 16);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 16,
        col: 16,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      store.startResize(cellId);
      store.updateResizePreview('horizontal', 5);
      store.updateResizePreview('vertical', 5);

      // Should be limited by grid boundaries
      expect(store.resizeData()?.previewRowSpan).toBe(1);
      expect(store.resizeData()?.previewColSpan).toBe(1);
    });
  });
});