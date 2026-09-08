import {
  CellData,
  CellIdUtils,
  DEFAULT_GRID_SIZE_LIMITS,
  GridSizeLimits,
  WidgetFactory,
  WidgetIdUtils,
} from '../../../../models';
import { clampGridSize, minGridSizeFor } from '../grid-resize.utils';

describe('clampGridSize', () => {
  const factory = {
    widgetTypeid: 'test-widget',
    createComponent: () => undefined,
  } as unknown as WidgetFactory;

  /** Helper: a widget occupying (row,col) with the given span. */
  function cell(row: number, col: number, rowSpan = 1, colSpan = 1): CellData {
    return {
      widgetId: WidgetIdUtils.generate(),
      cellId: CellIdUtils.create(row, col),
      row,
      col,
      rowSpan,
      colSpan,
      widgetFactory: factory,
      widgetState: {},
    };
  }

  /** No ceiling, so only the content floor constrains the request. */
  const UNCAPPED: GridSizeLimits = {
    maxRows: Infinity,
    maxColumns: Infinity,
  };

  describe('minGridSizeFor', () => {
    it('floors an empty dashboard at 1 x 1', () => {
      expect(minGridSizeFor([])).toEqual({ rows: 1, columns: 1 });
    });

    it('is span-aware', () => {
      // Origin at col 14 spanning 3 columns needs at least 16 columns.
      expect(minGridSizeFor([cell(5, 14, 2, 3)])).toEqual({
        rows: 6,
        columns: 16,
      });
    });
  });

  describe('without a ceiling', () => {
    it('returns the request when nothing constrains it', () => {
      expect(clampGridSize(10, 20, [], UNCAPPED)).toEqual({
        rows: 10,
        columns: 20,
        clamped: false,
      });
    });

    it('floors the request at the span-aware content extent', () => {
      // A widget at col 14 spanning 3 columns needs at least 16 columns.
      const result = clampGridSize(2, 4, [cell(5, 14, 2, 3)], UNCAPPED);
      expect(result).toEqual({ rows: 6, columns: 16, clamped: true });
    });

    it('treats values below 1 as 1 and floors fractions', () => {
      expect(clampGridSize(0, -3, [], UNCAPPED)).toEqual({
        rows: 1,
        columns: 1,
        clamped: false,
      });
      expect(clampGridSize(4.9, 7.2, [], UNCAPPED).rows).toBe(4);
      expect(clampGridSize(4.9, 7.2, [], UNCAPPED).columns).toBe(7);
    });

    it('sanitizes non-finite input to 1', () => {
      expect(clampGridSize(NaN, Infinity, [], UNCAPPED)).toEqual({
        rows: 1,
        columns: 1,
        clamped: false,
      });
    });
  });

  describe('with a ceiling', () => {
    const limits = DEFAULT_GRID_SIZE_LIMITS;

    it('caps a request above the ceiling', () => {
      const result = clampGridSize(500, 900, [], limits);
      expect(result).toEqual({ rows: 64, columns: 128, clamped: true });
    });

    it('leaves a request below the ceiling untouched', () => {
      expect(clampGridSize(8, 16, [], limits)).toEqual({
        rows: 8,
        columns: 16,
        clamped: false,
      });
    });

    it('caps each axis independently', () => {
      const result = clampGridSize(8, 900, [], limits);
      expect(result.rows).toBe(8);
      expect(result.columns).toBe(128);
    });

    it('lets the content floor outrank the ceiling', () => {
      // A dashboard imported with widgets beyond the cap must keep its size:
      // capping it would push widgets out of bounds, which is exactly what
      // clamp-to-content exists to prevent.
      const result = clampGridSize(10, 10, [cell(80, 200)], {
        maxRows: 64,
        maxColumns: 128,
      });
      expect(result.rows).toBe(80);
      expect(result.columns).toBe(200);
      expect(result.clamped).toBeTrue();
    });

    it('ignores a non-finite ceiling', () => {
      // A host can bind NaN to maxRows; that imposes no cap rather than
      // collapsing the grid to 1.
      const result = clampGridSize(500, 900, [], {
        maxRows: NaN,
        maxColumns: Infinity,
      });
      expect(result).toEqual({ rows: 500, columns: 900, clamped: false });
    });

    it('floors a fractional ceiling and keeps it positive', () => {
      expect(clampGridSize(50, 50, [], { maxRows: 10.9, maxColumns: 0 })).toEqual(
        { rows: 10, columns: 1, clamped: true }
      );
    });
  });
});
