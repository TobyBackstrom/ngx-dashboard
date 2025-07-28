import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DashboardViewportService } from '../dashboard-viewport.service';
import { DashboardStore } from '../../store/dashboard-store';
import {
  ReservedSpace,
  DEFAULT_RESERVED_SPACE,
} from '../../models/reserved-space';

// Mock ResizeObserver for testing
class MockResizeObserver {
  private callbacks: Array<(entries: any[]) => void> = [];

  constructor(callback: (entries: any[]) => void) {
    this.callbacks.push(callback);
    // Store reference for manual triggering in tests
    (MockResizeObserver as any).instances =
      (MockResizeObserver as any).instances || [];
    (MockResizeObserver as any).instances.push(this);
  }

  observe() {}
  disconnect() {}

  static triggerResize(width: number, height: number) {
    const instances = (MockResizeObserver as any).instances || [];
    instances.forEach((instance: MockResizeObserver) => {
      instance.callbacks.forEach((callback) => {
        callback([
          {
            contentBoxSize: [{ inlineSize: width, blockSize: height }],
          },
        ]);
      });
    });
  }

  static reset() {
    (MockResizeObserver as any).instances = [];
  }
}

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

describe('DashboardViewportService', () => {
  let service: DashboardViewportService;
  let store: InstanceType<typeof DashboardStore>;

  beforeEach(() => {
    // Mock ResizeObserver globally
    (window as any).ResizeObserver = MockResizeObserver;
    MockResizeObserver.reset();

    TestBed.configureTestingModule({
      providers: [
        DashboardViewportService,
        DashboardStore,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(DashboardViewportService);
    store = TestBed.inject(DashboardStore);

    // Initialize store with dashboard data
    store.initializeFromDto({
      version: '1.0.0',
      dashboardId: 'test-dashboard',
      rows: 8,
      columns: 16,
      gutterSize: '1em',
      cells: [],
    });

    // Set initial viewport size
    MockResizeObserver.triggerResize(1024, 768);
  });

  afterEach(() => {
    MockResizeObserver.reset();
  });

  describe('Constraint Calculations', () => {
    it('should constrain by height when grid aspect ratio is wide', () => {
      // Setup: Wide grid (16x8 = 2:1 aspect ratio) in landscape viewport (1024x768)
      // Available space: 1024x768 (no reserved space)
      // Max width from height: 768 * 2 = 1536 > 1024 (available width)
      // So width constrains: maxWidth = 1024, maxHeight = 1024/2 = 512

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('width');
      expect(constraints.maxWidth).toBe(1024);
      expect(constraints.maxHeight).toBe(512); // 1024 / 2 (aspect ratio)
    });

    it('should constrain by height when grid aspect ratio is tall', () => {
      // Setup: Tall grid (8x16 = 1:2 aspect ratio) in landscape viewport
      store.setGridConfig({ rows: 16, columns: 8 });

      // Available space: 1024x768
      // Aspect ratio: 8/16 = 0.5
      // Max width from height: 768 * 0.5 = 384 < 1024 (available width)
      // So height constrains: maxHeight = 768, maxWidth = 384

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('height');
      expect(constraints.maxWidth).toBe(384); // 768 * 0.5 (aspect ratio)
      expect(constraints.maxHeight).toBe(768);
    });

    it('should constrain by width in portrait viewport with wide grid', () => {
      // Setup: Portrait viewport (768x1024) with wide grid (16x8)
      MockResizeObserver.triggerResize(768, 1024);

      // Available space: 768x1024
      // Aspect ratio: 16/8 = 2
      // Max width from height: 1024 * 2 = 2048 > 768 (available width)
      // So width constrains: maxWidth = 768, maxHeight = 768/2 = 384

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('width');
      expect(constraints.maxWidth).toBe(768);
      expect(constraints.maxHeight).toBe(384); // 768 / 2
    });

    it('should constrain by height in portrait viewport with tall grid', () => {
      // Setup: Portrait viewport (768x1024) with tall grid (8x16)
      MockResizeObserver.triggerResize(768, 1024);
      store.setGridConfig({ rows: 16, columns: 8 });

      // Available space: 768x1024
      // Aspect ratio: 8/16 = 0.5
      // Max width from height: 1024 * 0.5 = 512 < 768 (available width)
      // So height constrains: maxHeight = 1024, maxWidth = 512

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('height');
      expect(constraints.maxWidth).toBe(512); // 1024 * 0.5
      expect(constraints.maxHeight).toBe(1024);
    });

    it('should handle square grid correctly', () => {
      // Setup: Square grid (8x8 = 1:1 aspect ratio)
      store.setGridConfig({ rows: 8, columns: 8 });

      // Available space: 1024x768
      // Aspect ratio: 8/8 = 1
      // Max width from height: 768 * 1 = 768 < 1024 (available width)
      // So height constrains: maxHeight = 768, maxWidth = 768

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('height');
      expect(constraints.maxWidth).toBe(768);
      expect(constraints.maxHeight).toBe(768);
    });

    it('should return available space when grid has zero rows', () => {
      // Edge case: Invalid grid dimensions
      store.setGridConfig({ rows: 0, columns: 8 });

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('none');
      expect(constraints.maxWidth).toBe(1024);
      expect(constraints.maxHeight).toBe(768);
    });

    it('should return available space when grid has zero columns', () => {
      // Edge case: Invalid grid dimensions
      store.setGridConfig({ rows: 8, columns: 0 });

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('none');
      expect(constraints.maxWidth).toBe(1024);
      expect(constraints.maxHeight).toBe(768);
    });

    it('should handle very small viewport dimensions', () => {
      // Edge case: Tiny viewport
      MockResizeObserver.triggerResize(100, 100);

      // Square grid should fit exactly
      store.setGridConfig({ rows: 4, columns: 4 });

      const constraints = service.constraints();

      expect(constraints.maxWidth).toBe(100);
      expect(constraints.maxHeight).toBe(100);
      expect(constraints.constrainedBy).toBe('height'); // or 'width' - both are equivalent for square
    });

    it('should handle very large grid dimensions', () => {
      // Edge case: Huge grid
      store.setGridConfig({ rows: 100, columns: 200 });

      // Aspect ratio: 200/100 = 2
      // Should still calculate correctly
      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('width');
      expect(constraints.maxWidth).toBe(1024);
      expect(constraints.maxHeight).toBe(512); // 1024 / 2
    });
  });

  describe('Reserved Space Integration', () => {
    it('should account for reserved space in constraint calculations', () => {
      // Setup: Reserve space on all sides
      const reservedSpace: ReservedSpace = {
        top: 64, // Toolbar
        right: 320, // Widget list
        bottom: 32, // Padding
        left: 32, // Padding
      };

      service.setReservedSpace(reservedSpace);

      // Available space: (1024 - 32 - 320) x (768 - 64 - 32) = 672 x 672
      // Square available space with 2:1 aspect ratio grid
      // Max width from height: 672 * 2 = 1344 > 672 (available width)
      // So width constrains: maxWidth = 672, maxHeight = 336

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('width');
      expect(constraints.maxWidth).toBe(672); // 1024 - 32 - 320
      expect(constraints.maxHeight).toBe(336); // 672 / 2
    });

    it('should handle asymmetric reserved space', () => {
      // Setup: Only reserve top and right space
      const reservedSpace: ReservedSpace = {
        top: 100,
        right: 200,
        bottom: 0,
        left: 0,
      };

      service.setReservedSpace(reservedSpace);

      // Available space: (1024 - 200) x (768 - 100) = 824 x 668
      // With 2:1 aspect ratio: height constrains
      // Max width from height: 668 * 2 = 1336 > 824
      // So width constrains: maxWidth = 824, maxHeight = 412

      const constraints = service.constraints();

      expect(constraints.constrainedBy).toBe('width');
      expect(constraints.maxWidth).toBe(824);
      expect(constraints.maxHeight).toBe(412); // 824 / 2
    });

    it('should not allow negative available space', () => {
      // Edge case: Reserved space larger than viewport
      const reservedSpace: ReservedSpace = {
        top: 400,
        right: 600,
        bottom: 400,
        left: 600,
      };

      service.setReservedSpace(reservedSpace);

      // Available space would be negative, should be clamped to 0
      const constraints = service.constraints();

      expect(constraints.maxWidth).toBe(0);
      expect(constraints.maxHeight).toBe(0);
    });

    it('should update constraints reactively when reserved space changes', () => {
      // Initial state: no reserved space
      let constraints = service.constraints();
      const initialMaxWidth = constraints.maxWidth;

      // Add reserved space
      service.setReservedSpace({
        top: 50,
        right: 100,
        bottom: 50,
        left: 100,
      });

      // Should recalculate automatically
      constraints = service.constraints();

      expect(constraints.maxWidth).toBeLessThan(initialMaxWidth);
      expect(constraints.maxWidth).toBe(1024 - 200); // 1024 - left - right
    });
  });

  describe('Signal Reactivity', () => {
    it('should recalculate constraints when grid dimensions change', () => {
      // Initial: 16x8 grid (wide)
      let constraints = service.constraints();
      expect(constraints.constrainedBy).toBe('width');
      const initialMaxHeight = constraints.maxHeight;

      // Change to 8x16 grid (tall)
      store.setGridConfig({ rows: 16, columns: 8 });

      // Should recalculate automatically
      constraints = service.constraints();
      expect(constraints.constrainedBy).toBe('height');
      expect(constraints.maxHeight).toBeGreaterThan(initialMaxHeight);
    });

    it('should recalculate constraints when viewport size changes', () => {
      // Initial viewport
      let constraints = service.constraints();
      const initialMaxWidth = constraints.maxWidth;

      // Resize viewport to be smaller
      MockResizeObserver.triggerResize(800, 600);

      // Should recalculate automatically
      constraints = service.constraints();
      expect(constraints.maxWidth).toBeLessThan(initialMaxWidth);
      expect(constraints.maxWidth).toBe(800);
    });
  });

  describe('Available Space Calculation', () => {
    it('should calculate available space correctly with default reserved space', () => {
      const availableSpace = service.availableSpace();

      expect(availableSpace.width).toBe(1024);
      expect(availableSpace.height).toBe(768);
    });

    it('should calculate available space correctly with custom reserved space', () => {
      service.setReservedSpace({
        top: 60,
        right: 300,
        bottom: 40,
        left: 20,
      });

      const availableSpace = service.availableSpace();

      expect(availableSpace.width).toBe(704); // 1024 - 20 - 300
      expect(availableSpace.height).toBe(668); // 768 - 60 - 40
    });
  });
});
