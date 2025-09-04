// widget-list-bridge-integration.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WidgetListComponent } from '../widget-list.component';
import { DashboardBridgeService } from '../../services/dashboard-bridge.service';
import { DashboardService } from '../../services/dashboard.service';
import { ArrowWidgetComponent } from '@dragonworks/ngx-dashboard-widgets';

// MockDashboardComponent removed - not used in tests

describe('WidgetListComponent Integration with DashboardBridgeService', () => {
  let component: WidgetListComponent;
  let fixture: ComponentFixture<WidgetListComponent>;
  let bridgeService: DashboardBridgeService;
  let dashboardService: DashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetListComponent],
      providers: [DashboardBridgeService, DashboardService],
    }).compileComponents();

    // Register a test widget
    dashboardService = TestBed.inject(DashboardService);
    dashboardService.registerWidgetType(ArrowWidgetComponent);

    bridgeService = TestBed.inject(DashboardBridgeService);
    fixture = TestBed.createComponent(WidgetListComponent);
    component = fixture.componentInstance;
  });

  describe('Standalone Functionality', () => {
    it('should create without any registered dashboards', () => {
      expect(component).toBeTruthy();
      expect(bridgeService.dashboardCount()).toBe(0);
    });

    it('should use fallback dimensions when no dashboards registered', () => {
      fixture.detectChanges();

      expect(component.gridCellDimensions()).toEqual({
        width: 100,
        height: 100,
      });
    });

    it('should display available widgets even without dashboards', () => {
      fixture.detectChanges();

      expect(component.widgets().length).toBeGreaterThan(0);
      expect(component.widgets()[0].widgetTypeid).toBe(
        '@ngx-dashboard/arrow-widget'
      );
    });

    it('should handle drag start/end gracefully without dashboards', () => {
      // Mock DragEvent for testing - uses any to avoid strict type requirements
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setDragImage: jasmine.createSpy('setDragImage'),
        },
      } as any;

      const widget = component.widgets()[0];

      expect(() => {
        component.onDragStart(mockEvent, widget);
        component.onDragEnd();
      }).not.toThrow();
    });
  });

  describe('Drag Ghost Creation', () => {
    it('should create drag ghost with fallback dimensions when no dashboards', () => {
      fixture.detectChanges();

      // Mock DragEvent for testing - uses any to avoid strict type requirements
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setDragImage: jasmine.createSpy('setDragImage'),
        },
      } as any;

      const widget = component.widgets()[0];
      component.onDragStart(mockEvent, widget);

      // Should still work with fallback dimensions
      expect(mockEvent.dataTransfer.setDragImage).toHaveBeenCalled();
    });
  });

  describe('Widget State Management', () => {
    it('should manage active widget state independently of dashboard registration', () => {
      expect(component.activeWidget()).toBeNull();

      // Mock DragEvent for testing - uses any to avoid strict type requirements
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setDragImage: jasmine.createSpy('setDragImage'),
        },
      } as any;

      const widget = component.widgets()[0];

      component.onDragStart(mockEvent, widget);
      expect(component.activeWidget()).toBe(widget.widgetTypeid);

      component.onDragEnd();
      expect(component.activeWidget()).toBeNull();
    });
  });
});
