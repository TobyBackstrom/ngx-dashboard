import { TestBed } from '@angular/core/testing';
import { WidgetListContextMenuProvider } from '../widget-list-context-menu.provider';
import { DashboardService } from '../../../services/dashboard.service';
import { EmptyCellContextMenuService } from '../../../services/empty-cell-context-menu.service';
import type { EmptyCellContext } from '../empty-cell-context.provider';
import type { WidgetMetadata } from '../../../models/widget';

describe('WidgetListContextMenuProvider', () => {
  let provider: WidgetListContextMenuProvider;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let menuService: jasmine.SpyObj<EmptyCellContextMenuService>;

  const mockWidgetMetadata: WidgetMetadata = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg></svg>',
  };

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'widgetTypes',
    ]);
    const menuServiceSpy = jasmine.createSpyObj('EmptyCellContextMenuService', [
      'show',
      'hide',
    ]);

    TestBed.configureTestingModule({
      providers: [
        WidgetListContextMenuProvider,
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: EmptyCellContextMenuService, useValue: menuServiceSpy },
      ],
    });

    provider = TestBed.inject(WidgetListContextMenuProvider);
    dashboardService = TestBed.inject(
      DashboardService
    ) as jasmine.SpyObj<DashboardService>;
    menuService = TestBed.inject(
      EmptyCellContextMenuService
    ) as jasmine.SpyObj<EmptyCellContextMenuService>;
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  describe('handleEmptyCellContext()', () => {
    let mockEvent: MouseEvent;
    let mockContext: EmptyCellContext;

    beforeEach(() => {
      mockEvent = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 250,
      });
      spyOn(mockEvent, 'preventDefault');

      mockContext = {
        row: 2,
        col: 3,
        totalRows: 5,
        totalColumns: 5,
        gutterSize: '1em',
        createWidget: jasmine
          .createSpy('createWidget')
          .and.returnValue(true),
      };
    });

    it('should prevent default event behavior', () => {
      dashboardService.widgetTypes.and.returnValue([]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should show menu at mouse coordinates', () => {
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      expect(menuService.show).toHaveBeenCalledWith(
        150,
        250,
        jasmine.any(Array)
      );
    });

    it('should create menu items from available widgets', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].label).toBe(mockWidgetMetadata.name);
      expect(menuItems[1].label).toBe(mockWidgetMetadata.name);
    });

    it('should include SVG icons in menu items', () => {
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      expect(menuItems[0].svgIcon).toBe('<svg></svg>');
    });

    it('should handle case when no widgets are registered', () => {
      dashboardService.widgetTypes.and.returnValue([]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].disabled).toBe(true);
      expect(menuItems[0].label).toContain('No widgets available');
    });

    it('should call createWidget when menu item is clicked', () => {
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      const item = menuItems[0];
      if (!item.divider) {
        item.action();
      }

      expect(mockContext.createWidget).toHaveBeenCalledWith('test-widget');
    });

    it('should handle createWidget callback not being available', () => {
      const contextWithoutCallback: EmptyCellContext = {
        ...mockContext,
        createWidget: undefined,
      };
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);
      spyOn(console, 'warn');

      provider.handleEmptyCellContext(mockEvent, contextWithoutCallback);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      const item = menuItems[0];
      if (!item.divider) {
        item.action();
      }

      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error if widget creation fails', () => {
      const failingContext: EmptyCellContext = {
        ...mockContext,
        createWidget: jasmine
          .createSpy('createWidget')
          .and.returnValue(false),
      };
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);
      spyOn(console, 'error');

      provider.handleEmptyCellContext(mockEvent, failingContext);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      const item = menuItems[0];
      if (!item.divider) {
        item.action();
      }

      expect(console.error).toHaveBeenCalled();
    });

    it('should handle multiple widgets with different configurations', () => {
      const widgets = [
        {
          metadata: {
            widgetTypeid: 'widget-1',
            name: 'Widget One',
            description: 'First widget',
            svgIcon: '<svg>1</svg>',
          },
        },
        {
          metadata: {
            widgetTypeid: 'widget-2',
            name: 'Widget Two',
            description: 'Second widget',
            svgIcon: '<svg>2</svg>',
          },
        },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.show.calls.mostRecent().args[2];
      expect(menuItems[0].label).toBe('Widget One');
      expect(menuItems[0].svgIcon).toBe('<svg>1</svg>');
      expect(menuItems[1].label).toBe('Widget Two');
      expect(menuItems[1].svgIcon).toBe('<svg>2</svg>');
    });
  });
});
