// grid-resize-handle.component.ts
//
// A small, self-contained drag handle for resizing the dashboard grid's
// row/column counts from the editor. It mirrors the cell resize gesture
// (mousedown -> document listeners via Renderer2 -> delta in track counts)
// but reports a whole-grid delta rather than a per-widget span change.
//
// The handle is intentionally store-agnostic: it converts pointer movement
// into track-count deltas using the cell footprint passed in, and emits them.
// The editor owns the actual grid mutation (clamp-to-content lives there).

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
    '(mousedown)': 'onResizeStart($event)',
  },
})
export class GridResizeHandleComponent {
  axis = input.required<GridResizeAxis>();

  /** Current grid cell footprint in px; converts pointer delta to track counts. */
  cellWidth = input.required<number>();
  cellHeight = input.required<number>();

  resizeMove = output<GridResizeDelta>();
  resizeEnd = output<GridResizeDelta>();

  readonly #renderer = inject(Renderer2);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly isActive = signal(false);

  #startX = 0;
  #startY = 0;
  #delta: GridResizeDelta = { deltaColumns: 0, deltaRows: 0 };
  #cleanup?: () => void;

  constructor() {
    // Defensive: drop document listeners if the handle is torn down mid-drag.
    this.#destroyRef.onDestroy(() => this.#stop());
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.#startX = event.clientX;
    this.#startY = event.clientY;
    this.#delta = { deltaColumns: 0, deltaRows: 0 };
    this.isActive.set(true);

    // Document-level listeners only exist while actively dragging this handle.
    const unlistenMove = this.#renderer.listen(
      'document',
      'mousemove',
      this.#onMove
    );
    const unlistenUp = this.#renderer.listen('document', 'mouseup', this.#onUp);
    this.#cleanup = () => {
      unlistenMove();
      unlistenUp();
    };

    this.#renderer.addClass(document.body, this.#cursorClass());
  }

  // Arrow fields keep `this` bound when used as Renderer2 listener callbacks.
  readonly #onMove = (event: MouseEvent): void => {
    const axis = this.axis();
    const width = this.cellWidth();
    const height = this.cellHeight();

    const next: GridResizeDelta = {
      deltaColumns:
        axis !== 'vertical' && width > 0
          ? Math.round((event.clientX - this.#startX) / width)
          : 0,
      deltaRows:
        axis !== 'horizontal' && height > 0
          ? Math.round((event.clientY - this.#startY) / height)
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

  readonly #onUp = (): void => {
    const delta = this.#delta;
    this.#stop();
    this.resizeEnd.emit(delta);
  };

  #stop(): void {
    this.isActive.set(false);
    this.#renderer.removeClass(document.body, this.#cursorClass());
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
