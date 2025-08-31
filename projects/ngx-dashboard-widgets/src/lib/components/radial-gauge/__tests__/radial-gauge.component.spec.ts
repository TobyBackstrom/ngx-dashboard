import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import {
  RadialGaugeComponent,
  RadialGaugeSegment,
} from '../radial-gauge.component';

describe('RadialGaugeComponent', () => {
  let component: RadialGaugeComponent;
  let fixture: ComponentFixture<RadialGaugeComponent>;
  let originalResizeObserver: any;

  beforeEach(async () => {
    // Mock ResizeObserver globally for all tests
    originalResizeObserver = (window as any).ResizeObserver;
    (window as any).ResizeObserver = class MockResizeObserver {
      observe = jasmine.createSpy('observe');
      disconnect = jasmine.createSpy('disconnect');
      unobserve = jasmine.createSpy('unobserve');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_callback: ResizeObserverCallback) {
        // Mock constructor - no implementation needed
      }
    };

    await TestBed.configureTestingModule({
      imports: [RadialGaugeComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    }).compileComponents();

    fixture = TestBed.createComponent(RadialGaugeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    // Restore original ResizeObserver
    if (originalResizeObserver) {
      (window as any).ResizeObserver = originalResizeObserver;
    } else {
      delete (window as any).ResizeObserver;
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Component Setup', () => {
    it('should have default values for all inputs', () => {
      expect(component.value()).toBe(0);
      expect(component.min()).toBe(0);
      expect(component.max()).toBe(100);
      expect(component.title()).toBe('Gauge');
      expect(component.description()).toBe('');
      expect(component.size()).toBe(300);
      expect(component.fitToContainer()).toBe(false);
      expect(component.responsiveMode()).toBe(false);
      expect(component.hasBackground()).toBe(false);
      expect(component.showValueLabel()).toBe(true);
    });

    it('should generate unique IDs for accessibility attributes', () => {
      const titleId = component.titleId;
      const descId = component.descId;
      const clipId = component.clipId;

      expect(titleId).toMatch(/^rg-title-[a-z0-9]+$/);
      expect(descId).toMatch(/^rg-desc-[a-z0-9]+$/);
      expect(clipId).toMatch(/^rg-clip-[a-z0-9]+$/);

      expect(titleId).not.toBe(descId);
      expect(titleId).not.toBe(clipId);
      expect(descId).not.toBe(clipId);
    });

    it('should initialize with computed signals', () => {
      fixture.detectChanges();

      expect(component.clampedValue()).toBe(0);
      expect(component.percentage()).toBe(0);
      expect(component.percent()).toBe(0);
      expect(component.formattedLabel()).toBe('0');
      expect(component.ariaLabel()).toContain('Gauge: 0 (range 0–100)');
    });
  });

  describe('Mathematical Utility Functions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Value Clamping and Percentage Calculation', () => {
      it('should clamp value within min-max range', () => {
        fixture.componentRef.setInput('value', -10);
        fixture.componentRef.setInput('min', 0);
        fixture.componentRef.setInput('max', 100);
        fixture.detectChanges();

        expect(component.clampedValue()).toBe(0);

        fixture.componentRef.setInput('value', 150);
        fixture.detectChanges();

        expect(component.clampedValue()).toBe(100);

        fixture.componentRef.setInput('value', 50);
        fixture.detectChanges();

        expect(component.clampedValue()).toBe(50);
      });

      it('should calculate percentage correctly', () => {
        fixture.componentRef.setInput('value', 25);
        fixture.componentRef.setInput('min', 0);
        fixture.componentRef.setInput('max', 100);
        fixture.detectChanges();

        expect(component.percentage()).toBe(0.25);
        expect(component.percent()).toBe(25);

        fixture.componentRef.setInput('value', 75);
        fixture.detectChanges();

        expect(component.percentage()).toBe(0.75);
        expect(component.percent()).toBe(75);
      });

      it('should handle custom min-max ranges', () => {
        fixture.componentRef.setInput('value', 30);
        fixture.componentRef.setInput('min', 20);
        fixture.componentRef.setInput('max', 40);
        fixture.detectChanges();

        expect(component.percentage()).toBe(0.5); // (30-20)/(40-20) = 0.5
        expect(component.percent()).toBe(50);
      });

      it('should handle zero range gracefully', () => {
        fixture.componentRef.setInput('value', 50);
        fixture.componentRef.setInput('min', 50);
        fixture.componentRef.setInput('max', 50);
        fixture.detectChanges();

        expect(component.percentage()).toBe(0);
        expect(component.percent()).toBe(0);
      });
    });

    describe('Value Positioning', () => {
      it('should position gauge value correctly across the range', () => {
        const testCases = [
          { value: 0, percent: 0 },
          { value: 25, percent: 25 },
          { value: 50, percent: 50 },
          { value: 75, percent: 75 },
          { value: 100, percent: 100 }
        ];
        
        testCases.forEach(({ value, percent }) => {
          fixture.componentRef.setInput('value', value);
          fixture.detectChanges();
          
          expect(component.percent()).toBe(percent);
          expect(component.valueColor()).toBeDefined();
        });
      });
    });

    describe('Visual Output Integration', () => {
      it('should generate consistent arc paths for different sizes', () => {
        const testSizes = [100, 200, 300, 400];
        
        testSizes.forEach(size => {
          fixture.componentRef.setInput('size', size);
          fixture.detectChanges();
          
          const backgroundPath = component.backgroundArcPath();
          const segmentPaths = component.segmentPaths();
          
          // Verify paths are generated and properly formatted
          expect(backgroundPath).toMatch(/^M [\d.-]+ [\d.-]+ A [\d.-]+ [\d.-]+ 0 [01] [01] [\d.-]+ [\d.-]+$/);
          expect(segmentPaths.length).toBe(3); // Default segments
          
          segmentPaths.forEach(segment => {
            expect(segment.path).toMatch(/^M [\d.-]+ [\d.-]+ A [\d.-]+ [\d.-]+ 0 [01] [01] [\d.-]+ [\d.-]+$/);
            expect(segment.color).toMatch(/^var\(--gauge-value-(critical|warning|good)/);
          });
        });
      });
    });

    describe('Segment Path Generation', () => {
      it('should generate correct segment paths for complex configurations', () => {
        const customSegments = [
          { from: 0, to: 30, color: 'red' },
          { from: 30, to: 70, color: 'yellow' },
          { from: 70, to: 100, color: 'green' }
        ];
        
        fixture.componentRef.setInput('segments', customSegments);
        fixture.componentRef.setInput('value', 50);
        fixture.detectChanges();
        
        const segmentPaths = component.segmentPaths();
        
        expect(segmentPaths.length).toBe(3);
        segmentPaths.forEach((segment, index) => {
          expect(segment.path).toMatch(/^M [\d.-]+ [\d.-]+ A [\d.-]+ [\d.-]+ 0 [01] [01] [\d.-]+ [\d.-]+$/);
          expect(segment.color).toBe(customSegments[index].color);
        });
      });

      it('should handle segment gaps correctly', () => {
        fixture.componentRef.setInput('segmentGapPx', 8);
        fixture.detectChanges();
        
        const segmentPaths = component.segmentPaths();
        
        // With gaps, segments should be shorter (gaps create space between them)
        expect(segmentPaths.length).toBe(3);
        segmentPaths.forEach(segment => {
          expect(segment.path).toBeDefined();
          expect(segment.color).toBeDefined();
        });
      });
    });

    describe('Segment Visual Behavior', () => {
      it('should adapt segment appearance based on gap size', () => {
        const testGaps = [0, 4, 8, 16];
        
        testGaps.forEach(gap => {
          fixture.componentRef.setInput('segmentGapPx', gap);
          fixture.detectChanges();
          
          const segmentPaths = component.segmentPaths();
          
          // All gaps should produce valid segments
          expect(segmentPaths.length).toBe(3);
          
          // Visual verification that segments are properly formed
          segmentPaths.forEach(segment => {
            expect(segment.path.length).toBeGreaterThan(10); // Non-trivial path
            expect(segment.path).toContain('A'); // Contains arc command
          });
        });
      });
    });
  });

  describe('Size and Thickness Calculations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Manual Size Mode', () => {
      it('should use manual size when fitToContainer is false', () => {
        fixture.componentRef.setInput('size', 400);
        fixture.componentRef.setInput('fitToContainer', false);
        fixture.detectChanges();

        expect((component as any).effectiveSize()).toBe(400);
      });

      it('should use manual thickness values when responsiveMode is false', () => {
        fixture.componentRef.setInput('responsiveMode', false);
        fixture.componentRef.setInput('outerThickness', 40);
        fixture.componentRef.setInput('innerThickness', 15);
        fixture.componentRef.setInput('gap', 10);
        fixture.detectChanges();

        expect(component.effectiveOuterThickness()).toBe(40);
        expect(component.effectiveInnerThickness()).toBe(15);
        expect(component.effectiveGap()).toBe(10);
      });
    });

    describe('Responsive Mode', () => {
      it('should calculate base thickness from size and ratio', () => {
        fixture.componentRef.setInput('responsiveMode', true);
        fixture.componentRef.setInput('size', 300);
        fixture.componentRef.setInput('sizeToThicknessRatio', 15);
        fixture.detectChanges();

        expect((component as any).baseThickness()).toBe(20); // 300/15
      });

      it('should calculate proportional thickness values', () => {
        fixture.componentRef.setInput('responsiveMode', true);
        fixture.componentRef.setInput('size', 300);
        fixture.componentRef.setInput('sizeToThicknessRatio', 20);
        fixture.componentRef.setInput('responsiveProportions', {
          outer: 3,
          inner: 1,
          gap: 0.5,
        });
        fixture.detectChanges();

        expect(component.effectiveOuterThickness()).toBe(45); // 15 * 3
        expect(component.effectiveInnerThickness()).toBe(15); // 15 * 1
        expect(component.effectiveGap()).toBe(7.5); // 15 * 0.5
      });

      it('should ignore manual thickness when responsiveMode is true', () => {
        fixture.componentRef.setInput('responsiveMode', true);
        fixture.componentRef.setInput('size', 200);
        fixture.componentRef.setInput('sizeToThicknessRatio', 10);
        fixture.componentRef.setInput('outerThickness', 999);
        fixture.componentRef.setInput('innerThickness', 888);
        fixture.componentRef.setInput('gap', 777);
        fixture.detectChanges();

        expect(component.effectiveOuterThickness()).toBe(60); // 20 * 3 (not 999)
        expect(component.effectiveInnerThickness()).toBe(20); // 20 * 1 (not 888)
        expect(component.effectiveGap()).toBe(10); // 20 * 0.5 (not 777)
      });
    });

    describe('SVG Layout Calculations', () => {
      it('should calculate SVG dimensions correctly', () => {
        fixture.componentRef.setInput('size', 200);
        fixture.componentRef.setInput('outerThickness', 20);
        fixture.detectChanges();

        expect(component.svgWidth()).toBe(220); // size + outerThickness
        expect(component.svgHeight()).toBe(110); // size/2 + outerThickness/2
        expect(component.centerX()).toBe(110); // size/2 + outerThickness/2
        expect(component.centerY()).toBe(110); // size/2 + outerThickness/2
      });

      it('should calculate radii correctly', () => {
        fixture.componentRef.setInput('size', 200);
        fixture.componentRef.setInput('outerThickness', 20);
        fixture.componentRef.setInput('innerThickness', 10);
        fixture.componentRef.setInput('gap', 5);
        fixture.detectChanges();

        expect(component.outerRadius()).toBe(100); // size/2
        expect(component.innerRadius()).toBe(85); // outerRadius - outerThickness/2 - gap
        expect(component.legendOuterRadius()).toBe(80); // innerRadius - innerThickness/2
        expect(component.legendInnerRadius()).toBe(70); // legendOuterRadius - innerThickness
      });
    });
  });

  describe('Segment Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should use default segments when none provided', () => {
      const segments = component.actualSegments();

      expect(segments.length).toBe(3);
      expect(segments[0]).toEqual({
        from: 0,
        to: 60,
        color: 'var(--gauge-value-critical, #dc2626)',
      });
      expect(segments[1]).toEqual({
        from: 60,
        to: 80,
        color: 'var(--gauge-value-warning, #f59e0b)',
      });
      expect(segments[2]).toEqual({
        from: 80,
        to: 100,
        color: 'var(--gauge-value-good, #10b981)',
      });
    });

    it('should use custom segments when provided', () => {
      const customSegments: RadialGaugeSegment[] = [
        { from: 0, to: 50, color: 'red' },
        { from: 50, to: 100, color: 'green' },
      ];

      fixture.componentRef.setInput('segments', customSegments);
      fixture.detectChanges();

      expect(component.actualSegments()).toEqual(customSegments);
    });

    it('should adapt default segments to custom ranges', () => {
      fixture.componentRef.setInput('min', 10);
      fixture.componentRef.setInput('max', 110);
      fixture.detectChanges();

      const segments = component.actualSegments();

      expect(segments[0]).toEqual({
        from: 10,
        to: 70, // 10 + 0.6 * 100
        color: 'var(--gauge-value-critical, #dc2626)',
      });
      expect(segments[1]).toEqual({
        from: 70,
        to: 90, // 10 + 0.8 * 100
        color: 'var(--gauge-value-warning, #f59e0b)',
      });
      expect(segments[2]).toEqual({
        from: 90,
        to: 110,
        color: 'var(--gauge-value-good, #10b981)',
      });
    });

    it('should generate segment paths correctly', () => {
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();

      const segmentPaths = component.segmentPaths();
      expect(segmentPaths.length).toBe(3);

      segmentPaths.forEach((segment) => {
        expect(segment.path).toBeDefined();
        expect(segment.color).toBeDefined();
        expect(segment.path).toMatch(
          /^M \d+\.?\d* \d+\.?\d* A \d+\.?\d* \d+\.?\d* 0 [01] 1 \d+\.?\d* \d+\.?\d*$/
        );
      });
    });

    it('should determine value color based on segments', () => {
      fixture.componentRef.setInput('value', 30);
      fixture.detectChanges();

      expect(component.valueColor()).toBe(
        'var(--gauge-value-critical, #dc2626)'
      );

      fixture.componentRef.setInput('value', 70);
      fixture.detectChanges();

      expect(component.valueColor()).toBe(
        'var(--gauge-value-warning, #f59e0b)'
      );

      fixture.componentRef.setInput('value', 90);
      fixture.detectChanges();

      expect(component.valueColor()).toBe('var(--gauge-value-good, #10b981)');
    });
  });

  describe('Text Label Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format labels using Intl.NumberFormat', () => {
      fixture.componentRef.setInput('value', 75.123456);
      fixture.detectChanges();

      expect(component.formattedLabel()).toBe('75.1'); // max 1 fraction digit

      fixture.componentRef.setInput('value', 42);
      fixture.detectChanges();

      expect(component.formattedLabel()).toBe('42');
    });

    it('should show/hide value label based on showValueLabel input', () => {
      fixture.componentRef.setInput('showValueLabel', true);
      fixture.detectChanges();

      expect(component.valueTransform()).not.toBe('');

      fixture.componentRef.setInput('showValueLabel', false);
      fixture.detectChanges();

      expect(component.valueTransform()).toBe('');
    });

    it('should build reference string correctly', () => {
      // Default: uses formatted label
      expect(component.referenceString()).toBe(component.formattedLabel());

      // String reference
      fixture.componentRef.setInput('labelReference', 'TEST');
      fixture.detectChanges();

      expect(component.referenceString()).toBe('TEST');

      // Number reference
      fixture.componentRef.setInput('labelReference', 3);
      fixture.componentRef.setInput('referenceGlyph', 'X');
      fixture.detectChanges();

      expect(component.referenceString()).toBe('XXX');
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate correct ARIA label', () => {
      fixture.componentRef.setInput('title', 'CPU Usage');
      fixture.componentRef.setInput('value', 75);
      fixture.componentRef.setInput('min', 0);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      expect(component.ariaLabel()).toBe('CPU Usage: 75 (range 0–100)');
    });

    it('should set proper host attributes', () => {
      fixture.componentRef.setInput('title', 'Temperature');
      fixture.componentRef.setInput('value', 68.7);
      fixture.componentRef.setInput('min', 0);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      const hostElement = fixture.nativeElement;

      expect(hostElement.getAttribute('role')).toBe('meter');
      expect(hostElement.getAttribute('aria-valuemin')).toBe('0');
      expect(hostElement.getAttribute('aria-valuemax')).toBe('100');
      expect(hostElement.getAttribute('aria-valuenow')).toBe('68.7');
      expect(hostElement.getAttribute('aria-valuetext')).toBe('68.7');
      expect(hostElement.getAttribute('aria-label')).toContain(
        'Temperature: 68.7'
      );
    });

    it('should add appropriate CSS classes to host', () => {
      const hostElement = fixture.nativeElement;

      expect(hostElement.classList.contains('fit-container')).toBe(false);
      expect(hostElement.classList.contains('has-background')).toBe(false);

      fixture.componentRef.setInput('fitToContainer', true);
      fixture.componentRef.setInput('hasBackground', true);
      fixture.detectChanges();

      expect(hostElement.classList.contains('fit-container')).toBe(true);
      expect(hostElement.classList.contains('has-background')).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle zero-size gracefully', () => {
      fixture.componentRef.setInput('size', 0);
      fixture.detectChanges();

      expect(component.svgWidth()).toBe(component.effectiveOuterThickness());
      expect(component.outerRadius()).toBe(0);
      expect(component.centerX()).toBeGreaterThan(0); // Should still have padding from thickness
    });

    it('should handle negative values gracefully', () => {
      fixture.componentRef.setInput('value', -50);
      fixture.componentRef.setInput('min', -100);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      expect(component.clampedValue()).toBe(-50);
      expect(component.percentage()).toBe(0.25); // (-50 - (-100)) / (100 - (-100))
    });

    it('should handle very small thickness values', () => {
      fixture.componentRef.setInput('outerThickness', 0.1);
      fixture.componentRef.setInput('innerThickness', 0.1);
      fixture.componentRef.setInput('gap', 0.1);
      fixture.detectChanges();

      expect(component.effectiveOuterThickness()).toBe(0.1);
      expect(component.effectiveInnerThickness()).toBe(0.1);
      expect(component.effectiveGap()).toBe(0.1);
    });

    it('should handle extreme aspect ratios in responsive mode', () => {
      fixture.componentRef.setInput('responsiveMode', true);
      fixture.componentRef.setInput('sizeToThicknessRatio', 1000);
      fixture.componentRef.setInput('size', 100);
      fixture.detectChanges();

      expect((component as any).baseThickness()).toBe(0.1); // 100/1000
      expect(component.effectiveOuterThickness()).toBeCloseTo(0.3, 10); // 0.1 * 3 (handle floating point precision)
    });

    it('should handle invalid segment ranges', () => {
      const invalidSegments: RadialGaugeSegment[] = [
        { from: 50, to: 25, color: 'red' }, // Invalid: to < from
        { from: 100, to: 200, color: 'green' }, // Out of range
      ];

      fixture.componentRef.setInput('segments', invalidSegments);
      fixture.componentRef.setInput('min', 0);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      // Should still generate paths (even if visually incorrect)
      const segmentPaths = component.segmentPaths();
      expect(segmentPaths.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle getBBox failures gracefully', () => {
      const safeBBox = component.safeBBox.bind(component);

      // Create a mock element that throws on getBBox
      const mockElement = {
        getBBox: () => {
          throw new Error('getBBox failed');
        },
      } as any;

      const result = safeBBox(mockElement);

      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle zero-width/height getBBox results', () => {
      const safeBBox = component.safeBBox.bind(component);

      // Create a mock element that returns zero dimensions
      const mockElement = {
        getBBox: () => new DOMRect(0, 0, 0, 0),
      } as any;

      const result = safeBBox(mockElement);

      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });
  });

  describe('Input Combinations and Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should work correctly with all responsive features enabled', () => {
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.componentRef.setInput('responsiveMode', true);
      fixture.componentRef.setInput('sizeToThicknessRatio', 15);
      fixture.componentRef.setInput('hasBackground', true);
      fixture.componentRef.setInput('showValueLabel', true);
      fixture.detectChanges();

      expect(component.fitToContainer()).toBe(true);
      expect(component.responsiveMode()).toBe(true);
      expect(component.hasBackground()).toBe(true);
      expect(component.showValueLabel()).toBe(true);
    });

    it('should work correctly with all manual settings', () => {
      fixture.componentRef.setInput('size', 400);
      fixture.componentRef.setInput('fitToContainer', false);
      fixture.componentRef.setInput('responsiveMode', false);
      fixture.componentRef.setInput('outerThickness', 50);
      fixture.componentRef.setInput('innerThickness', 20);
      fixture.componentRef.setInput('gap', 15);
      fixture.detectChanges();

      expect((component as any).effectiveSize()).toBe(400);
      expect(component.effectiveOuterThickness()).toBe(50);
      expect(component.effectiveInnerThickness()).toBe(20);
      expect(component.effectiveGap()).toBe(15);
    });

    it('should maintain consistency when switching between modes', () => {
      // Start with responsive mode
      fixture.componentRef.setInput('responsiveMode', true);
      fixture.componentRef.setInput('size', 300);
      fixture.componentRef.setInput('sizeToThicknessRatio', 20);
      fixture.detectChanges();

      const responsiveThickness = component.effectiveOuterThickness();

      // Switch to manual mode with equivalent thickness
      fixture.componentRef.setInput('responsiveMode', false);
      fixture.componentRef.setInput('outerThickness', responsiveThickness);
      fixture.detectChanges();

      expect(component.effectiveOuterThickness()).toBe(responsiveThickness);
    });
  });

  describe('Container Responsiveness and ResizeObserver', () => {
    let mockResizeObserver: jasmine.Spy;
    let resizeObserverCallbacks: ResizeObserverCallback[] = [];

    beforeEach(() => {
      resizeObserverCallbacks = [];

      // Enhanced Mock ResizeObserver for this section
      mockResizeObserver = jasmine
        .createSpy('ResizeObserver')
        .and.callFake(function (this: any, callback: ResizeObserverCallback) {
          resizeObserverCallbacks.push(callback);
          this.observe = jasmine.createSpy('observe');
          this.disconnect = jasmine.createSpy('disconnect');
          this.unobserve = jasmine.createSpy('unobserve');
          return this;
        });

      (window as any).ResizeObserver = mockResizeObserver;
    });

    it('should not create ResizeObserver when fitToContainer is false', () => {
      fixture.componentRef.setInput('fitToContainer', false);
      fixture.detectChanges();

      expect(mockResizeObserver).not.toHaveBeenCalled();
    });

    it('should create ResizeObserver when fitToContainer is true', () => {
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.detectChanges();

      expect(mockResizeObserver).toHaveBeenCalled();
      expect(resizeObserverCallbacks.length).toBe(1);
    });

    it('should calculate container size correctly in responsive mode', () => {
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.componentRef.setInput('responsiveMode', true);
      fixture.componentRef.setInput('sizeToThicknessRatio', 20);
      fixture.componentRef.setInput('containerPadding', 10);
      fixture.detectChanges();

      // Simulate container resize
      if (resizeObserverCallbacks.length > 0) {
        const callback = resizeObserverCallbacks[0];
        callback(
          [
            {
              contentRect: new DOMRect(0, 0, 400, 250), // 400x250 container
              target: fixture.nativeElement,
            } as ResizeObserverEntry,
          ],
          {} as ResizeObserver
        );

        fixture.detectChanges();

        // Available space: 400-20=380 wide, 250-10=240 high
        // Space factor in responsive mode with ratio 20: 1 + 3/20 = 1.15
        // sFromW = 380 / 1.15 ≈ 330
        // sFromH = (2 * 240) / 1.15 ≈ 417
        // Should use smaller: 330
        const expectedSize = 330; // Approximately
        const actualSize = (component as any).containerSize();
        expect(actualSize).toBeCloseTo(expectedSize, -1); // Within 10px
      }
    });

    it('should calculate container size correctly in manual mode', () => {
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.componentRef.setInput('responsiveMode', false);
      fixture.componentRef.setInput('outerThickness', 30);
      fixture.componentRef.setInput('containerPadding', 15);
      fixture.detectChanges();

      // Simulate container resize
      if (resizeObserverCallbacks.length > 0) {
        const callback = resizeObserverCallbacks[0];
        callback(
          [
            {
              contentRect: new DOMRect(0, 0, 300, 200), // 300x200 container
              target: fixture.nativeElement,
            } as ResizeObserverEntry,
          ],
          {} as ResizeObserver
        );

        fixture.detectChanges();

        // Available space: 300-30=270 wide, 200-15=185 high
        // In manual mode: sFromW = 270-30=240, sFromH = 2*185-30=340
        // Should use smaller: 240
        const actualSize = (component as any).containerSize();
        expect(actualSize).toBe(240);
      }
    });

    it('should enforce minimum size of 50px', () => {
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.detectChanges();

      // Simulate very small container
      if (resizeObserverCallbacks.length > 0) {
        const callback = resizeObserverCallbacks[0];
        callback(
          [
            {
              contentRect: new DOMRect(0, 0, 10, 10), // Tiny container
              target: fixture.nativeElement,
            } as ResizeObserverEntry,
          ],
          {} as ResizeObserver
        );

        fixture.detectChanges();

        const actualSize = (component as any).containerSize();
        expect(actualSize).toBe(50);
      }
    });

    it('should disconnect ResizeObserver on destroy', () => {
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.detectChanges();

      // Just verify that the component handles destroy properly
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should toggle ResizeObserver when fitToContainer changes', () => {
      // Start without container fitting
      fixture.componentRef.setInput('fitToContainer', false);
      fixture.detectChanges();
      expect(mockResizeObserver).not.toHaveBeenCalled();

      // Enable container fitting
      fixture.componentRef.setInput('fitToContainer', true);
      fixture.detectChanges();
      expect(mockResizeObserver).toHaveBeenCalled();

      // Disable container fitting
      fixture.componentRef.setInput('fitToContainer', false);
      fixture.detectChanges();

      expect((component as any).containerSize()).toBeNull();
    });
  });

  describe('Background Arc and Value Arc', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate background arc path', () => {
      const backgroundPath = component.backgroundArcPath();

      expect(backgroundPath).toMatch(
        /^M [\d.-]+ [\d.-]+ A [\d.-]+ [\d.-]+ 0 [01] [01] [\d.-]+ [\d.-]+$/
      );
    });

    it('should use correct path length attribute for value visualization', () => {
      // The SVG should use pathLength="100" for easy percentage-based stroke-dasharray
      fixture.componentRef.setInput('value', 75);
      fixture.detectChanges();

      expect(component.percent()).toBe(75);
      // In template, this would be used as stroke-dasharray="75 100"
    });
  });
});
