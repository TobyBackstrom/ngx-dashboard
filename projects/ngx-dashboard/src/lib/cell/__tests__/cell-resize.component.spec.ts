import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewContainerRef, Renderer2 } from '@angular/core';
import { CellComponent } from '../cell.component';
import { DashboardStore } from '../../store/dashboard-store';
import { DashboardService } from '../../services/dashboard.service';
import { CellContextMenuService } from '../cell-context-menu.service';
import { CELL_SETTINGS_DIALOG_PROVIDER } from '../../providers/cell-settings-dialog';
import { CellId, CellIdUtils, WidgetId, WidgetIdUtils, WidgetFactory } from '../../models';
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
  dashboardSetState() { /* Mock implementation */ }
  dashboardEditState() { /* Mock implementation */ }
}

describe('CellComponent - Resize Functionality', () => {
  let component: CellComponent;
  let fixture: ComponentFixture<CellComponent>;
  let store: InstanceType<typeof DashboardStore>;
  let realRenderer: Renderer2;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockContextMenuService: jasmine.SpyObj<CellContextMenuService>;
  let mockDialogProvider: jasmine.SpyObj<{ openCellSettings: (data: unknown) => void }>;

  const mockCellId: CellId = CellIdUtils.create(1, 1);
  const mockWidgetId: WidgetId = WidgetIdUtils.generate();
  // const otherCellId: CellId = CellIdUtils.create(2, 2); // Reserved for future tests

  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg><rect width="10" height="10"/></svg>',
    createInstance: jasmine
      .createSpy('createInstance')
      .and.callFake((container: ViewContainerRef) => {
        const componentRef = container.createComponent(TestWidgetComponent);
        return componentRef;
      }),
  };

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('DashboardService', [
      'getFactory',
      'widgetTypes',
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
    fixture.componentRef.setInput('widgetId', mockWidgetId);
    fixture.componentRef.setInput('cellId', mockCellId);
    fixture.componentRef.setInput('row', 2);
    fixture.componentRef.setInput('column', 3);
    fixture.detectChanges();

    // Get the real renderer from the component's injector
    realRenderer = fixture.debugElement.injector.get(Renderer2);
    spyOn(realRenderer, 'listen').and.returnValue(() => { /* cleanup function */ });
    spyOn(realRenderer, 'addClass').and.callThrough();
    spyOn(realRenderer, 'removeClass').and.callThrough();
  });

  describe('Resize Start - Public API Behavior', () => {
    let mockMouseEvent: any; // Mock MouseEvent for testing - uses any to avoid strict type requirements

    beforeEach(() => {
      mockMouseEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      store.setGridCellDimensions(100, 80);
    });

    it('should emit resize start event with correct data', () => {
      spyOn(component.resizeStart, 'emit');

      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
      });
    });

    it('should emit resize start event for vertical direction', () => {
      spyOn(component.resizeStart, 'emit');

      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'vertical');

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'vertical',
      });
    });

    it('should prevent default event behavior', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');

      expect(mockMouseEvent.preventDefault).toHaveBeenCalled();
      expect(mockMouseEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should add horizontal cursor class', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');

      expect(realRenderer.addClass).toHaveBeenCalledWith(
        document.body,
        'cursor-col-resize'
      );
    });

    it('should add vertical cursor class', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'vertical');

      expect(realRenderer.addClass).toHaveBeenCalledWith(
        document.body,
        'cursor-row-resize'
      );
    });

    it('should setup document event listeners', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');

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
      };

      component.onResizeStart(startEvent as unknown as MouseEvent, 'horizontal');
    });

    it('should emit resize move event with correct horizontal delta', () => {
      spyOn(component.resizeMove, 'emit');

      // Simulate mouse move 100px right (1 cell width)
      const moveEvent = { clientX: 250, clientY: 200 };
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove(moveEvent as any);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
        delta: { columns: 1, rows: 0 },
      });
    });

    it('should emit resize move event with correct vertical delta', () => {
      // Setup vertical resize
      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      component.onResizeStart(startEvent as unknown as MouseEvent, 'vertical');
      spyOn(component.resizeMove, 'emit');

      // Simulate mouse move 160px down (2 cell heights)
      const moveEvent = { clientX: 150, clientY: 360 };
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove(moveEvent as any);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'vertical',
        delta: { columns: 0, rows: 2 },
      });
    });

    it('should handle negative delta correctly', () => {
      spyOn(component.resizeMove, 'emit');

      // Simulate mouse move 100px left (-1 cell width)
      const moveEvent = { clientX: 50, clientY: 200 };
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove(moveEvent as any);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
        delta: { columns: -1, rows: 0 },
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
      };

      component.onResizeStart(startEvent as unknown as MouseEvent, 'horizontal');
    });

    it('should emit resize end event', () => {
      spyOn(component.resizeEnd, 'emit');

      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeEnd();

      expect(component.resizeEnd.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        apply: true,
      });
    });

    it('should remove cursor classes', () => {
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeEnd();

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

  describe('Corner Resize - Both Axes', () => {
    let mockMouseEvent: any; // Mock MouseEvent for testing

    const move = (event: { clientX: number; clientY: number }) =>
      (
        component as unknown as {
          handleResizeMove: (event: MouseEvent) => void;
        }
      ).handleResizeMove(event as unknown as MouseEvent);

    beforeEach(() => {
      store.setGridCellDimensions(100, 80);

      mockMouseEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };
    });

    it('should emit resize start event with the both direction', () => {
      spyOn(component.resizeStart, 'emit');

      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'both',
      });
    });

    it('should add the diagonal cursor class', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');

      expect(realRenderer.addClass).toHaveBeenCalledWith(
        document.body,
        'cursor-nwse-resize'
      );
    });

    it('should emit a per-axis delta while dragging', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');
      spyOn(component.resizeMove, 'emit');

      // 200px right (2 cell widths), 160px down (2 cell heights)
      move({ clientX: 350, clientY: 360 });

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'both',
        delta: { columns: 2, rows: 2 },
      });
    });

    it('should emit independent deltas per axis', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');
      spyOn(component.resizeMove, 'emit');

      // 300px right (3 cell widths), 80px up (-1 cell height)
      move({ clientX: 450, clientY: 120 });

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'both',
        delta: { columns: 3, rows: -1 },
      });
    });

    it('should emit negative deltas on both axes when dragging inwards', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');
      spyOn(component.resizeMove, 'emit');

      move({ clientX: 50, clientY: 120 });

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'both',
        delta: { columns: -1, rows: -1 },
      });
    });

    it('should remove the diagonal cursor class on resize end', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');

      (
        component as unknown as { handleResizeEnd: () => void }
      ).handleResizeEnd();

      expect(realRenderer.removeClass).toHaveBeenCalledWith(
        document.body,
        'cursor-nwse-resize'
      );
    });

    it('should handle a complete corner resize workflow', () => {
      spyOn(component.resizeStart, 'emit');
      spyOn(component.resizeMove, 'emit');
      spyOn(component.resizeEnd, 'emit');

      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');
      move({ clientX: 250, clientY: 280 });
      (
        component as unknown as { handleResizeEnd: () => void }
      ).handleResizeEnd();

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'both',
      });
      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'both',
        delta: { columns: 1, rows: 1 },
      });
      expect(component.resizeEnd.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        apply: true,
      });
    });

    it('should stop emitting move events once the gesture ended', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'both');
      (
        component as unknown as { handleResizeEnd: () => void }
      ).handleResizeEnd();

      spyOn(component.resizeMove, 'emit');
      move({ clientX: 350, clientY: 360 });

      expect(component.resizeMove.emit).not.toHaveBeenCalled();
    });
  });

  describe('Corner Handle - Template', () => {
    it('should render the corner handle in edit mode', () => {
      fixture.componentRef.setInput('isEditMode', true);
      fixture.detectChanges();

      const corner = fixture.nativeElement.querySelector(
        '.resize-handle--corner'
      );
      expect(corner).toBeTruthy();
    });

    it('should not render the corner handle outside edit mode', () => {
      fixture.componentRef.setInput('isEditMode', false);
      fixture.detectChanges();

      const corner = fixture.nativeElement.querySelector(
        '.resize-handle--corner'
      );
      expect(corner).toBeNull();
    });

    it('should keep the corner handle hit area inside the cell, on top of the edge handles', () => {
      // Regression: the handle used to hang outside the cell like the edge
      // handles do, but `.cell` clips overflow, leaving a few unhittable
      // pixels. Probe the real corner pixel and assert the corner handle -- not
      // the right/bottom edge handle -- is what the pointer would land on.
      fixture.componentRef.setInput('isEditMode', true);
      const host: HTMLElement = fixture.nativeElement;
      host.style.width = '200px';
      host.style.height = '120px';
      fixture.detectChanges();

      const cell: HTMLElement = host.querySelector('.cell')!;
      const cellRect = cell.getBoundingClientRect();
      const corner: HTMLElement = host.querySelector('.resize-handle--corner')!;
      const cornerRect = corner.getBoundingClientRect();

      expect(cornerRect.width).toBeGreaterThan(0);
      expect(cornerRect.right).toBeLessThanOrEqual(Math.ceil(cellRect.right));
      expect(cornerRect.bottom).toBeLessThanOrEqual(Math.ceil(cellRect.bottom));

      const hit = document.elementFromPoint(
        cellRect.right - 4,
        cellRect.bottom - 4
      );
      expect(hit === corner || corner.contains(hit)).toBe(true);
    });

    it('should start a both-axis resize on corner mousedown', () => {
      // The suite stubs Renderer2.listen; template event bindings go through
      // the same renderer, so restore it before the handle is rendered.
      (realRenderer.listen as jasmine.Spy).and.callThrough();
      fixture.componentRef.setInput('isEditMode', true);
      fixture.detectChanges();

      const startSpy = spyOn(component, 'onResizeStart');
      const corner: HTMLElement = fixture.nativeElement.querySelector(
        '.resize-handle--corner'
      );
      corner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(startSpy).toHaveBeenCalledWith(jasmine.any(MouseEvent), 'both');
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
    let mockMouseEvent: any; // Mock MouseEvent for testing - uses any to avoid strict type requirements

    beforeEach(() => {
      store.setGridCellDimensions(100, 80);

      mockMouseEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };
    });

    it('should handle invalid direction gracefully', () => {
      spyOn(component.resizeStart, 'emit');

      expect(() => {
        component.onResizeStart(mockMouseEvent, 'invalid' as unknown as 'horizontal' | 'vertical');
      }).not.toThrow();

      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: jasmine.any(String),
      });
    });

    it('should handle extreme coordinates', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');
      spyOn(component.resizeMove, 'emit');

      // Test with very large coordinates
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove({ clientX: 999999, clientY: 999999 } as any);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
        delta: {
          columns: jasmine.any(Number),
          rows: jasmine.any(Number),
        },
      });
    });

    it('should handle negative coordinates', () => {
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');
      spyOn(component.resizeMove, 'emit');

      // Test with negative coordinates
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove({ clientX: -100, clientY: -100 } as any);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
        delta: {
          columns: jasmine.any(Number),
          rows: jasmine.any(Number),
        },
      });
    });

    it('should handle zero cell dimensions', () => {
      store.setGridCellDimensions(0, 0);
      component.onResizeStart(mockMouseEvent as unknown as MouseEvent, 'horizontal');
      spyOn(component.resizeMove, 'emit');

      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove({ clientX: 200, clientY: 200 } as any);

      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
        delta: {
          columns: jasmine.any(Number),
          rows: jasmine.any(Number),
        },
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
      };

      // Start resize
      component.onResizeStart(startEvent as unknown as MouseEvent, 'horizontal');
      expect(component.resizeStart.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
      });

      // Move resize
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeMove({ clientX: 250, clientY: 200 } as any);
      expect(component.resizeMove.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
        direction: 'horizontal',
        delta: { columns: 1, rows: 0 },
      });

      // End resize
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeEnd();
      expect(component.resizeEnd.emit).toHaveBeenCalledWith({
        cellId: mockCellId,
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
      };

      // First resize cycle
      component.onResizeStart(startEvent as unknown as MouseEvent, 'horizontal');
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeEnd();

      // Second resize cycle
      component.onResizeStart(startEvent as unknown as MouseEvent, 'vertical');
      (component as unknown as { handleResizeMove: (event: MouseEvent) => void; handleResizeEnd: () => void }).handleResizeEnd();

      expect(component.resizeStart.emit).toHaveBeenCalledTimes(2);
      expect(component.resizeEnd.emit).toHaveBeenCalledTimes(2);
    });

    it('should cleanup on component destroy', () => {
      const startEvent = {
        clientX: 150,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      component.onResizeStart(startEvent as unknown as MouseEvent, 'horizontal');

      // Component destruction should not throw
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });
  });
});