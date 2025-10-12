import { CellData, GridSelection, CellIdUtils, WidgetFactory, WidgetId } from '../../../../models';
import {
  calculateMinimalBoundingBox,
  applySelectionFilter,
  SelectionFilterOptions,
} from '../export.utils';

describe('export.utils', () => {
  // Mock widget factory for testing
  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg></svg>',
    createInstance: jasmine.createSpy('createInstance'),
  };

  // Helper function to create a mock cell
  function createMockCell(
    row: number,
    col: number,
    rowSpan = 1,
    colSpan = 1
  ): CellData {
    return {
      widgetId: `widget-${row}-${col}` as WidgetId,
      cellId: CellIdUtils.create(row, col),
      row,
      col,
      rowSpan,
      colSpan,
      flat: false,
      widgetFactory: mockWidgetFactory,
      widgetState: null,
    };
  }

  describe('calculateMinimalBoundingBox', () => {
    it('should return null for empty array', () => {
      const result = calculateMinimalBoundingBox([]);
      expect(result).toBeNull();
    });

    it('should calculate bounds for single widget', () => {
      const cells = [createMockCell(3, 5, 2, 3)];
      const result = calculateMinimalBoundingBox(cells);

      expect(result).toEqual({
        minRow: 3,
        maxRow: 4, // 3 + 2 - 1
        minCol: 5,
        maxCol: 7, // 5 + 3 - 1
      });
    });

    it('should calculate bounds for multiple widgets', () => {
      const cells = [
        createMockCell(2, 3, 1, 1),
        createMockCell(5, 7, 2, 2),
        createMockCell(3, 4, 1, 1),
      ];
      const result = calculateMinimalBoundingBox(cells);

      expect(result).toEqual({
        minRow: 2,
        maxRow: 6, // 5 + 2 - 1
        minCol: 3,
        maxCol: 8, // 7 + 2 - 1
      });
    });

    it('should handle widgets with spans correctly', () => {
      const cells = [
        createMockCell(1, 1, 3, 4), // ends at row 3, col 4
        createMockCell(5, 6, 2, 3), // ends at row 6, col 8
      ];
      const result = calculateMinimalBoundingBox(cells);

      expect(result).toEqual({
        minRow: 1,
        maxRow: 6,
        minCol: 1,
        maxCol: 8,
      });
    });

    it('should handle single cell widget', () => {
      const cells = [createMockCell(10, 15, 1, 1)];
      const result = calculateMinimalBoundingBox(cells);

      expect(result).toEqual({
        minRow: 10,
        maxRow: 10,
        minCol: 15,
        maxCol: 15,
      });
    });
  });

  describe('applySelectionFilter', () => {
    describe('without useMinimalBounds option', () => {
      it('should filter widgets within selection bounds', () => {
        const allCells = [
          createMockCell(1, 1),
          createMockCell(2, 2),
          createMockCell(3, 3),
          createMockCell(4, 4),
          createMockCell(5, 5),
        ];

        const selection: GridSelection = {
          topLeft: { row: 2, col: 2 },
          bottomRight: { row: 4, col: 4 },
        };

        const result = applySelectionFilter(selection, allCells);

        expect(result.cells.length).toBe(3);
        expect(result.cells.map(c => c.row)).toEqual([2, 3, 4]);
        expect(result.rows).toBe(3); // 4 - 2 + 1
        expect(result.columns).toBe(3); // 4 - 2 + 1
        expect(result.rowOffset).toBe(1); // 2 - 1
        expect(result.colOffset).toBe(1); // 2 - 1
      });

      it('should exclude widgets partially outside selection', () => {
        const allCells = [
          createMockCell(2, 2, 2, 2), // extends to 3,3 - fully inside
          createMockCell(3, 3, 2, 2), // extends to 4,4 - partially outside
        ];

        const selection: GridSelection = {
          topLeft: { row: 2, col: 2 },
          bottomRight: { row: 3, col: 3 },
        };

        const result = applySelectionFilter(selection, allCells);

        expect(result.cells.length).toBe(1);
        expect(result.cells[0].row).toBe(2);
      });

      it('should handle empty selection result', () => {
        const allCells = [
          createMockCell(1, 1),
          createMockCell(5, 5),
        ];

        const selection: GridSelection = {
          topLeft: { row: 2, col: 2 },
          bottomRight: { row: 3, col: 3 },
        };

        const result = applySelectionFilter(selection, allCells);

        expect(result.cells.length).toBe(0);
        expect(result.rows).toBe(2);
        expect(result.columns).toBe(2);
      });
    });

    describe('with useMinimalBounds option', () => {
      const options: SelectionFilterOptions = { useMinimalBounds: true };

      it('should shrink bounds to minimal bounding box', () => {
        const allCells = [
          createMockCell(3, 3),
          createMockCell(5, 5),
        ];

        // Large selection containing widgets with gaps
        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 8, col: 8 },
        };

        const result = applySelectionFilter(selection, allCells, options);

        expect(result.cells.length).toBe(2);
        expect(result.rows).toBe(3); // 5 - 3 + 1 (minimal bounds)
        expect(result.columns).toBe(3); // 5 - 3 + 1 (minimal bounds)
        expect(result.rowOffset).toBe(2); // 3 - 1 (starts at row 3)
        expect(result.colOffset).toBe(2); // 3 - 1 (starts at col 3)
      });

      it('should handle widgets with spans in minimal bounds', () => {
        const allCells = [
          createMockCell(3, 3, 2, 3), // extends to 4,5
          createMockCell(6, 4, 1, 2), // extends to 6,5
        ];

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 10, col: 10 },
        };

        const result = applySelectionFilter(selection, allCells, options);

        expect(result.cells.length).toBe(2);
        expect(result.rows).toBe(4); // 6 - 3 + 1 (row 3 to 6)
        expect(result.columns).toBe(3); // 5 - 3 + 1 (col 3 to 5)
        expect(result.rowOffset).toBe(2); // 3 - 1
        expect(result.colOffset).toBe(2); // 3 - 1
      });

      it('should handle empty selection with minimal bounds', () => {
        const allCells = [
          createMockCell(1, 1),
          createMockCell(10, 10),
        ];

        const selection: GridSelection = {
          topLeft: { row: 3, col: 3 },
          bottomRight: { row: 7, col: 7 },
        };

        const result = applySelectionFilter(selection, allCells, options);

        expect(result.cells.length).toBe(0);
        // When no widgets, falls back to selection bounds
        expect(result.rows).toBe(5); // 7 - 3 + 1
        expect(result.columns).toBe(5); // 7 - 3 + 1
        expect(result.rowOffset).toBe(2); // 3 - 1
        expect(result.colOffset).toBe(2); // 3 - 1
      });

      it('should handle single widget with minimal bounds', () => {
        const allCells = [
          createMockCell(5, 5, 2, 3), // extends to 6,7
        ];

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 10, col: 10 },
        };

        const result = applySelectionFilter(selection, allCells, options);

        expect(result.cells.length).toBe(1);
        expect(result.rows).toBe(2); // 6 - 5 + 1
        expect(result.columns).toBe(3); // 7 - 5 + 1
        expect(result.rowOffset).toBe(4); // 5 - 1
        expect(result.colOffset).toBe(4); // 5 - 1
      });

      it('should produce same result when selection already minimal', () => {
        const allCells = [
          createMockCell(2, 3),
          createMockCell(3, 4),
          createMockCell(4, 5),
        ];

        // Selection exactly matches widget bounds
        const selection: GridSelection = {
          topLeft: { row: 2, col: 3 },
          bottomRight: { row: 4, col: 5 },
        };

        const resultWithoutOption = applySelectionFilter(selection, allCells);
        const resultWithOption = applySelectionFilter(selection, allCells, options);

        expect(resultWithOption.rows).toBe(resultWithoutOption.rows);
        expect(resultWithOption.columns).toBe(resultWithoutOption.columns);
        expect(resultWithOption.rowOffset).toBe(resultWithoutOption.rowOffset);
        expect(resultWithOption.colOffset).toBe(resultWithoutOption.colOffset);
      });

      it('should handle scattered widgets with gaps', () => {
        const allCells = [
          createMockCell(2, 2),
          createMockCell(2, 8),
          createMockCell(8, 2),
          createMockCell(8, 8),
        ];

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 10, col: 10 },
        };

        const result = applySelectionFilter(selection, allCells, options);

        expect(result.cells.length).toBe(4);
        expect(result.rows).toBe(7); // 8 - 2 + 1
        expect(result.columns).toBe(7); // 8 - 2 + 1
        expect(result.rowOffset).toBe(1); // 2 - 1
        expect(result.colOffset).toBe(1); // 2 - 1
      });
    });

    describe('edge cases', () => {
      it('should handle selection at grid origin', () => {
        const allCells = [
          createMockCell(1, 1),
          createMockCell(2, 2),
        ];

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 2, col: 2 },
        };

        const result = applySelectionFilter(selection, allCells);

        expect(result.rowOffset).toBe(0); // 1 - 1
        expect(result.colOffset).toBe(0); // 1 - 1
      });

      it('should handle large spans crossing selection boundary', () => {
        const allCells = [
          createMockCell(1, 1, 10, 10), // large widget
        ];

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 5, col: 5 },
        };

        const result = applySelectionFilter(selection, allCells);

        expect(result.cells.length).toBe(0); // Widget extends beyond selection
      });
    });
  });
});