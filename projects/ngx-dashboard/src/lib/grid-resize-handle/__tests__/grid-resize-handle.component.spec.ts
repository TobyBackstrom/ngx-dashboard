import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  GridResizeAxis,
  GridResizeDelta,
  GridResizeHandleComponent,
} from '../grid-resize-handle.component';

describe('GridResizeHandleComponent', () => {
  let fixture: ComponentFixture<GridResizeHandleComponent>;
  let host: HTMLElement;
  let lastDelta: GridResizeDelta | undefined;
  let moveDeltas: GridResizeDelta[];
  let endCount: number;

  function setup(axis: GridResizeAxis, cellWidth = 50, cellHeight = 40): void {
    fixture = TestBed.createComponent(GridResizeHandleComponent);
    fixture.componentRef.setInput('axis', axis);
    fixture.componentRef.setInput('cellWidth', cellWidth);
    fixture.componentRef.setInput('cellHeight', cellHeight);

    lastDelta = undefined;
    moveDeltas = [];
    endCount = 0;
    fixture.componentInstance.resizeMove.subscribe((d) => moveDeltas.push(d));
    fixture.componentInstance.resizeEnd.subscribe((d) => {
      lastDelta = d;
      endCount++;
    });

    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  function pointerDown(x: number, y: number): void {
    host.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: x,
        clientY: y,
        pointerId: 1,
        bubbles: true,
      })
    );
  }
  function pointerMove(x: number, y: number): void {
    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: x, clientY: y, pointerId: 1 })
    );
  }
  function pointerUp(): void {
    document.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
  }
  function drag(fromX: number, fromY: number, toX: number, toY: number): void {
    pointerDown(fromX, fromY);
    pointerMove(toX, toY);
    pointerUp();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GridResizeHandleComponent],
    });
  });

  afterEach(() => fixture?.destroy());

  it('horizontal handle reports a column delta and zero rows', () => {
    setup('horizontal', 50, 40);
    // +120px x => round(120/50)=2 columns; vertical movement ignored.
    drag(100, 100, 220, 300);
    expect(lastDelta).toEqual({ deltaColumns: 2, deltaRows: 0 });
  });

  it('vertical handle reports a row delta and zero columns', () => {
    setup('vertical', 50, 40);
    // +120px y => round(120/40)=3 rows; horizontal movement ignored.
    drag(100, 100, 400, 220);
    expect(lastDelta).toEqual({ deltaColumns: 0, deltaRows: 3 });
  });

  it('corner handle reports both axes, including negative (shrink) deltas', () => {
    setup('both', 50, 40);
    // dx=+160 => round(3.2)=3 cols; dy=-80 => round(-2)= -2 rows.
    drag(200, 200, 360, 120);
    expect(lastDelta).toEqual({ deltaColumns: 3, deltaRows: -2 });
  });

  it('rounds half-cell drags symmetrically inward and outward', () => {
    // Outward half-cell => +1.
    setup('horizontal', 50, 40);
    drag(100, 100, 125, 100);
    expect(lastDelta).toEqual({ deltaColumns: 1, deltaRows: 0 });

    // Inward half-cell => -1 (plain Math.round(-0.5) would give 0).
    setup('horizontal', 50, 40);
    drag(100, 100, 75, 100);
    expect(lastDelta).toEqual({ deltaColumns: -1, deltaRows: 0 });
  });

  it('uses the cell size captured at gesture start, not the live (shrinking) size', () => {
    setup('horizontal', 50, 40);
    pointerDown(100, 100);

    // The editor's live reflow shrinks the cell size mid-drag...
    fixture.componentRef.setInput('cellWidth', 25);
    fixture.detectChanges();

    // ...but the divisor stays the 50px snapshot => 100/50 = 2, not 100/25 = 4.
    pointerMove(200, 100);
    expect(moveDeltas.at(-1)).toEqual({ deltaColumns: 2, deltaRows: 0 });

    pointerUp();
  });

  it('emits resizeMove only when the rounded track delta changes', () => {
    setup('horizontal', 50, 40);
    pointerDown(100, 100);

    pointerMove(120, 100); // +20px => round(0.4)=0, no change from start
    expect(moveDeltas.length).toBe(0);

    pointerMove(180, 100); // +80px => round(1.6)=2 columns
    pointerMove(185, 100); // +85px => round(1.7)=2 columns, unchanged
    expect(moveDeltas).toEqual([{ deltaColumns: 2, deltaRows: 0 }]);

    pointerMove(230, 100); // +130px => round(2.6)=3 columns
    expect(moveDeltas).toEqual([
      { deltaColumns: 2, deltaRows: 0 },
      { deltaColumns: 3, deltaRows: 0 },
    ]);

    pointerUp();
  });

  it('emits a zero delta when the pointer does not move (no-op click)', () => {
    setup('both', 50, 40);
    drag(100, 100, 100, 100);
    expect(lastDelta).toEqual({ deltaColumns: 0, deltaRows: 0 });
  });

  it('reports zero when the cell footprint is unknown (0px)', () => {
    setup('horizontal', 0, 0);
    drag(100, 100, 400, 400);
    expect(lastDelta).toEqual({ deltaColumns: 0, deltaRows: 0 });
  });

  it('aborts with a zero delta (no commit) on pointercancel', () => {
    setup('both', 50, 40);
    pointerDown(200, 200);
    pointerMove(360, 120); // would commit {3, -2} on a normal release
    expect(moveDeltas.length).toBeGreaterThan(0);

    document.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));

    expect(lastDelta).toEqual({ deltaColumns: 0, deltaRows: 0 });
    expect(endCount).toBe(1);
  });

  it('aborts with a zero delta on window blur (pointer up lost outside window)', () => {
    setup('both', 50, 40);
    pointerDown(200, 200);
    pointerMove(360, 120);

    window.dispatchEvent(new Event('blur'));

    expect(lastDelta).toEqual({ deltaColumns: 0, deltaRows: 0 });
    expect(endCount).toBe(1);
  });

  it('removes document listeners after the gesture ends', () => {
    setup('horizontal', 50, 40);
    drag(100, 100, 200, 100);
    expect(endCount).toBe(1);

    // A stray move/up after release must not produce another commit.
    pointerMove(999, 999);
    pointerUp();
    expect(endCount).toBe(1);
  });

  it('toggles the is-active host class for the duration of the drag', () => {
    setup('vertical', 50, 40);
    pointerDown(100, 100);
    fixture.detectChanges();
    expect(host.classList).toContain('is-active');

    pointerUp();
    fixture.detectChanges();
    expect(host.classList).not.toContain('is-active');
  });
});
