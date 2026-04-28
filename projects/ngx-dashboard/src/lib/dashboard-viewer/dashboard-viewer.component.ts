import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  viewChildren,
  viewChild,
  ChangeDetectionStrategy,
  signal,
  ElementRef,
  Renderer2,
  DestroyRef,
} from '@angular/core';

import { CellComponent } from '../cell/cell.component';
import { DashboardStore } from '../store/dashboard-store';
import { GridSelection } from '../models/grid-selection';
import { SelectionModifier } from '../models/selection-modifier';

/**
 * Map SelectionModifier values to KeyboardEvent.key values. Compared against
 * `event.key` directly (rather than the boolean `*Key` flags) so unrelated
 * keypresses while a modifier is held don't flip the modifier-held state.
 */
const MODIFIER_KEY: Record<SelectionModifier, string> = {
  shift: 'Shift',
  ctrl: 'Control',
  alt: 'Alt',
  meta: 'Meta',
};

@Component({
  selector: 'ngx-dashboard-viewer',
  standalone: true,
  imports: [CellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-viewer.component.html',
  styleUrl: './dashboard-viewer.component.scss',
  host: {
    '[style.--rows]': 'rows()',
    '[style.--columns]': 'columns()',
    '[style.--gutter-size]': 'gutterSize()',
    '[style.--gutters]': 'gutters()',
  },
})
export class DashboardViewerComponent {
  #store = inject(DashboardStore);
  #renderer = inject(Renderer2);
  #destroyRef = inject(DestroyRef);

  cellComponents = viewChildren(CellComponent);
  gridElement = viewChild<ElementRef>('gridElement');

  rows = input.required<number>();
  columns = input.required<number>();
  gutterSize = input<string>('1em');
  gutters = computed(() => this.columns() + 1);

  // Selection feature
  enableSelection = input<boolean>(false);
  selectionModifier = input<SelectionModifier | null>(null);
  /**
   * Minimum pointer movement (in CSS pixels) between pointerdown and
   * pointerup required to emit `selectionComplete`. Below the threshold,
   * the gesture is treated as a click and no event is emitted.
   *
   * Default 4 — matches OS-native click-vs-drag thresholds. Set to 0 to
   * preserve the legacy behavior where every pointerup emits.
   */
  dragThreshold = input<number>(4);
  selectionComplete = output<GridSelection>();

  // store signals - read-only
  cells = this.#store.cells;

  // Selection state
  isSelecting = signal(false);
  selectionStart = signal<{ row: number; col: number } | null>(null);
  selectionCurrent = signal<{ row: number; col: number } | null>(null);

  // Modifier-key gating state for selectionModifier
  readonly #modifierHeld = signal(false);

  /**
   * Whether the selection overlay is currently interactive (intercepts
   * pointer events). Always false when `enableSelection` is false.
   * When `selectionModifier` is null, true whenever selection is enabled
   * (legacy behavior). Otherwise, true only while the configured modifier
   * is held or a drag is in progress (which keeps the overlay armed
   * across mid-drag modifier release).
   */
  protected readonly armed = computed(() => {
    if (!this.enableSelection()) return false;
    if (this.selectionModifier() === null) return true;
    return this.#modifierHeld() || this.isSelecting();
  });

  // Computed selection bounds (normalized)
  selectionBounds = computed(() => {
    const start = this.selectionStart();
    const current = this.selectionCurrent();
    if (!start || !current) return null;

    return {
      startRow: Math.min(start.row, current.row),
      endRow: Math.max(start.row, current.row),
      startCol: Math.min(start.col, current.col),
      endCol: Math.max(start.col, current.col),
    };
  });

  // Generate array for template iteration
  rowNumbers = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i + 1)
  );
  colNumbers = computed(() =>
    Array.from({ length: this.columns() }, (_, i) => i + 1)
  );

  // Document-level pointer listeners (cleanup needed)
  #pointerMoveListener?: () => void;
  #pointerUpListener?: () => void;

  // Pointer position at the start of a drag, for dragThreshold checks
  readonly #pointerDownPos = signal<{ x: number; y: number } | null>(null);

  constructor() {
    // Sync grid configuration with store when inputs change
    effect(() => {
      this.#store.setGridConfig({
        rows: this.rows(),
        columns: this.columns(),
        gutterSize: this.gutterSize(),
      });
    });

    // Clear selection when selection mode is disabled
    effect(() => {
      if (!this.enableSelection()) {
        this.clearSelection();
      }
    });

    // Modifier-key tracking. Only registers document/window listeners when a
    // modifier is configured, so dashboards using the default (null) pay no
    // global keystroke cost. Cleans up listeners and resets state on
    // modifier change or component teardown.
    effect((onCleanup) => {
      const modifier = this.selectionModifier();
      if (modifier === null) {
        this.#modifierHeld.set(false);
        return;
      }

      const keyName = MODIFIER_KEY[modifier];

      const offKeyDown = this.#renderer.listen(
        'document',
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === keyName) {
            this.#modifierHeld.set(true);
          }
        }
      );

      const offKeyUp = this.#renderer.listen(
        'document',
        'keyup',
        (event: KeyboardEvent) => {
          if (event.key === keyName) {
            this.#modifierHeld.set(false);
          }
        }
      );

      // Cover focus-loss cases where keyup may never fire (Alt-Tab, etc.)
      const offBlur = this.#renderer.listen('window', 'blur', () => {
        this.#modifierHeld.set(false);
      });

      onCleanup(() => {
        offKeyDown();
        offKeyUp();
        offBlur();
        this.#modifierHeld.set(false);
      });
    });
  }

  // Selection methods

  /**
   * Check if a cell is within the current selection bounds
   */
  isCellSelected(row: number, col: number): boolean {
    const bounds = this.selectionBounds();
    if (!bounds) return false;

    return (
      row >= bounds.startRow &&
      row <= bounds.endRow &&
      col >= bounds.startCol &&
      col <= bounds.endCol
    );
  }

  /**
   * Handle pointer down on a ghost cell to start a selection. Uses
   * PointerEvent so mouse / touch / pen all work uniformly.
   */
  onGhostCellPointerDown(event: PointerEvent, row: number, col: number) {
    if (!this.armed()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    this.isSelecting.set(true);
    this.selectionStart.set({ row, col });
    this.selectionCurrent.set({ row, col });
    this.#pointerDownPos.set({ x: event.clientX, y: event.clientY });

    const target = event.target;
    if (
      target instanceof Element &&
      typeof target.setPointerCapture === 'function'
    ) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Capture may be rejected for synthetic / invalid pointer ids;
        // document-level listeners still receive bubbled events.
      }
    }

    this.#pointerMoveListener = this.#renderer.listen(
      'document',
      'pointermove',
      (e: PointerEvent) => this.onDocumentPointerMove(e)
    );

    this.#pointerUpListener = this.#renderer.listen(
      'document',
      'pointerup',
      (e: PointerEvent) => this.onDocumentPointerUp(e)
    );

    this.#destroyRef.onDestroy(() => {
      this.cleanupListeners();
    });
  }

  /**
   * Track the pointer across cell boundaries during a drag.
   *
   * Replaces the old per-cell `mouseenter` handler. Necessary because
   * pointer capture and (on touch) coalesced events make boundary
   * crossings unreliable when relying on per-element enter events.
   */
  private onDocumentPointerMove(event: PointerEvent) {
    if (!this.isSelecting()) return;

    const el = document.elementFromPoint(event.clientX, event.clientY);
    const cell = el?.closest<HTMLElement>('.selection-ghost-cell');
    if (!cell) return;

    const row = Number(cell.dataset['row']);
    const col = Number(cell.dataset['col']);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return;

    // Skip updates while still inside the same cell — otherwise pointermove
    // (60–120 Hz) would re-emit a fresh object reference every frame and
    // trigger downstream rerenders across the whole overlay grid.
    const cur = this.selectionCurrent();
    if (cur && cur.row === row && cur.col === col) return;

    this.selectionCurrent.set({ row, col });
  }

  /**
   * Complete a selection on pointerup. Emits `selectionComplete` only when
   * total pointer movement meets `dragThreshold` — sub-threshold gestures
   * are treated as clicks and discarded.
   */
  private onDocumentPointerUp(event: PointerEvent) {
    if (!this.isSelecting()) return;

    this.isSelecting.set(false);

    const start = this.#pointerDownPos();
    const moved =
      start === null ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) >=
        this.dragThreshold();

    if (moved) {
      const bounds = this.selectionBounds();
      if (bounds) {
        this.selectionComplete.emit({
          topLeft: { row: bounds.startRow, col: bounds.startCol },
          bottomRight: { row: bounds.endRow, col: bounds.endCol },
        });
      }
    }

    this.#pointerDownPos.set(null);
    this.cleanupListeners();

    // Don't clear selection - let the parent control when to clear.
    // Selection remains visible until enableSelection becomes false.
  }

  /**
   * Drop the visible selection rectangle. After `selectionComplete` emits,
   * the viewer leaves `selectionStart`/`selectionCurrent` set so consumers
   * can render a confirm UX with the rectangle still visible. Call this
   * once that UX is done. No-op if no selection is active.
   */
  clearSelection(): void {
    this.selectionStart.set(null);
    this.selectionCurrent.set(null);
    this.isSelecting.set(false);
  }

  /**
   * Clean up document-level event listeners
   */
  private cleanupListeners() {
    if (this.#pointerMoveListener) {
      this.#pointerMoveListener();
      this.#pointerMoveListener = undefined;
    }
    if (this.#pointerUpListener) {
      this.#pointerUpListener();
      this.#pointerUpListener = undefined;
    }
  }
}
