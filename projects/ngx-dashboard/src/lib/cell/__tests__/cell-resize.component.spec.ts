import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewContainerRef, ElementRef, Renderer2 } from '@angular/core';
import { CellComponent } from '../cell.component';
import { DashboardStore } from '../../store/dashboard-store';
import { DashboardService } from '../../services/dashboard.service';
import { CellContextMenuService } from '../cell-context-menu.service';
import { CELL_SETTINGS_DIALOG_PROVIDER } from '../../providers/cell-settings-dialog';
import { CellId, CellIdUtils, WidgetFactory } from '../../models';
import { Component } from '@angular/core';

// Mock test widget component
@Component({
  selector: 'lib-test-widget',
  template: '<div>Test Widget</div>',
  standalone: true,
})
class TestWidgetComponent {
  dashboardGetState() {
    return {};
  }
  dashboardSetState(state: any) {}
  dashboardEditState() {}
}

describe('CellComponent - Resize Functionality', () => {
  let component: CellComponent;
  let fixture: ComponentFixture<CellComponent>;
  let store: InstanceType<typeof DashboardStore>;
  let realRenderer: Renderer2;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockContextMenuService: jasmine.SpyObj<CellContextMenuService>;
  let mockDialogProvider: jasmine.SpyObj<any>;

  const mockCellId: CellId = CellIdUtils.create(1, 1);
  const otherCellId: CellId = CellIdUtils.create(2, 2);

  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg><rect width="10" height="10"/></svg>',
    createInstance: jasmine
      .createSpy('createInstance')
      .and.callFake((container: ViewContainerRef, state?: unknown) => {
        const componentRef = container.createComponent(TestWidgetComponent);
        return componentRef;
      }),
  };

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('DashboardService', [
      'getFactory',
    ]);

    mockContextMenuService = jasmine.createSpyObj('CellContextMenuService', [
      'show',
      'hide',
    ]);

    mockDialogProvider = jasmine.createSpyObj('CellSettingsDialogProvider', [
      'openCellSettings',
    ]);

    await TestBed.configureTestingModule({
      imports: [CellComponent, TestWidgetComponent],
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: CellContextMenuService, useValue: mockContextMenuService },
        {
          provide: CELL_SETTINGS_DIALOG_PROVIDER,
          useValue: mockDialogProvider,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(DashboardStore);
    fixture = TestBed.createComponent(CellComponent);
    component = fixture.componentInstance;

    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);

    // Setup component inputs
    fixture.componentRef.setInput('id', mockCellId);
    fixture.componentRef.setInput('row', 2);
    fixture.componentRef.setInput('column', 3);
    fixture.detectChanges();

    // Get the real renderer from the component's injector
    realRenderer = fixture.debugElement.injector.get(Renderer2);
    spyOn(realRenderer, 'listen').and.returnValue(() => {});
    spyOn(realRenderer, 'addClass').and.callThrough();
    spyOn(realRenderer, 'removeClass').and.callThrough();
  });

  describe('Resize Start - Public API Behavior', () => {
    let mockMouseEvent: any;

    beforeEach(() => {
      mockMouseEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      store.setGridCellDimensions(100, 80);
    });

    it('should emit resize start event with correct data', () => {
      spyOn(component.resizeStart, 'emit');

      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
      });
    });

    it('should emit resize start event for vertical direction', () => {
      spyOn(component.resizeStart, 'emit');

      component.onResizeStart(mockMouseEvent as MouseEvent, 'vertical');

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'vertical',
      });
    });

    it('should prevent default event behavior', () => {
      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');

      expect(mockMouseEvent.preventDefault).toHaveBeenCalled();
      expect(mockMouseEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should add horizontal cursor class', () => {
      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');

      expect(realRenderer.addClass).toHaveBeenCalledWith(
        document.body,
        'cursor-col-resize'
      );
    });

    it('should add vertical cursor class', () => {
      component.onResizeStart(mockMouseEvent as MouseEvent, 'vertical');

      expect(realRenderer.addClass).toHaveBeenCalledWith(
        document.body,
        'cursor-row-resize'
      );
    });

    it('should setup document event listeners', () => {
      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');

      expect(realRenderer.listen).toHaveBeenCalledWith(
        'document',
        'mousemove',
        jasmine.any(Function)
      );
      expect(realRenderer.listen).toHaveBeenCalledWith(
        'document',
        'mouseup',
        jasmine.any(Function)
      );
    });
  });

  describe('Resize Move - Public API Behavior', () => {
    beforeEach(() => {
      store.setGridCellDimensions(100, 80);
      
      // Setup initial resize state
      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      component.onResizeStart(startEvent as MouseEvent, 'horizontal');
    });

    it('should emit resize move event with correct horizontal delta', () => {
      spyOn(component.resizeMove, 'emit');

      // Simulate mouse move 100px right (1 cell width)
      const moveEvent = { clientX: 250, clientY: 200 };
      (component as any).handleResizeMove(moveEvent);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
        delta: 1,
      });
    });

    it('should emit resize move event with correct vertical delta', () => {
      // Setup vertical resize
      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      component.onResizeStart(startEvent as MouseEvent, 'vertical');
      spyOn(component.resizeMove, 'emit');

      // Simulate mouse move 160px down (2 cell heights)
      const moveEvent = { clientX: 150, clientY: 360 };
      (component as any).handleResizeMove(moveEvent);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'vertical',
        delta: 2,
      });
    });

    it('should handle negative delta correctly', () => {
      spyOn(component.resizeMove, 'emit');

      // Simulate mouse move 100px left (-1 cell width)
      const moveEvent = { clientX: 50, clientY: 200 };
      (component as any).handleResizeMove(moveEvent);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
        delta: -1,
      });
    });
  });

  describe('Resize End - Public API Behavior', () => {
    beforeEach(() => {
      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      component.onResizeStart(startEvent as MouseEvent, 'horizontal');
    });

    it('should emit resize end event', () => {
      spyOn(component.resizeEnd, 'emit');

      (component as any).handleResizeEnd();

      expect(component.resizeEnd.emit).toHaveBeenCalledWith({
        id: mockCellId,
        apply: true,
      });
    });

    it('should remove cursor classes', () => {
      (component as any).handleResizeEnd();

      expect(realRenderer.removeClass).toHaveBeenCalledWith(
        document.body,
        'cursor-col-resize'
      );
      expect(realRenderer.removeClass).toHaveBeenCalledWith(
        document.body,
        'cursor-row-resize'
      );
    });
  });

  describe('Store Integration - Public Behavior', () => {
    beforeEach(() => {
      store.setGridCellDimensions(100, 80);
    });

    it('should access grid cell dimensions from store', () => {
      expect(component.gridCellDimensions).toBeDefined();
      expect(typeof component.gridCellDimensions).toBe('function');

      const dimensions = component.gridCellDimensions();
      expect(dimensions).toEqual({ width: 100, height: 80 });
    });
  });

  describe('Edge Cases - Public Behavior', () => {
    let mockMouseEvent: any;

    beforeEach(() => {
      store.setGridCellDimensions(100, 80);

      mockMouseEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;
    });

    it('should handle invalid direction gracefully', () => {
      spyOn(component.resizeStart, 'emit');

      expect(() => {
        component.onResizeStart(mockMouseEvent, 'invalid' as any);
      }).not.toThrow();

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: jasmine.any(String),
      });
    });

    it('should handle extreme coordinates', () => {
      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');
      spyOn(component.resizeMove, 'emit');

      // Test with very large coordinates
      (component as any).handleResizeMove({ clientX: 999999, clientY: 999999 });

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
        delta: jasmine.any(Number),
      });
    });

    it('should handle negative coordinates', () => {
      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');
      spyOn(component.resizeMove, 'emit');

      // Test with negative coordinates
      (component as any).handleResizeMove({ clientX: -100, clientY: -100 });

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
        delta: jasmine.any(Number),
      });
    });

    it('should handle zero cell dimensions', () => {
      store.setGridCellDimensions(0, 0);
      component.onResizeStart(mockMouseEvent as MouseEvent, 'horizontal');
      spyOn(component.resizeMove, 'emit');

      (component as any).handleResizeMove({ clientX: 200, clientY: 200 });

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
        delta: jasmine.any(Number),
      });
    });
  });

  describe('User Scenarios - End-to-End Behavior', () => {
    beforeEach(() => {
      store.setGridCellDimensions(100, 80);
    });

    it('should handle complete resize workflow', () => {
      spyOn(component.resizeStart, 'emit');
      spyOn(component.resizeMove, 'emit');
      spyOn(component.resizeEnd, 'emit');

      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      // Start resize
      component.onResizeStart(startEvent as MouseEvent, 'horizontal');
      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
      });

      // Move resize
      (component as any).handleResizeMove({ clientX: 250, clientY: 200 });
      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        id: mockCellId,
        direction: 'horizontal',
        delta: 1,
      });

      // End resize
      (component as any).handleResizeEnd();
      expect(component.resizeEnd.emit).toHaveBeenCalledWith({
        id: mockCellId,
        apply: true,
      });
    });

    it('should handle multiple sequential resize operations', () => {
      spyOn(component.resizeStart, 'emit');
      spyOn(component.resizeEnd, 'emit');

      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      // First resize cycle
      component.onResizeStart(startEvent as MouseEvent, 'horizontal');
      (component as any).handleResizeEnd();

      // Second resize cycle
      component.onResizeStart(startEvent as MouseEvent, 'vertical');
      (component as any).handleResizeEnd();

      expect(component.resizeStart.emit).toHaveBeenCalledTimes(2);
      expect(component.resizeEnd.emit).toHaveBeenCalledTimes(2);
    });

    it('should cleanup on component destroy', () => {
      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;

      component.onResizeStart(startEvent as MouseEvent, 'horizontal');

      // Component destruction should not throw
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });
  });
});