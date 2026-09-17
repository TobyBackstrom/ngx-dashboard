import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import {
  WidgetFactory,
  DashboardDataDto,
  CellDataDto,
  UNKNOWN_WIDGET_TYPEID,
  WidgetComponentClass,
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

    it('should revert a healed cell when the type is unregistered again', () => {
      mockDashboardService.getFactory.and.returnValue(unknownFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: { data: 'preserved' } },
      ]));

      mockDashboardService.getFactory.and.callFake((id: string) =>
        id === 'lazy-widget' ? realFactory : unknownFactory
      );
      widgetTypesSignal.set([{}]);
      expect(store.cells()[0].widgetFactory).toBe(realFactory);

      // A session that loses access again: healing runs in the computed only,
      // so dropping the registration puts the error view back.
      mockDashboardService.getFactory.and.returnValue(unknownFactory);
      widgetTypesSignal.set([]);

      const cells = store.cells();
      expect(cells[0].widgetFactory.widgetTypeid).toBe(UNKNOWN_WIDGET_TYPEID);
      expect(cells[0].widgetTypeid).toBe('lazy-widget');
      expect(cells[0].widgetState).toEqual({ data: 'preserved' });
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

    it('should keep the same cells array when a registry change resolves nothing new', () => {
      mockDashboardService.getFactory.and.returnValue(otherRealFactory);

      store.loadDashboard(createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'other-widget', widgetState: {} },
      ]));

      const cellsBefore = store.cells();

      // The registry changed, but every cell resolves to the factory it holds
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

// Same store, real registry: the mocked suite above cannot catch a mismatch
// between what the store expects of getFactory() and what the service returns.
describe('DashboardStore - Widget Type Healing with the real DashboardService', () => {
  let store: InstanceType<typeof DashboardStore>;
  let service: DashboardService;

  const widgetClass = (widgetTypeid: string) =>
    class {
      static metadata = {
        widgetTypeid,
        name: widgetTypeid,
        description: widgetTypeid,
        svgIcon: '<svg></svg>',
      };
    } as unknown as WidgetComponentClass;

  const gatedWidget = widgetClass('gated-widget');
  const lazyWidget = widgetClass('lazy-widget');
  const otherWidget = widgetClass('other-widget');

  const cellOf = (widgetTypeid: string) =>
    store.cells().find((cell) => cell.widgetTypeid === widgetTypeid)!;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DashboardStore] });
    service = TestBed.inject(DashboardService);
    store = TestBed.inject(DashboardStore);
  });

  it('reverts a cell loaded while its type was registered, and heals it again', () => {
    service.registerWidgetType(gatedWidget);
    store.loadDashboard(createTestDto([
      { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'gated-widget', widgetState: { data: 'preserved' } },
    ]));
    expect(cellOf('gated-widget').widgetFactory.widgetTypeid).toBe('gated-widget');

    service.unregisterWidgetType('gated-widget');
    expect(cellOf('gated-widget').widgetFactory.widgetTypeid).toBe(UNKNOWN_WIDGET_TYPEID);
    expect(cellOf('gated-widget').widgetState).toEqual({ data: 'preserved' });

    service.registerWidgetType(gatedWidget);
    expect(cellOf('gated-widget').widgetFactory.widgetTypeid).toBe('gated-widget');
  });

  it('keeps the cells array when a registry change concerns none of its cells', () => {
    service.registerWidgetType(gatedWidget);
    store.loadDashboard(createTestDto([
      { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'gated-widget', widgetState: {} },
      { row: 2, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'lazy-widget', widgetState: {} },
      { row: 3, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'missing-widget', widgetState: {} },
    ]));
    service.registerWidgetType(lazyWidget); // healed after load
    const before = store.cells();

    // Registered at load, healed after load and never resolved: all three
    // resolve to the object they had, so nothing downstream sees a change.
    service.registerWidgetType(otherWidget);
    expect(store.cells()).toBe(before);

    service.unregisterWidgetType('other-widget');
    expect(store.cells()).toBe(before);
  });

  it('writes back shared state for a type this session never registered', () => {
    store.loadDashboard({
      ...createTestDto([
        { row: 1, col: 1, rowSpan: 1, colSpan: 1, widgetTypeid: 'gated-widget', widgetState: {} },
      ]),
      sharedStates: { 'gated-widget': { unit: 'F' } },
    });

    expect(store.exportDashboard().sharedStates).toEqual({
      'gated-widget': { unit: 'F' },
    });
  });
});
