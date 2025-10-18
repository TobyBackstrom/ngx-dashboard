import { TestBed } from '@angular/core/testing';
import {
  EmptyCellContextMenuService,
  EmptyCellContextMenuItem,
} from '../empty-cell-context-menu.service';

describe('EmptyCellContextMenuService', () => {
  let service: EmptyCellContextMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmptyCellContextMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null activeMenu', () => {
    expect(service.activeMenu()).toBeNull();
  });

  describe('show()', () => {
    it('should set activeMenu with provided coordinates and items', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        { label: 'Item 1', action },
        { label: 'Item 2', action },
      ];

      service.show(100, 200, items);

      const menu = service.activeMenu();
      expect(menu).toBeTruthy();
      expect(menu?.x).toBe(100);
      expect(menu?.y).toBe(200);
      expect(menu?.items).toEqual(items);
    });

    it('should handle empty items array', () => {
      service.show(50, 75, []);

      const menu = service.activeMenu();
      expect(menu).toBeTruthy();
      expect(menu?.items).toEqual([]);
    });

    it('should support menu items with SVG icons', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        {
          label: 'Widget',
          svgIcon: '<svg></svg>',
          action,
        },
      ];

      service.show(0, 0, items);

      const menu = service.activeMenu();
      expect(menu?.items[0]).toEqual(jasmine.objectContaining({
        svgIcon: '<svg></svg>',
      }));
    });

    it('should support menu items with Material icons', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        {
          label: 'Widget',
          icon: 'widgets',
          action,
        },
      ];

      service.show(0, 0, items);

      const menu = service.activeMenu();
      expect(menu?.items[0]).toEqual(jasmine.objectContaining({
        icon: 'widgets',
      }));
    });

    it('should support disabled menu items', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        {
          label: 'Disabled Item',
          disabled: true,
          action,
        },
      ];

      service.show(0, 0, items);

      const menu = service.activeMenu();
      expect(menu?.items[0]).toEqual(jasmine.objectContaining({
        disabled: true,
      }));
    });

    it('should support divider items', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        { label: 'Item 1', action },
        { divider: true },
        { label: 'Item 2', action },
      ];

      service.show(0, 0, items);

      const menu = service.activeMenu();
      expect(menu?.items[1]).toEqual({ divider: true });
    });
  });

  describe('hide()', () => {
    it('should set activeMenu to null', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        { label: 'Item', action },
      ];

      service.show(100, 200, items);
      expect(service.activeMenu()).toBeTruthy();

      service.hide();
      expect(service.activeMenu()).toBeNull();
    });

    it('should be safe to call when menu is already hidden', () => {
      expect(service.activeMenu()).toBeNull();
      service.hide();
      expect(service.activeMenu()).toBeNull();
    });
  });

  describe('activeMenu signal', () => {
    it('should update when show() is called', () => {
      const action = jasmine.createSpy('action');
      const items: EmptyCellContextMenuItem[] = [
        { label: 'Test', action },
      ];

      service.show(10, 20, items);
      const menu1 = service.activeMenu();

      service.show(30, 40, items);
      const menu2 = service.activeMenu();

      expect(menu1).not.toBe(menu2);
      expect(menu2?.x).toBe(30);
      expect(menu2?.y).toBe(40);
    });
  });

  describe('lastSelectedWidgetTypeId', () => {
    it('should initialize with null', () => {
      expect(service.lastSelectedWidgetTypeId()).toBeNull();
    });
  });

  describe('setLastSelection()', () => {
    it('should set the last selected widget type ID', () => {
      service.setLastSelection('test-widget-type');
      expect(service.lastSelectedWidgetTypeId()).toBe('test-widget-type');
    });

    it('should update to new widget type ID when called multiple times', () => {
      service.setLastSelection('widget-a');
      expect(service.lastSelectedWidgetTypeId()).toBe('widget-a');

      service.setLastSelection('widget-b');
      expect(service.lastSelectedWidgetTypeId()).toBe('widget-b');
    });

    it('should clear the last selection when passed null', () => {
      service.setLastSelection('test-widget-type');
      expect(service.lastSelectedWidgetTypeId()).toBe('test-widget-type');

      service.setLastSelection(null);
      expect(service.lastSelectedWidgetTypeId()).toBeNull();
    });

    it('should support setting the same widget type ID multiple times', () => {
      service.setLastSelection('widget-a');
      service.setLastSelection('widget-a');
      expect(service.lastSelectedWidgetTypeId()).toBe('widget-a');
    });
  });
});
