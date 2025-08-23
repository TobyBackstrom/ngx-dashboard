import { TestBed } from '@angular/core/testing';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, WidgetIdUtils, DragData, WidgetMetadata, WidgetFactory } from '../../models';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardStore - Drag & Drop Operations', () => {
  let store: InstanceType<typeof DashboardStore>;
  let testWidgetMetadata: WidgetMetadata;
  let mockWidgetFactory: WidgetFactory;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DashboardService', ['getFactory']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: spy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    store.setGridConfig({ rows: 16, columns: 16 });
    
    testWidgetMetadata = {
      widgetTypeid: 'test-widget',
      name: 'Test Widget',
      description: 'A test widget for unit tests',
      svgIcon: '<svg></svg>'
    };

    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy('createComponent')
    } as unknown as WidgetFactory;

    dashboardService.getFactory.and.returnValue(mockWidgetFactory);
  });

  describe('dragData management', () => {
    it('should start drag with widget data', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };

      store.startDrag(dragData);
      expect(store.dragData()).toEqual(dragData);
    });

    it('should start drag with cell data', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 2,
          colSpan: 2,
        }
      };

      store.startDrag(dragData);
      expect(store.dragData()).toEqual(dragData);
    });

    it('should clear drag data when ended', () => {
      // First set some drag data
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      expect(store.dragData()).toEqual(dragData);

      // Then clear it
      store.endDrag();
      expect(store.dragData()).toBeNull();
    });

    it('should overwrite existing drag data', () => {
      const dragData1: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };

      const dragData2: DragData = {
        kind: 'cell',
        content: {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 3),
          row: 3,
          col: 3,
          rowSpan: 1,
          colSpan: 1,
        }
      };

      store.startDrag(dragData1);
      expect(store.dragData()).toEqual(dragData1);

      store.startDrag(dragData2);
      expect(store.dragData()).toEqual(dragData2);
    });
  });


  describe('endDrag', () => {
    it('should clear drag data and hovered drop zone', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };

      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 });

      expect(store.dragData()).toEqual(dragData);
      expect(store.hoveredDropZone()).toEqual({ row: 5, col: 5 });

      store.endDrag();

      expect(store.dragData()).toBeNull();
      expect(store.hoveredDropZone()).toBeNull();
    });

    it('should work when no drag is active', () => {
      expect(store.dragData()).toBeNull();
      expect(store.hoveredDropZone()).toBeNull();

      store.endDrag();

      expect(store.dragData()).toBeNull();
      expect(store.hoveredDropZone()).toBeNull();
    });

    it('should clear drag data without affecting hovered zone if it was null', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };

      store.startDrag(dragData);
      expect(store.dragData()).toEqual(dragData);
      expect(store.hoveredDropZone()).toBeNull();

      store.endDrag();

      expect(store.dragData()).toBeNull();
      expect(store.hoveredDropZone()).toBeNull();
    });
  });

  describe('setHoveredDropZone', () => {
    it('should set hovered drop zone', () => {
      const zone = { row: 8, col: 12 };
      store.setHoveredDropZone(zone);
      expect(store.hoveredDropZone()).toEqual(zone);
    });

    it('should update hovered drop zone', () => {
      const zone1 = { row: 5, col: 5 };
      const zone2 = { row: 10, col: 15 };

      store.setHoveredDropZone(zone1);
      expect(store.hoveredDropZone()).toEqual(zone1);

      store.setHoveredDropZone(zone2);
      expect(store.hoveredDropZone()).toEqual(zone2);
    });

    it('should clear hovered drop zone when null', () => {
      const zone = { row: 5, col: 5 };
      store.setHoveredDropZone(zone);
      expect(store.hoveredDropZone()).toEqual(zone);

      store.setHoveredDropZone(null);
      expect(store.hoveredDropZone()).toBeNull();
    });

    it('should handle boundary positions', () => {
      const zone1 = { row: 1, col: 1 };
      const zone2 = { row: 16, col: 16 };

      store.setHoveredDropZone(zone1);
      expect(store.hoveredDropZone()).toEqual(zone1);

      store.setHoveredDropZone(zone2);
      expect(store.hoveredDropZone()).toEqual(zone2);
    });

    it('should allow setting same zone multiple times', () => {
      const zone = { row: 7, col: 9 };
      
      store.setHoveredDropZone(zone);
      expect(store.hoveredDropZone()).toEqual(zone);

      store.setHoveredDropZone(zone);
      expect(store.hoveredDropZone()).toEqual(zone);
    });
  });

  describe('Drag & Drop Integration', () => {
    it('should maintain drag state during hover changes', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };

      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 });
      store.setHoveredDropZone({ row: 8, col: 8 });

      expect(store.dragData()).toEqual(dragData);
      expect(store.hoveredDropZone()).toEqual({ row: 8, col: 8 });
    });

    it('should maintain hover state during drag changes', () => {
      const zone = { row: 10, col: 10 };
      const dragData1: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      const dragData2: DragData = {
        kind: 'cell',
        content: {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 3),
          row: 3,
          col: 3,
          rowSpan: 1,
          colSpan: 1,
        }
      };

      store.setHoveredDropZone(zone);
      store.startDrag(dragData1);
      store.startDrag(dragData2);

      expect(store.hoveredDropZone()).toEqual(zone);
      expect(store.dragData()).toEqual(dragData2);
    });

    it('should handle complex drag operation sequence', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 2,
          colSpan: 3,
        }
      };

      // Start drag
      store.startDrag(dragData);
      expect(store.dragData()).toEqual(dragData);

      // Move through different zones
      store.setHoveredDropZone({ row: 1, col: 1 });
      expect(store.hoveredDropZone()).toEqual({ row: 1, col: 1 });

      store.setHoveredDropZone({ row: 5, col: 8 });
      expect(store.hoveredDropZone()).toEqual({ row: 5, col: 8 });

      store.setHoveredDropZone({ row: 12, col: 15 });
      expect(store.hoveredDropZone()).toEqual({ row: 12, col: 15 });

      // End drag
      store.endDrag();
      expect(store.dragData()).toBeNull();
      expect(store.hoveredDropZone()).toBeNull();
    });
  });
});