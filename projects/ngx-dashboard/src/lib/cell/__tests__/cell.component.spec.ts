import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewContainerRef, Renderer2 } from '@angular/core';
import { CellComponent } from '../cell.component';
import { DashboardStore } from '../../store/dashboard-store';
import { DashboardService } from '../../services/dashboard.service';
import { CellContextMenuService } from '../cell-context-menu.service';
import { CELL_SETTINGS_DIALOG_PROVIDER } from '../../providers/cell-settings-dialog';
import {
  CellId,
  CellIdUtils,
  WidgetFactory,
  Widget,
} from '../../models';
import { Component, signal } from '@angular/core';

// Mock test widget component
@Component({
  selector: 'lib-test-widget',
  template: '<div>Test Widget</div>',
  standalone: true,
})
class TestWidgetComponent implements Widget {
  private state = signal<any>({ value: 'test' });

  dashboardGetState(): any {
    return this.state();
  }

  dashboardSetState(state: any): void {
    this.state.set(state);
  }

  dashboardEditState(): void {
    // Mock edit state method
  }
}

describe('CellComponent - User Scenarios', () => {
  let component: CellComponent;
  let fixture: ComponentFixture<CellComponent>;
  let store: InstanceType<typeof DashboardStore>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockContextMenuService: jasmine.SpyObj<CellContextMenuService>;
  let mockDialogProvider: jasmine.SpyObj<any>;
  let mockRenderer: jasmine.SpyObj<Renderer2>;

  const mockCellId: CellId = CellIdUtils.create(1, 1);

  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg><rect width="10" height="10"/></svg>',
    createInstance: jasmine
      .createSpy('createInstance')
      .and.callFake((container: ViewContainerRef, state?: unknown) => {
        const componentRef = container.createComponent(TestWidgetComponent);
        if (state) {
          componentRef.instance.dashboardSetState(state);
        }
        return componentRef;
      }),
  };

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('DashboardService', ['getFactory']);
    mockContextMenuService = jasmine.createSpyObj('CellContextMenuService', ['show']);
    mockDialogProvider = jasmine.createSpyObj('CellSettingsDialogProvider', ['openCellSettings']);
    mockRenderer = jasmine.createSpyObj('Renderer2', ['listen']);

    await TestBed.configureTestingModule({
      imports: [CellComponent, TestWidgetComponent],
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: CellContextMenuService, useValue: mockContextMenuService },
        { provide: CELL_SETTINGS_DIALOG_PROVIDER, useValue: mockDialogProvider },
        { provide: Renderer2, useValue: mockRenderer },
      ],
    }).compileComponents();

    store = TestBed.inject(DashboardStore);
    fixture = TestBed.createComponent(CellComponent);
    component = fixture.componentInstance;

    mockRenderer.listen.and.returnValue(() => {});
    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);
  });

  describe('Component Creation', () => {
    it('should create and initialize with required inputs', () => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();

      expect(component).toBeTruthy();
      expect(component.id()).toEqual(mockCellId);
      expect(component.row()).toBe(1);
      expect(component.column()).toBe(1);
    });
  });

  describe('Widget Creation Workflow', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();
    });

    it('should create widget when user adds widget to cell', async () => {
      const mockState = { value: 'test-state' };

      // User adds widget to cell
      fixture.componentRef.setInput('widgetFactory', mockWidgetFactory);
      fixture.componentRef.setInput('widgetState', mockState);
      fixture.detectChanges();
      await fixture.whenStable();

      // Widget should be created with provided state
      expect(mockWidgetFactory.createInstance).toHaveBeenCalledWith(
        jasmine.any(ViewContainerRef),
        mockState
      );
    });

    it('should handle widget creation failure gracefully', async () => {
      const failingFactory = {
        ...mockWidgetFactory,
        createInstance: jasmine.createSpy('createInstance').and.throwError('Creation failed'),
      };

      spyOn(console, 'error');

      // User attempts to add failing widget
      fixture.componentRef.setInput('widgetFactory', failingFactory);
      fixture.detectChanges();
      await fixture.whenStable();

      // Should not throw error to user
      expect(failingFactory.createInstance).toHaveBeenCalled();
    });
  });

  describe('Widget Deletion Workflow', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();
    });

    it('should emit delete event when user deletes widget', () => {
      spyOn(component.delete, 'emit');

      // User deletes widget
      component.onDelete();

      // Delete event should be emitted
      expect(component.delete.emit).toHaveBeenCalledWith(mockCellId);
    });
  });

  describe('Widget Edit Workflow', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.componentRef.setInput('widgetFactory', mockWidgetFactory);
      fixture.detectChanges();
    });

    it('should emit edit event when user edits widget', async () => {
      spyOn(component.edit, 'emit');
      await fixture.whenStable();

      // User edits widget
      component.onEdit();

      // Edit event should be emitted
      expect(component.edit.emit).toHaveBeenCalledWith(mockCellId);
    });

    it('should report if widget can be edited', async () => {
      await fixture.whenStable();
      expect(component.canEdit()).toBe(true);
    });

    it('should report false for widgets without edit capability', async () => {
      const factoryWithoutEdit = {
        ...mockWidgetFactory,
        createInstance: jasmine.createSpy('createInstance').and.returnValue({
          destroy: jasmine.createSpy('destroy'),
        }),
      };

      fixture.componentRef.setInput('widgetFactory', factoryWithoutEdit);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.canEdit()).toBe(false);
    });
  });

  describe('Settings Dialog Workflow', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.componentRef.setInput('flat', true);
      fixture.detectChanges();
    });

    it('should open settings dialog and emit changes when user saves', async () => {
      spyOn(component.settings, 'emit');
      mockDialogProvider.openCellSettings.and.returnValue(
        Promise.resolve({ id: CellIdUtils.toString(mockCellId), flat: false })
      );

      // User opens settings
      await component.onSettings();

      // Dialog should open with current values
      expect(mockDialogProvider.openCellSettings).toHaveBeenCalledWith({
        id: CellIdUtils.toString(mockCellId),
        flat: true,
      });
      
      // Settings event should be emitted with new values
      expect(component.settings.emit).toHaveBeenCalledWith({
        id: mockCellId,
        flat: false,
      });
    });

    it('should handle user canceling settings dialog', async () => {
      spyOn(component.settings, 'emit');
      mockDialogProvider.openCellSettings.and.returnValue(Promise.resolve(null));

      // User cancels settings
      await component.onSettings();

      // No settings event should be emitted
      expect(component.settings.emit).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop Workflow', () => {
    let mockDragEvent: any;

    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 2);
      fixture.componentRef.setInput('column', 3);
      fixture.componentRef.setInput('rowSpan', 2);
      fixture.componentRef.setInput('colSpan', 3);
      fixture.detectChanges();

      mockDragEvent = {
        dataTransfer: {
          effectAllowed: 'move' as const,
          setDragImage: jasmine.createSpy('setDragImage'),
        } as Partial<DataTransfer>,
      } as Partial<DragEvent>;
    });

    it('should complete drag and drop workflow', () => {
      spyOn(component.dragStart, 'emit');
      spyOn(component.dragEnd, 'emit');

      // User starts drag
      component.onDragStart(mockDragEvent as DragEvent);

      // Drag should start with correct data
      expect(component.isDragging()).toBe(true);
      expect(component.dragStart.emit).toHaveBeenCalledWith({
        kind: 'cell',
        content: {
          cellId: mockCellId,
          row: 2,
          col: 3,
          rowSpan: 2,
          colSpan: 3,
        },
      });

      // User ends drag
      component.onDragEnd();

      // Drag should end properly
      expect(component.isDragging()).toBe(false);
      expect(component.dragEnd.emit).toHaveBeenCalled();
    });

    it('should handle invalid drag event', () => {
      spyOn(component.dragStart, 'emit');
      const invalidEvent = { dataTransfer: null };

      // User attempts drag with invalid event
      component.onDragStart(invalidEvent as DragEvent);

      // Drag should not start
      expect(component.dragStart.emit).not.toHaveBeenCalled();
      expect(component.isDragging()).toBe(false);
    });
  });

  describe('Context Menu Workflow', () => {
    let mockMouseEvent: any;

    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.componentRef.setInput('isEditMode', true);
      fixture.detectChanges();

      mockMouseEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as Partial<MouseEvent>;
    });

    it('should show context menu when user right-clicks in edit mode', () => {
      // User right-clicks cell
      component.onContextMenu(mockMouseEvent as MouseEvent);

      // Context menu should appear with correct options
      expect(mockMouseEvent.preventDefault).toHaveBeenCalled();
      expect(mockMouseEvent.stopPropagation).toHaveBeenCalled();
      expect(mockContextMenuService.show).toHaveBeenCalledWith(
        100,
        200,
        jasmine.any(Array)
      );
    });

    it('should not show context menu when not in edit mode', () => {
      fixture.componentRef.setInput('isEditMode', false);
      fixture.detectChanges();

      // User right-clicks cell in view mode
      component.onContextMenu(mockMouseEvent as MouseEvent);

      // No context menu should appear
      expect(mockContextMenuService.show).not.toHaveBeenCalled();
    });
  });

  describe('Position Management', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();
    });

    it('should update position when programmatically set', () => {
      // Position is updated programmatically
      component.setPosition(5, 3);

      // Position should be updated
      expect(component.row()).toBe(5);
      expect(component.column()).toBe(3);
    });
  });

  describe('Resize Integration', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();
    });

    it('should respond to resize state changes from store', async () => {
      // Add cell to store first
      store.addWidget({
        cellId: mockCellId,
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
        flat: false
      });
      
      // Initially not resizing
      expect(component.isResizing()).toBe(false);

      // Store starts resize
      store.startResize(mockCellId);
      expect(component.isResizing()).toBe(true);

      // Store ends resize
      store.endResize(false);
      expect(component.isResizing()).toBe(false);
    });
  });

  describe('Widget State Management', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();
    });

    it('should get current widget state', async () => {
      const mockState = { value: 'current-state' };
      fixture.componentRef.setInput('widgetFactory', mockWidgetFactory);
      fixture.componentRef.setInput('widgetState', mockState);
      fixture.detectChanges();
      await fixture.whenStable();

      const result = component.getCurrentWidgetState();
      expect(result).toEqual({ value: 'current-state' });
    });

    it('should return undefined when no widget exists', () => {
      const result = component.getCurrentWidgetState();
      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('id', mockCellId);
      fixture.componentRef.setInput('row', 1);
      fixture.componentRef.setInput('column', 1);
      fixture.detectChanges();
    });

    it('should handle settings dialog errors gracefully', async () => {
      spyOn(console, 'error');
      mockDialogProvider.openCellSettings.and.returnValue(
        Promise.reject(new Error('Dialog error'))
      );

      // User attempts to open settings but error occurs
      await component.onSettings();

      // Error should be logged, not thrown
      expect(console.error).toHaveBeenCalledWith(
        'Error opening cell settings dialog:',
        jasmine.any(Error)
      );
    });
  });



});

