import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { DropZoneComponent } from '../drop-zone.component';
import { DashboardStore } from '../../store/dashboard-store';
import { DragData, CellIdUtils, WidgetMetadata } from '../../models';
import { DashboardService } from '../../services/dashboard.service';

describe('DropZoneComponent - Focused Regression Tests', () => {
  let component: DropZoneComponent;
  let fixture: ComponentFixture<DropZoneComponent>;
  let store: InstanceType<typeof DashboardStore>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  const testWidgetMetadata: WidgetMetadata = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg></svg>'
  };

  const cellDragData: DragData = {
    kind: 'cell',
    content: {
      cellId: CellIdUtils.create(2, 2),
      row: 2,
      col: 2,
      rowSpan: 1,
      colSpan: 1
    }
  };

  const widgetDragData: DragData = {
    kind: 'widget',
    content: testWidgetMetadata
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DashboardService', ['getFactory']);

    await TestBed.configureTestingModule({
      imports: [DropZoneComponent],
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DropZoneComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(DashboardStore);
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    
    // Set required inputs
    fixture.componentRef.setInput('row', 3);
    fixture.componentRef.setInput('col', 4);
    fixture.componentRef.setInput('index', 12);
    
    fixture.detectChanges();
  });

  describe('Critical Drag & Drop Event Handling', () => {
    it('should prevent default and stop propagation on dragenter', () => {
      const event = new DragEvent('dragenter', { bubbles: true });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onDragEnter(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should prevent default and stop propagation on dragover', () => {
      const event = new DragEvent('dragover', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: { dropEffect: 'none' }
      });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onDragOver(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should prevent default and stop propagation on dragleave', () => {
      const event = new DragEvent('dragleave', { bubbles: true });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onDragLeave(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should prevent default and stop propagation on drop', () => {
      const event = new DragEvent('drop', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {}
      });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onDrop(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should return move drop effect for cell drag data', () => {
      store.syncDragState(cellDragData);
      fixture.detectChanges();
      
      expect(component.dropEffect()).toBe('move');
    });

    it('should return copy drop effect for widget drag data', () => {
      store.syncDragState(widgetDragData);
      fixture.detectChanges();
      
      expect(component.dropEffect()).toBe('copy');
    });

    it('should return none drop effect for invalid drops', () => {
      store.syncDragState(null);
      fixture.componentRef.setInput('highlightInvalid', true);
      fixture.detectChanges();
      
      expect(component.dropEffect()).toBe('none');
    });

    it('should return none drop effect when no drag data', () => {
      store.syncDragState(null);
      fixture.detectChanges();
      
      expect(component.dropEffect()).toBe('none');
    });

    it('should detect when mouse leaves element boundaries through dragExit behavior', () => {
      spyOn(component.dragExit, 'emit');
      const mockBoundingRect = {
        left: 100,
        right: 200,
        top: 50,
        bottom: 150
      };
      spyOn(component.nativeElement, 'getBoundingClientRect').and.returnValue(mockBoundingRect as DOMRect);
      
      // Mouse outside left boundary - should emit dragExit
      const event1 = new DragEvent('dragleave', { clientX: 90, clientY: 100 });
      component.onDragLeave(event1);
      expect(component.dragExit.emit).toHaveBeenCalled();
      
      // Reset spy
      (component.dragExit.emit as jasmine.Spy).calls.reset();
      
      // Mouse inside boundaries - should not emit dragExit
      const event2 = new DragEvent('dragleave', { clientX: 150, clientY: 100 });
      component.onDragLeave(event2);
      expect(component.dragExit.emit).not.toHaveBeenCalled();
    });
  });

  describe('Output Event Emission', () => {
    it('should emit dragEnter with correct row and col data', () => {
      spyOn(component.dragEnter, 'emit');
      const event = new DragEvent('dragenter');
      
      component.onDragEnter(event);
      
      expect(component.dragEnter.emit).toHaveBeenCalledWith({ row: 3, col: 4 });
    });

    it('should emit dragOver with correct row and col data', () => {
      spyOn(component.dragOver, 'emit');
      const event = new DragEvent('dragover');
      Object.defineProperty(event, 'dataTransfer', {
        value: { dropEffect: 'none' }
      });
      
      component.onDragOver(event);
      
      expect(component.dragOver.emit).toHaveBeenCalledWith({ row: 3, col: 4 });
    });

    it('should emit dragDrop with correct data structure when drag data exists', () => {
      spyOn(component.dragDrop, 'emit');
      store.syncDragState(cellDragData);
      fixture.detectChanges();
      
      const event = new DragEvent('drop');
      Object.defineProperty(event, 'dataTransfer', {
        value: {}
      });
      
      component.onDrop(event);
      
      expect(component.dragDrop.emit).toHaveBeenCalledWith({
        data: cellDragData,
        target: { row: 3, col: 4 }
      });
    });

    it('should not emit dragDrop when no drag data exists', () => {
      spyOn(component.dragDrop, 'emit');
      store.syncDragState(null);
      fixture.detectChanges();
      
      const event = new DragEvent('drop');
      Object.defineProperty(event, 'dataTransfer', {
        value: {}
      });
      
      component.onDrop(event);
      
      expect(component.dragDrop.emit).not.toHaveBeenCalled();
    });

    it('should not emit dragDrop when dataTransfer is missing', () => {
      spyOn(component.dragDrop, 'emit');
      store.syncDragState(cellDragData);
      fixture.detectChanges();
      
      const event = new DragEvent('drop');
      
      component.onDrop(event);
      
      expect(component.dragDrop.emit).not.toHaveBeenCalled();
    });

    it('should emit dragExit only when actually leaving element', () => {
      spyOn(component.dragExit, 'emit');
      const mockBoundingRect = {
        left: 100,
        right: 200,
        top: 50,
        bottom: 150
      };
      spyOn(component.nativeElement, 'getBoundingClientRect').and.returnValue(mockBoundingRect as DOMRect);
      
      // Mouse outside boundaries - should emit
      const event = new DragEvent('dragleave', { clientX: 90, clientY: 100 });
      component.onDragLeave(event);
      
      expect(component.dragExit.emit).toHaveBeenCalled();
    });

    it('should not emit dragExit when not leaving element', () => {
      spyOn(component.dragExit, 'emit');
      const mockBoundingRect = {
        left: 100,
        right: 200,
        top: 50,
        bottom: 150
      };
      spyOn(component.nativeElement, 'getBoundingClientRect').and.returnValue(mockBoundingRect as DOMRect);
      
      // Mouse inside boundaries - should not emit
      const event = new DragEvent('dragleave', { clientX: 150, clientY: 100 });
      component.onDragLeave(event);
      
      expect(component.dragExit.emit).not.toHaveBeenCalled();
    });
  });

  describe('Visual State Management', () => {
    it('should apply highlight class when highlight is true and highlightInvalid is false', () => {
      fixture.componentRef.setInput('highlight', true);
      fixture.componentRef.setInput('highlightInvalid', false);
      fixture.detectChanges();
      
      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone.classList).toContain('drop-zone--highlight');
    });

    it('should not apply highlight class when highlightInvalid is true', () => {
      fixture.componentRef.setInput('highlight', true);
      fixture.componentRef.setInput('highlightInvalid', true);
      fixture.detectChanges();
      
      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone.classList).not.toContain('drop-zone--highlight');
    });

    it('should apply invalid class when highlightInvalid is true', () => {
      fixture.componentRef.setInput('highlightInvalid', true);
      fixture.detectChanges();
      
      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone.classList).toContain('drop-zone--invalid');
    });

    it('should apply resize class when highlightResize is true', () => {
      fixture.componentRef.setInput('highlightResize', true);
      fixture.detectChanges();
      
      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone.classList).toContain('drop-zone--resize');
    });

    it('should display edit mode cell numbers with correct values', () => {
      fixture.componentRef.setInput('editMode', true);
      fixture.detectChanges();
      
      const cellNumber = fixture.nativeElement.querySelector('.edit-mode-cell-number');
      expect(cellNumber).toBeTruthy();
      expect(cellNumber.textContent.trim()).toBe('12 3,4');
    });

    it('should not display edit mode cell numbers when editMode is false', () => {
      fixture.componentRef.setInput('editMode', false);
      fixture.detectChanges();
      
      const cellNumber = fixture.nativeElement.querySelector('.edit-mode-cell-number');
      expect(cellNumber).toBeFalsy();
    });
  });

  describe('Integration & Edge Cases', () => {
    it('should correctly read dragData from store', () => {
      store.syncDragState(cellDragData);
      fixture.detectChanges();
      
      expect(component.dragData()).toEqual(cellDragData);
    });

    it('should handle null dragData gracefully', () => {
      store.syncDragState(null);
      fixture.detectChanges();
      
      expect(component.dragData()).toBeNull();
      expect(component.dropEffect()).toBe('none');
    });

    it('should set dataTransfer dropEffect on dragover when drag data exists', () => {
      store.syncDragState(cellDragData);
      fixture.detectChanges();
      
      const mockDataTransfer = { dropEffect: 'none' };
      const event = new DragEvent('dragover');
      Object.defineProperty(event, 'dataTransfer', {
        value: mockDataTransfer
      });
      
      component.onDragOver(event);
      
      expect(mockDataTransfer.dropEffect).toBe('move');
    });

    it('should not set dataTransfer dropEffect when no drag data', () => {
      store.syncDragState(null);
      fixture.detectChanges();
      
      const mockDataTransfer = { dropEffect: 'copy' };
      const event = new DragEvent('dragover');
      Object.defineProperty(event, 'dataTransfer', {
        value: mockDataTransfer
      });
      
      component.onDragOver(event);
      
      expect(mockDataTransfer.dropEffect).toBe('copy'); // Should remain unchanged
    });

    it('should generate unique dropZoneId', () => {
      expect(component.dropZoneId()).toBe('drop-zone-3-4');
    });

    it('should provide correct dropData object', () => {
      expect(component.dropData()).toEqual({ row: 3, col: 4 });
    });

    it('should handle rapid drag events without state corruption', () => {
      spyOn(component.dragEnter, 'emit');
      spyOn(component.dragExit, 'emit');
      
      const mockBoundingRect = {
        left: 100,
        right: 200,
        top: 50,
        bottom: 150
      };
      spyOn(component.nativeElement, 'getBoundingClientRect').and.returnValue(mockBoundingRect as DOMRect);
      
      const enterEvent = new DragEvent('dragenter');
      const leaveEvent = new DragEvent('dragleave', { clientX: 90, clientY: 100 }); // Outside bounds
      
      // Rapid fire events
      component.onDragEnter(enterEvent);
      component.onDragLeave(leaveEvent);
      component.onDragEnter(enterEvent);
      component.onDragLeave(leaveEvent);
      
      expect(component.dragEnter.emit).toHaveBeenCalledTimes(2);
      expect(component.dragExit.emit).toHaveBeenCalledTimes(2);
    });

    it('should handle drag events in correct sequence', () => {
      spyOn(component.dragEnter, 'emit');
      spyOn(component.dragOver, 'emit');
      spyOn(component.dragExit, 'emit');
      spyOn(component.dragDrop, 'emit');
      
      const mockBoundingRect = {
        left: 100,
        right: 200,
        top: 50,
        bottom: 150
      };
      spyOn(component.nativeElement, 'getBoundingClientRect').and.returnValue(mockBoundingRect as DOMRect);
      
      store.syncDragState(cellDragData);
      fixture.detectChanges();
      
      const enterEvent = new DragEvent('dragenter');
      const overEvent = new DragEvent('dragover');
      Object.defineProperty(overEvent, 'dataTransfer', {
        value: { dropEffect: 'none' }
      });
      const dropEvent = new DragEvent('drop');
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {}
      });
      const leaveEvent = new DragEvent('dragleave', { clientX: 90, clientY: 100 }); // Outside bounds
      
      component.onDragEnter(enterEvent);
      component.onDragOver(overEvent);
      component.onDrop(dropEvent);
      component.onDragLeave(leaveEvent);
      
      expect(component.dragEnter.emit).toHaveBeenCalledWith({ row: 3, col: 4 });
      expect(component.dragOver.emit).toHaveBeenCalledWith({ row: 3, col: 4 });
      expect(component.dragDrop.emit).toHaveBeenCalledWith({
        data: cellDragData,
        target: { row: 3, col: 4 }
      });
      expect(component.dragExit.emit).toHaveBeenCalled();
    });
  });

  describe('Grid Positioning', () => {
    it('should apply correct grid positioning styles', () => {
      fixture.detectChanges();
      
      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone.style.gridRow).toBe('3');
      expect(dropZone.style.gridColumn).toBe('4');
    });

    it('should update positioning when inputs change', () => {
      fixture.componentRef.setInput('row', 5);
      fixture.componentRef.setInput('col', 6);
      fixture.detectChanges();
      
      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone.style.gridRow).toBe('5');
      expect(dropZone.style.gridColumn).toBe('6');
      expect(component.dropZoneId()).toBe('drop-zone-5-6');
      expect(component.dropData()).toEqual({ row: 5, col: 6 });
    });
  });
});