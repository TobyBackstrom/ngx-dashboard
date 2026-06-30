// grid-resize-handle.component.ts
//
// A small, self-contained drag handle for resizing the dashboard grid's
// row/column counts from the editor. Uses PointerEvents (with pointer capture)
// so mouse, touch and pen all work uniformly, and reports a whole-grid delta
// in track counts rather than a per-widget span change.
//
// The handle is intentionally store-agnostic: it converts pointer movement
// into track-count deltas using the cell footprint passed in, and emits them.
// The editor owns the actual grid mutation (clamp-to-content lives there).

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  signal,
} from '@angular/core';

/** Which axis (or both, for the corner handle) the handle resizes. */
export type GridResizeAxis = 'horizontal' | 'vertical' | 'both';

/** Track-count delta produced by a handle drag. Zero on the inactive axis. */
export interface GridResizeDelta {
  deltaColumns: number;
  deltaRows: number;
}

/**
 * Round half away from zero so inward and outward half-cell drags behave
 * symmetrically. `Math.round` rounds 0.5 to 1 but -0.5 to 0, which makes a
 * half-cell shrink "stick" while a half-cell grow responds.
 */
function symmetricRound(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

@Component({
  selector: 'lib-grid-resize-handle',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grid-resize-handle.component.html',
  styleUrl: './grid-resize-handle.component.scss',
  host: {
    '[class]': "'axis-' + axis()",
    '[class.is-active]': 'isActive()',
    '(pointerdown)': 'onResizeStart($event)',
  },
})
export class GridResizeHandleComponent {
  axis = input.required<GridResizeAxis>();

  /** Current grid cell footprint in px; converts pointer delta to track counts. */
  cellWidth = input.required<number>();
  cellHeight = input.required<number>();

  resizeMove = output<GridResizeDelta>();
  resizeEnd = output<GridResizeDelta>();

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #renderer = inject(Renderer2);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly isActive = signal(false);

  #startX = 0;
  #startY = 0;
  // Cell footprint snapshot taken at gesture start. Reading the live signal
  // would feed back on itself: the editor's live preview shrinks cells as
  // columns are added, which would shrink this px->track divisor mid-drag and
  // make the grid overshoot.
  #cellWidth = 0;
  #cellHeight = 0;
  #pointerId: number | null = null;
  #delta: GridResizeDelta = { deltaColumns: 0, deltaRows: 0 };
  #cleanup?: () => void;

  constructor() {
    // Defensive: drop listeners / capture if the handle is torn down mid-drag.
    this.#destroyRef.onDestroy(() => this.#stop());
  }

  onResizeStart(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.#startX = event.clientX;
    this.#startY = event.clientY;
    this.#cellWidth = this.cellWidth();
    this.#cellHeight = this.cellHeight();
    this.#delta = { deltaColumns: 0, deltaRows: 0 };
    this.isActive.set(true);

    // Capture so the gesture keeps receiving events even if the pointer leaves
    // the thin handle strip. try/catch tolerates environments without capture
    // support (TypeError) and synthetic test events with no active pointer.
    try {
      this.#host.nativeElement.setPointerCapture(event.pointerId);
      this.#pointerId = event.pointerId;
    } catch {
      // No capture; the document listeners still drive the gesture.
    }

    // Document/window listeners only exist while actively dragging this handle.
    const unlistenMove = this.#renderer.listen(
      'document',
      'pointermove',
      this.#onMove
    );
    const unlistenUp = this.#renderer.listen(
      'document',
      'pointerup',
      this.#onUp
    );
    const unlistenCancel = this.#renderer.listen(
      'document',
      'pointercancel',
      this.#onAbort
    );
    // A pointerup that lands outside the window never fires; window blur is the
    // backstop that aborts a gesture the browser has otherwise abandoned.
    const unlistenBlur = this.#renderer.listen('window', 'blur', this.#onAbort);
    this.#cleanup = () => {
      unlistenMove();
      unlistenUp();
      unlistenCancel();
      unlistenBlur();
    };

    this.#renderer.addClass(document.body, this.#cursorClass());
  }

  // Arrow fields keep `this` bound when used as Renderer2 listener callbacks.
  readonly #onMove = (event: PointerEvent): void => {
    const axis = this.axis();

    const next: GridResizeDelta = {
      deltaColumns:
        axis !== 'vertical' && this.#cellWidth > 0
          ? symmetricRound((event.clientX - this.#startX) / this.#cellWidth)
          : 0,
      deltaRows:
        axis !== 'horizontal' && this.#cellHeight > 0
          ? symmetricRound((event.clientY - this.#startY) / this.#cellHeight)
          : 0,
    };

    // Only emit when the rounded track delta actually changes, so sub-cell
    // pointer movement doesn't spam the live preview.
    if (
      next.deltaColumns === this.#delta.deltaColumns &&
      next.deltaRows === this.#delta.deltaRows
    ) {
      return;
    }

    this.#delta = next;
    this.resizeMove.emit(next);
  };

  readonly #onUp = (): void => this.#finish(this.#delta);

  // Abort (pointercancel / window blur): discard the in-progress delta so the
  // editor clears the preview without committing a half-finished gesture.
  readonly #onAbort = (): void =>
    this.#finish({ deltaColumns: 0, deltaRows: 0 });

  #finish(delta: GridResizeDelta): void {
    if (!this.isActive()) return;
    this.#stop();
    this.resizeEnd.emit(delta);
  }

  #stop(): void {
    this.isActive.set(false);
    this.#renderer.removeClass(document.body, this.#cursorClass());

    if (this.#pointerId !== null) {
      try {
        this.#host.nativeElement.releasePointerCapture(this.#pointerId);
      } catch {
        // Capture may already be gone (e.g. pointercancel released it).
      }
    }
    this.#pointerId = null;

    this.#cleanup?.();
    this.#cleanup = undefined;
  }

  #cursorClass(): string {
    switch (this.axis()) {
      case 'horizontal':
        return 'cursor-col-resize';
      case 'vertical':
        return 'cursor-row-resize';
      default:
        return 'cursor-nwse-resize';
    }
  }
}