// Test suite for testing without CellContextMenuService
describe('CellComponent - Without Context Menu Service', () => {
  let component: CellComponent;
  let fixture: ComponentFixture<CellComponent>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockDialogProvider: jasmine.SpyObj<any>;
  let mockRenderer: jasmine.SpyObj<Renderer2>;

  const mockCellId: CellId = CellIdUtils.create(1, 1);
  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg><rect width="10" height="10"/></svg>',
    createInstance: jasmine.createSpy('createInstance').and.returnValue({
      destroy: jasmine.createSpy('destroy'),
    }),
  };

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('DashboardService', ['getFactory']);
    mockDialogProvider = jasmine.createSpyObj('CellSettingsDialogProvider', ['openCellSettings']);
    mockRenderer = jasmine.createSpyObj('Renderer2', ['listen']);

    // Configure TestBed WITHOUT CellContextMenuService
    await TestBed.configureTestingModule({
      imports: [CellComponent, TestWidgetComponent],
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: mockDashboardService },
        // Notice: CellContextMenuService is NOT provided
        { provide: CELL_SETTINGS_DIALOG_PROVIDER, useValue: mockDialogProvider },
        { provide: Renderer2, useValue: mockRenderer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CellComponent);
    component = fixture.componentInstance;

    mockRenderer.listen.and.returnValue(() => {});
    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);
  });

  it('should handle missing context menu service gracefully', () => {
    fixture.componentRef.setInput('id', mockCellId);
    fixture.componentRef.setInput('row', 1);
    fixture.componentRef.setInput('column', 1);
    fixture.componentRef.setInput('isEditMode', true);
    fixture.detectChanges();

    const mockMouseEvent = {
      clientX: 100,
      clientY: 200,
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as Partial<MouseEvent>;

    // User right-clicks when service is not available
    component.onContextMenu(mockMouseEvent as MouseEvent);

    // Should not process the event
    expect(mockMouseEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockMouseEvent.stopPropagation).not.toHaveBeenCalled();
  });
});
