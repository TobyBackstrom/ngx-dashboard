import { TestBed } from '@angular/core/testing';
import { WidgetListContextMenuProvider } from '../widget-list-context-menu.provider';
import { DashboardService } from '../../../services/dashboard.service';
import { EmptyCellContextMenuService } from '../../../services/empty-cell-context-menu.service';
import type { EmptyCellContext } from '../empty-cell-context.provider';
import type { WidgetMetadata } from '../../../models/widget';

describe('WidgetListContextMenuProvider', () => {
  let provider: WidgetListContextMenuProvider;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let menuService: EmptyCellContextMenuService;

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

    TestBed.configureTestingModule({
      providers: [
        WidgetListContextMenuProvider,
        { provide: DashboardService, useValue: dashboardServiceSpy },
        EmptyCellContextMenuService, // Use real service for signal testing
      ],
    });

    provider = TestBed.inject(WidgetListContextMenuProvider);
    dashboardService = TestBed.inject(
      DashboardService
    ) as jasmine.SpyObj<DashboardService>;
    menuService = TestBed.inject(EmptyCellContextMenuService);

    // Reset service state before each test
    menuService.setLastSelection(null);
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

      const menu = menuService.activeMenu();
      expect(menu).toBeTruthy();
      expect(menu?.x).toBe(150);
      expect(menu?.y).toBe(250);
    });

    it('should create menu items from available widgets', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].label).toBe(mockWidgetMetadata.name);
      expect(menuItems[1].label).toBe(mockWidgetMetadata.name);
    });

    it('should include SVG icons in menu items', () => {
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems[0].svgIcon).toBe('<svg></svg>');
    });

    it('should include widgetTypeId in menu items', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'test-widget-id' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems[0]).toEqual(
        jasmine.objectContaining({
          widgetTypeId: 'test-widget-id',
        })
      );
    });

    it('should handle case when no widgets are registered', () => {
      dashboardService.widgetTypes.and.returnValue([]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].disabled).toBe(true);
      expect(menuItems[0].label).toContain('No widgets available');
    });

    it('should call createWidget when menu item is clicked', () => {
      dashboardService.widgetTypes.and.returnValue([
        { metadata: mockWidgetMetadata } as any,
      ]);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
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

      const menuItems = menuService.activeMenu()?.items || [];
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

      const menuItems = menuService.activeMenu()?.items || [];
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

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems[0].label).toBe('Widget One');
      expect(menuItems[0].svgIcon).toBe('<svg>1</svg>');
      expect(menuItems[1].label).toBe('Widget Two');
      expect(menuItems[1].svgIcon).toBe('<svg>2</svg>');
    });
  });

  describe('quick-repeat functionality', () => {
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

    it('should show normal menu when no last selection exists', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].label).toBe('Widget A');
      expect(menuItems[1].label).toBe('Widget B');
      // No dividers in normal menu
      expect(menuItems.every((item) => !item.divider)).toBe(true);
    });

    it('should show quick-repeat menu when last selection exists', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-3', name: 'Widget C' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      // Set last selection to widget-2
      menuService.setLastSelection('widget-2');

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      // Should have: quick-repeat + divider + 3 original items = 5 items
      expect(menuItems.length).toBe(5);

      // First item should be the quick-repeat (Widget B)
      expect(menuItems[0].label).toBe('Widget B');
      expect(menuItems[0]).toEqual(
        jasmine.objectContaining({
          widgetTypeId: 'widget-2',
        })
      );

      // Second item should be a divider
      expect(menuItems[1].divider).toBe(true);

      // Remaining items should be the full list
      expect(menuItems[2].label).toBe('Widget A');
      expect(menuItems[3].label).toBe('Widget B');
      expect(menuItems[4].label).toBe('Widget C');
    });

    it('should fall back to normal menu when last selected widget is not available', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      // Set last selection to a widget that doesn't exist
      menuService.setLastSelection('non-existent-widget');

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      // Should show normal menu without quick-repeat
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].label).toBe('Widget A');
      expect(menuItems[1].label).toBe('Widget B');
      expect(menuItems.every((item) => !item.divider)).toBe(true);
    });

    it('should handle quick-repeat when widget is first in list', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      menuService.setLastSelection('widget-1');

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems.length).toBe(4); // quick-repeat + divider + 2 originals

      expect(menuItems[0].label).toBe('Widget A');
      expect(menuItems[1].divider).toBe(true);
      expect(menuItems[2].label).toBe('Widget A'); // Duplicate
      expect(menuItems[3].label).toBe('Widget B');
    });

    it('should handle quick-repeat when widget is last in list', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      menuService.setLastSelection('widget-2');

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      expect(menuItems.length).toBe(4);

      expect(menuItems[0].label).toBe('Widget B');
      expect(menuItems[1].divider).toBe(true);
      expect(menuItems[2].label).toBe('Widget A');
      expect(menuItems[3].label).toBe('Widget B'); // Duplicate
    });

    it('should include correct widgetTypeId in quick-repeat item', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      menuService.setLastSelection('widget-2');

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      const quickRepeatItem = menuItems[0];

      if (!quickRepeatItem.divider) {
        expect(quickRepeatItem.widgetTypeId).toBe('widget-2');
      }
    });

    it('should create correct widget when quick-repeat item is clicked', () => {
      const widgets = [
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-1', name: 'Widget A' } },
        { metadata: { ...mockWidgetMetadata, widgetTypeid: 'widget-2', name: 'Widget B' } },
      ];
      dashboardService.widgetTypes.and.returnValue(widgets as any);

      menuService.setLastSelection('widget-2');

      provider.handleEmptyCellContext(mockEvent, mockContext);

      const menuItems = menuService.activeMenu()?.items || [];
      const quickRepeatItem = menuItems[0];

      if (!quickRepeatItem.divider) {
        quickRepeatItem.action();
      }

      expect(mockContext.createWidget).toHaveBeenCalledWith('widget-2');
    });
  });
});
