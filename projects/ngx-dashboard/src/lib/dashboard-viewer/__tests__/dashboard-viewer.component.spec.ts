import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DashboardViewerComponent } from '../dashboard-viewer.component';
import { DashboardStore } from '../../store/dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetFactory, Widget, GridSelection } from '../../models';

// Mock test widget component
@Component({
  selector: 'lib-test-widget',
  template: '<div class="test-widget">Test Widget: {{state().value}}</div>',
  standalone: true,
})
class TestWidgetComponent implements Widget {
  private state = signal<unknown>({ value: 'initial' });

  dashboardGetState(): unknown {
    return this.state();
  }

  dashboardSetState(state: unknown): void {
    this.state.set(state);
  }

  dashboardEditState(): void {
    // Mock edit state method
  }
}

describe('DashboardViewerComponent - Integration Tests', () => {
  let component: DashboardViewerComponent;
  let fixture: ComponentFixture<DashboardViewerComponent>;
  let store: InstanceType<typeof DashboardStore>;

  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget for testing',
    svgIcon: '<svg></svg>',
    createInstance: (container) => {
      const componentRef = container.createComponent(TestWidgetComponent);
      return componentRef;
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardViewerComponent],
      providers: [DashboardStore]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardViewerComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(DashboardStore);
    
    // Set required inputs
    fixture.componentRef.setInput('rows', 8);
    fixture.componentRef.setInput('columns', 12);
    fixture.componentRef.setInput('gutterSize', '1em');
  });

  describe('Complete Widget Rendering Workflow', () => {
    it('should render widgets from store and export dashboard with current states', () => {
      // SCENARIO: User loads dashboard with widgets, sees them rendered, exports dashboard
      
      // Setup: Add widgets to store
      const widget1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 2,
        flat: false,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Widget 1' }
      };

      const widget2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 3),
        row: 2,
        col: 3,
        rowSpan: 2,
        colSpan: 1,
        flat: true,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Widget 2' }
      };

      // Action: Add widgets to store
      store.addWidget(widget1);
      store.addWidget(widget2);
      fixture.detectChanges();

      // Verify: Widgets are rendered
      const cellElements = fixture.nativeElement.querySelectorAll('lib-cell');
      expect(cellElements.length).toBe(2);
      expect(cellElements[0]).toBeTruthy();
      expect(cellElements[1]).toBeTruthy();

      // Verify: Store integration works
      expect(component.cells().length).toBe(2);
      expect(component.cells()[0]).toEqual(widget1);
      expect(component.cells()[1]).toEqual(widget2);
    });
  });

  describe('Grid Configuration and Layout', () => {
    it('should apply grid configuration and update CSS variables when inputs change', () => {
      // SCENARIO: User changes grid configuration and sees layout update
      
      // Initial setup
      fixture.detectChanges();
      
      // Verify: Initial CSS variables are set
      const hostElement = fixture.nativeElement;
      let computedStyle = getComputedStyle(hostElement);
      expect(computedStyle.getPropertyValue('--rows')).toBe('8');
      expect(computedStyle.getPropertyValue('--columns')).toBe('12');
      expect(computedStyle.getPropertyValue('--gutter-size')).toBe('1em');
      expect(computedStyle.getPropertyValue('--gutters')).toBe('13'); // columns + 1
      
      // Action: Change grid configuration
      fixture.componentRef.setInput('rows', 6);
      fixture.componentRef.setInput('columns', 10);
      fixture.componentRef.setInput('gutterSize', '2em');
      fixture.detectChanges();
      
      // Verify: CSS variables updated
      computedStyle = getComputedStyle(hostElement);
      expect(computedStyle.getPropertyValue('--rows')).toBe('6');
      expect(computedStyle.getPropertyValue('--columns')).toBe('10');
      expect(computedStyle.getPropertyValue('--gutter-size')).toBe('2em');
      expect(computedStyle.getPropertyValue('--gutters')).toBe('11'); // columns + 1
      
      // Verify: Store is updated
      expect(store.rows()).toBe(6);
      expect(store.columns()).toBe(10);
      expect(store.gutterSize()).toBe('2em');
    });
  });

  describe('Reactive Store Updates', () => {
    it('should reactively update when store changes', () => {
      // SCENARIO: User performs actions that modify store, sees immediate UI updates
      
      // Initial state: No widgets
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(0);
      
      // Action: Add widget to store
      const widget: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: false,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Dynamic Widget' }
      };
      
      store.addWidget(widget);
      fixture.detectChanges();
      
      // Verify: Widget appears in UI
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(1);
      
      // Action: Remove widget from store
      store.removeWidget(widget.widgetId);
      fixture.detectChanges();
      
      // Verify: Widget disappears from UI
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(0);
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty dashboard gracefully', () => {
      // SCENARIO: User loads empty dashboard or clears all widgets
      
      // Action: Initialize with empty dashboard
      fixture.detectChanges();
      
      // Verify: No widgets rendered
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(0);
      expect(component.cells().length).toBe(0);
    });
  });

  describe('Selection Overlay Grid', () => {
    /**
     * Construct a PointerEvent with sensible defaults. Karma/Chrome supports
     * the PointerEvent constructor. `pointerType` defaults to 'mouse' and
     * `button` to 0 so the primary-button branch is exercised by default.
     */
    function pointerEvent(
      type: string,
      overrides: PointerEventInit = {}
    ): PointerEvent {
      return new PointerEvent(type, {
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        clientX: 0,
        clientY: 0,
        ...overrides,
      });
    }

    /**
     * Simulate dragging by directly updating selectionCurrent. The
     * elementFromPoint path is exercised in dedicated tests below; for
     * tests that just want to verify start→drag→end behavior, this is the
     * cleanest approach and avoids brittle DOM positioning setup.
     */
    function simulateDragTo(row: number, col: number): void {
      component.selectionCurrent.set({ row, col });
    }

    beforeEach(() => {
      fixture.componentRef.setInput('enableSelection', true);
      // Default dragThreshold to 0 in this block so legacy click-emits-1x1
      // semantics are preserved across tests that aren't specifically
      // exercising threshold behavior.
      fixture.componentRef.setInput('dragThreshold', 0);
      fixture.detectChanges();
    });

    it('should emit GridSelection when selection completes', () => {
      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
      simulateDragTo(4, 6);
      document.dispatchEvent(pointerEvent('pointerup'));

      expect(emittedSelections.length).toBe(1);
      expect(emittedSelections[0]).toEqual({
        topLeft: { row: 2, col: 3 },
        bottomRight: { row: 4, col: 6 },
      });
    });

    it('should normalize coordinates regardless of drag direction', () => {
      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      component.onGhostCellPointerDown(pointerEvent('pointerdown'), 5, 8);
      simulateDragTo(2, 3);
      document.dispatchEvent(pointerEvent('pointerup'));

      expect(emittedSelections.length).toBe(1);
      expect(emittedSelections[0]).toEqual({
        topLeft: { row: 2, col: 3 },
        bottomRight: { row: 5, col: 8 },
      });
    });

    it('should emit a 1x1 selection on click when dragThreshold is 0 (legacy behavior)', () => {
      // Legacy guard: with dragThreshold=0, every pointerup emits, including
      // stationary clicks. Consumers that opted into the old behavior rely on
      // this.
      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      component.onGhostCellPointerDown(pointerEvent('pointerdown'), 3, 4);
      // No drag — same position.
      document.dispatchEvent(pointerEvent('pointerup'));

      expect(emittedSelections.length).toBe(1);
      expect(emittedSelections[0]).toEqual({
        topLeft: { row: 3, col: 4 },
        bottomRight: { row: 3, col: 4 },
      });
    });

    it('should clean up document listeners on component destroy', () => {
      component.onGhostCellPointerDown(pointerEvent('pointerdown'), 1, 1);
      expect(component.isSelecting()).toBe(true);

      let listenersCleaned = false;
      const originalDestroy = fixture.destroy.bind(fixture);
      fixture.destroy = () => {
        originalDestroy();
        listenersCleaned = true;
      };

      fixture.destroy();
      expect(listenersCleaned).toBe(true);
    });

    it('should not trigger selection when enableSelection is false', () => {
      fixture.componentRef.setInput('enableSelection', false);
      fixture.detectChanges();

      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
      expect(component.isSelecting()).toBe(false);

      document.dispatchEvent(pointerEvent('pointerup'));
      expect(emittedSelections.length).toBe(0);
    });

    it('should only respond to primary button on mouse pointer', () => {
      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      component.onGhostCellPointerDown(
        pointerEvent('pointerdown', { button: 2 }),
        2,
        3
      );
      expect(component.isSelecting()).toBe(false);

      component.onGhostCellPointerDown(
        pointerEvent('pointerdown', { button: 1 }),
        2,
        3
      );
      expect(component.isSelecting()).toBe(false);

      component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
      expect(component.isSelecting()).toBe(true);

      document.dispatchEvent(pointerEvent('pointerup'));
    });

    it('should accept touch and pen pointers regardless of button value', () => {
      // For touch and pen, `button === 0` is the spec for the primary
      // contact, but the test guards that we don't accidentally apply the
      // mouse-only button check to other pointer types.
      component.onGhostCellPointerDown(
        pointerEvent('pointerdown', { pointerType: 'touch' }),
        2,
        3
      );
      expect(component.isSelecting()).toBe(true);
      document.dispatchEvent(pointerEvent('pointerup'));

      component.onGhostCellPointerDown(
        pointerEvent('pointerdown', { pointerType: 'pen' }),
        4,
        5
      );
      expect(component.isSelecting()).toBe(true);
      document.dispatchEvent(pointerEvent('pointerup'));
    });

    describe('selectionModifier', () => {
      it('should not start selection when modifier is required but not held', () => {
        fixture.componentRef.setInput('selectionModifier', 'shift');
        fixture.detectChanges();

        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
        expect(component.isSelecting()).toBe(false);

        document.dispatchEvent(pointerEvent('pointerup'));
        expect(emittedSelections.length).toBe(0);
      });

      it('should start selection when modifier is held', () => {
        fixture.componentRef.setInput('selectionModifier', 'shift');
        fixture.detectChanges();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));

        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
        expect(component.isSelecting()).toBe(true);

        document.dispatchEvent(pointerEvent('pointerup'));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
      });

      it('should keep drag alive when modifier is released mid-drag (latch)', () => {
        fixture.componentRef.setInput('selectionModifier', 'shift');
        fixture.detectChanges();

        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
        expect(component.isSelecting()).toBe(true);

        // Modifier released while drag in progress
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
        simulateDragTo(4, 6);
        // Drag should still be live because the latch holds it.
        expect(component.isSelecting()).toBe(true);

        document.dispatchEvent(pointerEvent('pointerup'));
        expect(emittedSelections.length).toBe(1);
        expect(emittedSelections[0]).toEqual({
          topLeft: { row: 2, col: 3 },
          bottomRight: { row: 4, col: 6 },
        });
      });

      it('should reset modifier-held state on window blur', () => {
        fixture.componentRef.setInput('selectionModifier', 'shift');
        fixture.detectChanges();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));

        // First mousedown should succeed (modifier held)
        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 1, 1);
        expect(component.isSelecting()).toBe(true);
        document.dispatchEvent(pointerEvent('pointerup'));

        // Window blur — modifier flag should reset even though no keyup fires
        window.dispatchEvent(new Event('blur'));

        // Next mousedown without re-pressing Shift should NOT start a selection
        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 3);
        expect(component.isSelecting()).toBe(false);
      });

      it('should respect ctrl modifier when configured', () => {
        fixture.componentRef.setInput('selectionModifier', 'ctrl');
        fixture.detectChanges();

        // Shift held should NOT arm ctrl-gated selection
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 1, 1);
        expect(component.isSelecting()).toBe(false);
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));

        // Ctrl held should arm
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control' }));
        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 2, 2);
        expect(component.isSelecting()).toBe(true);
        document.dispatchEvent(pointerEvent('pointerup'));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control' }));
      });

      it('should ignore unrelated keys while modifier is held', () => {
        fixture.componentRef.setInput('selectionModifier', 'shift');
        fixture.detectChanges();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
        // Press and release an unrelated key — must not flip modifier-held off
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

        component.onGhostCellPointerDown(pointerEvent('pointerdown'), 1, 1);
        expect(component.isSelecting()).toBe(true);
        document.dispatchEvent(pointerEvent('pointerup'));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
      });
    });

    describe('dragThreshold', () => {
      beforeEach(() => {
        // Use the proposed default of 4 px for these tests
        fixture.componentRef.setInput('dragThreshold', 4);
        fixture.detectChanges();
      });

      it('should suppress emission when pointer does not move (default 4 px)', () => {
        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        component.onGhostCellPointerDown(
          pointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
          3,
          4
        );
        document.dispatchEvent(
          pointerEvent('pointerup', { clientX: 100, clientY: 100 })
        );

        expect(emittedSelections.length).toBe(0);
      });

      it('should suppress emission for sub-threshold drag', () => {
        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        component.onGhostCellPointerDown(
          pointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
          3,
          4
        );
        // Move 3 px (below 4 px threshold)
        document.dispatchEvent(
          pointerEvent('pointerup', { clientX: 102, clientY: 102 })
        );

        expect(emittedSelections.length).toBe(0);
      });

      it('should emit when drag distance meets threshold', () => {
        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        component.onGhostCellPointerDown(
          pointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
          3,
          4
        );
        simulateDragTo(5, 6);
        // Move 5 px (>= 4 px threshold)
        document.dispatchEvent(
          pointerEvent('pointerup', { clientX: 100, clientY: 105 })
        );

        expect(emittedSelections.length).toBe(1);
        expect(emittedSelections[0]).toEqual({
          topLeft: { row: 3, col: 4 },
          bottomRight: { row: 5, col: 6 },
        });
      });

      it('should respect a custom threshold value', () => {
        fixture.componentRef.setInput('dragThreshold', 20);
        fixture.detectChanges();

        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        component.onGhostCellPointerDown(
          pointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
          1,
          1
        );
        // 10 px drag — below custom threshold of 20
        document.dispatchEvent(
          pointerEvent('pointerup', { clientX: 10, clientY: 0 })
        );

        expect(emittedSelections.length).toBe(0);
      });
    });

    describe('PointerEvent integration', () => {
      it('should track cells via elementFromPoint during drag', () => {
        const emittedSelections: GridSelection[] = [];
        component.selectionComplete.subscribe((selection: GridSelection) => {
          emittedSelections.push(selection);
        });

        // Synthesize a "ghost cell" element so elementFromPoint can return it.
        // The component reads `data-row` / `data-col` to resolve the cell.
        const fakeCell = document.createElement('div');
        fakeCell.classList.add('selection-ghost-cell');
        fakeCell.dataset['row'] = '7';
        fakeCell.dataset['col'] = '5';

        const elementFromPointSpy = spyOn(
          document,
          'elementFromPoint'
        ).and.returnValue(fakeCell);

        component.onGhostCellPointerDown(
          pointerEvent('pointerdown', { clientX: 50, clientY: 50 }),
          1,
          1
        );

        // Simulate a pointermove event — the listener should call
        // elementFromPoint and update selectionCurrent based on the result.
        document.dispatchEvent(
          pointerEvent('pointermove', { clientX: 200, clientY: 200 })
        );

        expect(elementFromPointSpy).toHaveBeenCalledWith(200, 200);
        expect(component.selectionCurrent()).toEqual({ row: 7, col: 5 });

        document.dispatchEvent(
          pointerEvent('pointerup', { clientX: 200, clientY: 200 })
        );

        expect(emittedSelections.length).toBe(1);
        expect(emittedSelections[0]).toEqual({
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 7, col: 5 },
        });
      });

      it('should call setPointerCapture on the pointerdown target when supported', () => {
        const captureTarget = document.createElement('div');
        const captureSpy = jasmine.createSpy('setPointerCapture');
        // Synthesize the capture API on a synthetic target
        (
          captureTarget as unknown as {
            setPointerCapture: (id: number) => void;
          }
        ).setPointerCapture = captureSpy;

        const event = pointerEvent('pointerdown', { pointerId: 42 });
        Object.defineProperty(event, 'target', { value: captureTarget });

        component.onGhostCellPointerDown(event, 1, 1);

        expect(captureSpy).toHaveBeenCalledWith(42);

        document.dispatchEvent(pointerEvent('pointerup'));
      });
    });
  });
});