// dashboard-bridge.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { DashboardBridgeService } from '../dashboard-bridge.service';
import { DashboardStore } from '../../store/dashboard-store';
import { DragData, WidgetMetadata } from '../../models';

// Mock dashboard store for testing
function createMockDashboardStore(dashboardId = 'test-dashboard-1') {
  const mockStore = {
    dashboardId: jasmine.createSpy('dashboardId').and.returnValue(dashboardId),
    gridCellDimensions: jasmine.createSpy('gridCellDimensions').and.returnValue({ width: 120, height: 80 }),
    startDrag: jasmine.createSpy('startDrag'),
    endDrag: jasmine.createSpy('endDrag')
  };
  // Type assertion for mock object
  return mockStore as any;
  return mockStore;
}

// Mock widget metadata for testing
function createMockWidgetMetadata(): WidgetMetadata {
  return {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget for testing',
    svgIcon: '<svg><rect width="10" height="10"/></svg>'
  };
}

describe('DashboardBridgeService', () => {
  let service: DashboardBridgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardBridgeService]
    });
    service = TestBed.inject(DashboardBridgeService);
  });

  describe('Initial State', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with zero dashboards', () => {
      expect(service.dashboardCount()).toBe(0);
      expect(service.hasDashboards()).toBe(false);
      expect(service.registeredDashboards()).toEqual([]);
    });

    it('should provide fallback dimensions when no dashboards exist', () => {
      expect(service.availableDimensions()).toEqual({ width: 100, height: 100 });
    });
  });

  describe('Dashboard Registration', () => {
    it('should register a dashboard with its ID', () => {
      const mockStore = createMockDashboardStore('test-dashboard-1');
      
      service.registerDashboard(mockStore);
      
      expect(service.dashboardCount()).toBe(1);
      expect(service.hasDashboards()).toBe(true);
      expect(service.registeredDashboards()).toContain('test-dashboard-1');
    });

    it('should register multiple dashboards with different IDs', () => {
      const store1 = createMockDashboardStore('dashboard-1');
      const store2 = createMockDashboardStore('dashboard-2');
      
      service.registerDashboard(store1);
      service.registerDashboard(store2);
      
      expect(service.dashboardCount()).toBe(2);
      expect(service.registeredDashboards()).toContain('dashboard-1');
      expect(service.registeredDashboards()).toContain('dashboard-2');
    });

    it('should not register dashboard without ID', () => {
      const mockStore = createMockDashboardStore('');
      mockStore.dashboardId.and.returnValue('');
      
      service.registerDashboard(mockStore);
      
      expect(service.dashboardCount()).toBe(0);
    });

  });

  describe('Dashboard Unregistration', () => {
    it('should unregister a dashboard', () => {
      const mockStore = createMockDashboardStore('test-dashboard-1');
      service.registerDashboard(mockStore);
      
      expect(service.dashboardCount()).toBe(1);
      
      service.unregisterDashboard(mockStore);
      
      expect(service.dashboardCount()).toBe(0);
      expect(service.hasDashboards()).toBe(false);
      expect(service.registeredDashboards()).not.toContain('test-dashboard-1');
    });

    it('should handle unregistering dashboard without ID gracefully', () => {
      const mockStore = createMockDashboardStore('');
      mockStore.dashboardId.and.returnValue('');
      
      expect(() => service.unregisterDashboard(mockStore)).not.toThrow();
      expect(service.dashboardCount()).toBe(0);
    });


    it('should return to fallback dimensions when all dashboards removed', () => {
      const mockStore = createMockDashboardStore('test-dashboard-1');
      
      service.registerDashboard(mockStore);
      service.unregisterDashboard(mockStore);
      
      expect(service.availableDimensions()).toEqual({ width: 100, height: 100 });
    });
  });

  describe('Specific Dashboard Dimensions', () => {
    it('should return fallback dimensions for non-existent dashboard ID', () => {
      expect(service.getDashboardDimensions('non-existent')).toEqual({ width: 100, height: 100 });
    });
  });

  describe('Drag Operations', () => {
    it('should not start drag when no dashboards available', () => {
      const dragData: DragData = { kind: 'widget', content: createMockWidgetMetadata() };
      expect(() => service.startDrag(dragData)).not.toThrow();
    });

    it('should not throw when ending drag with no dashboards', () => {
      expect(() => service.endDrag()).not.toThrow();
    });
  });

  describe('Reactive Properties', () => {
    it('should reactively update dashboard count', () => {
      expect(service.dashboardCount()).toBe(0);
      
      const store1 = createMockDashboardStore('dashboard-1');
      service.registerDashboard(store1);
      expect(service.dashboardCount()).toBe(1);
      
      const store2 = createMockDashboardStore('dashboard-2');
      service.registerDashboard(store2);
      expect(service.dashboardCount()).toBe(2);
      
      service.unregisterDashboard(store1);
      expect(service.dashboardCount()).toBe(1);
      
      service.unregisterDashboard(store2);
      expect(service.dashboardCount()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle dashboard with undefined dimensions', () => {
      const mockStore = createMockDashboardStore('test-dashboard-1');
      mockStore.gridCellDimensions.and.returnValue(undefined);
      
      service.registerDashboard(mockStore);
      
      expect(service.availableDimensions()).toEqual({ width: 100, height: 100 });
      expect(service.getDashboardDimensions('test-dashboard-1')).toEqual({ width: 100, height: 100 });
    });

    it('should handle registration of many dashboards', () => {
      const stores: any[] = [];
      
      // Register 10 dashboards
      for (let i = 0; i < 10; i++) {
        const store = createMockDashboardStore(`dashboard-${i}`);
        stores.push(store);
        service.registerDashboard(store);
      }
      expect(service.dashboardCount()).toBe(10);
      
      // Unregister all
      stores.forEach(store => {
        service.unregisterDashboard(store);
      });
      expect(service.dashboardCount()).toBe(0);
      expect(service.hasDashboards()).toBe(false);
    });

    it('should handle mixed registration and unregistration cycles', () => {
      const store1 = createMockDashboardStore('dashboard-1');
      const store2 = createMockDashboardStore('dashboard-2');
      const store3 = createMockDashboardStore('dashboard-3');
      
      service.registerDashboard(store1);
      expect(service.dashboardCount()).toBe(1);
      
      service.registerDashboard(store2);
      expect(service.dashboardCount()).toBe(2);
      
      service.unregisterDashboard(store1);
      expect(service.dashboardCount()).toBe(1);
      
      service.registerDashboard(store3);
      expect(service.dashboardCount()).toBe(2);
      
      service.unregisterDashboard(store2);
      service.unregisterDashboard(store3);
      expect(service.dashboardCount()).toBe(0);
    });

    it('should handle updateDashboardRegistration method', () => {
      const mockStore = createMockDashboardStore('test-dashboard-1');
      
      service.updateDashboardRegistration(mockStore);
      
      expect(service.dashboardCount()).toBe(1);
      expect(service.registeredDashboards()).toContain('test-dashboard-1');
    });
  });
});