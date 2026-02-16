import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import {
  WidgetFactory,
  DashboardDataDto,
  CellDataDto,
  UNKNOWN_WIDGET_TYPEID,
} from '../../models';

function createTestDto(cells: CellDataDto[]): DashboardDataDto {
  return {
    version: '1.1.0',
    dashboardId: 'test',
    rows: 8,
    columns: 12,
    gutterSize: '0.5em',
    cells,
  };
}

describe('DashboardStore - Widget Type Healing', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let widgetTypesSignal: WritableSignal<unknown[]>;

  const unknownFactory: WidgetFactory = {
    widgetTypeid: UNKNOWN_WIDGET_TYPEID,
    name: 'Unknown Widget',
    description: 'Unknown widget type',
    svgIcon: '<svg></svg>',
    createInstance: jasmine.createSpy('createInstance'),
  };

  const realFactory: WidgetFactory = {
    widgetTypeid: 'lazy-widget',
    name: 'Lazy Widget',
    description: 'A lazily loaded widget',
    svgIcon: '<svg><circle r="5"/></svg>',
    createInstance: jasmine.createSpy('createInstance'),
  };

  const otherRealFactory: WidgetFactory = {
    widgetTypeid: 'other-widget',
    name: 'Other Widget',
    description: 'Another widget',
    svgIcon: '<svg><rect width="5" height="5"/></svg>',
    createInstance: jasmine.createSpy('createInstance'),
  };

  beforeEach(() => {
    // Use a real signal for widgetTypes so computed dependency tracking works
    widgetTypesSignal = signal<unknown[]>([]);

    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getFactory',
      'collectSharedStates',
      'restoreSharedStates',
    ], { widgetTypes: widgetTypesSignal.asReadonly() });

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy },
      ],
    });

    store = TestBed.inject(DashboardStore);
    mockDashboardService = TestBed.inject(
      DashboardService
    ) as jasmine.SpyObj<DashboardService>;
    store.setGridConfig({ rows: 8, columns: 12 });

    mockDashboardService.collectSharedStates.and.returnValue(new Map());
    mockDashboardService.restoreSharedStates.and.stub();
  });

  describe('late-registered widget type healing', () => {
    it('should show unknown factory when widget type is not registered', () => {
      mockDashboardService.getFactory.and.returnValue(unknownFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: { data: 'preserved' } },
      ]));

      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].widgetFactory.widgetTypeid).toBe(
        UNKNOWN_WIDGET_TYPEID
      );
      expect(store.cells()[0].widgetTypeid).toBe('lazy-widget');
    });

    it('should heal unknown factory when widget type is later registered', () => {
      mockDashboardService.getFactory.and.returnValue(unknownFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: { data: 'preserved' } },
      ]));

      expect(store.cells()[0].widgetFactory.widgetTypeid).toBe(
        UNKNOWN_WIDGET_TYPEID
      );

      // Simulate late registration: getFactory now returns real factory
      mockDashboardService.getFactory.and.callFake((id: string) =>
        id === 'lazy-widget' ? realFactory : unknownFactory
      );
      // Real signal update triggers computed re-evaluation
      widgetTypesSignal.set([{}]);

      const cells = store.cells();
      expect(cells.length).toBe(1);
      expect(cells[0].widgetFactory.widgetTypeid).toBe('lazy-widget');
      expect(cells[0].widgetFactory).toBe(realFactory);
    });

    it('should preserve widget state after healing', () => {
      mockDashboardService.getFactory.and.returnValue(unknownFactory);

      store.loadDashboard(createTestDto([
        { row: 2, col: 3, rowSpan: 2, colSpan: 3, flat: true, widgetTypeid: 'lazy-widget', widgetState: { temperature: 42, unit: 'C' } },
      ]));

      // Heal
      mockDashboardService.getFactory.and.callFake((id: string) =>
        id === 'lazy-widget' ? realFactory : unknownFactory
      );
      widgetTypesSignal.set([{}]);

      const healed = store.cells()[0];
      expect(healed.widgetState).toEqual({ temperature: 42, unit: 'C' });
      expect(healed.row).toBe(2);
      expect(healed.col).toBe(3);
      expect(healed.rowSpan).toBe(2);
      expect(healed.colSpan).toBe(3);
      expect(healed.flat).toBe(true);
    });

    it('should heal only unresolved widgets in a mixed dashboard', () => {
      mockDashboardService.getFactory.and.callFake((id: string) => {
        if (id === 'other-widget') return otherRealFactory;
        return unknownFactory;
      });

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'other-widget', widgetState: {} },
        { row: 2, col: 2, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: { data: 'lazy-data' } },
      ]));

      const cellsBefore = store.cells();
      const otherCell = cellsBefore.find(
        (c) => c.widgetTypeid === 'other-widget'
      )!;
      const lazyCell = cellsBefore.find(
        (c) => c.widgetTypeid === 'lazy-widget'
      )!;

      expect(otherCell.widgetFactory.widgetTypeid).toBe('other-widget');
      expect(lazyCell.widgetFactory.widgetTypeid).toBe(UNKNOWN_WIDGET_TYPEID);

      // Heal lazy-widget
      mockDashboardService.getFactory.and.callFake((id: string) => {
        if (id === 'other-widget') return otherRealFactory;
        if (id === 'lazy-widget') return realFactory;
        return unknownFactory;
      });
      widgetTypesSignal.set([{}]);

      const cellsAfter = store.cells();
      const otherAfter = cellsAfter.find(
        (c) => c.widgetTypeid === 'other-widget'
      )!;
      const lazyAfter = cellsAfter.find(
        (c) => c.widgetTypeid === 'lazy-widget'
      )!;

      expect(otherAfter.widgetFactory.widgetTypeid).toBe('other-widget');
      expect(lazyAfter.widgetFactory.widgetTypeid).toBe('lazy-widget');
    });

    it('should return same cell references when all widgets are already resolved', () => {
      mockDashboardService.getFactory.and.returnValue(otherRealFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'other-widget', widgetState: {} },
      ]));

      // Read cells once (all resolved, fast path - no widgetTypes dependency)
      const cellsBefore = store.cells();

      // Signal change should not cause re-evaluation since widgetTypes was never read
      widgetTypesSignal.set([{}]);
      const cellsAfter = store.cells();

      expect(cellsAfter).toBe(cellsBefore);
    });

    it('should export correct widgetTypeid after healing', () => {
      mockDashboardService.getFactory.and.returnValue(unknownFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: { key: 'value' } },
      ]));

      // Heal
      mockDashboardService.getFactory.and.callFake((id: string) =>
        id === 'lazy-widget' ? realFactory : unknownFactory
      );
      widgetTypesSignal.set([{}]);

      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetTypeid).toBe('lazy-widget');
      expect(exported.cells[0].widgetState).toEqual({ key: 'value' });
    });

    it('should export correct widgetTypeid for unhealed widgets', () => {
      mockDashboardService.getFactory.and.returnValue(unknownFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: { preserved: true } },
      ]));

      // Export WITHOUT healing - widgetTypeid should still be preserved
      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetTypeid).toBe('lazy-widget');
      expect(exported.cells[0].widgetState).toEqual({ preserved: true });
    });
  });
});
