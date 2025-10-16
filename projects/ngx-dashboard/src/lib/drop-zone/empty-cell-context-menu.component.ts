import {
  Component,
  viewChild,
  inject,
  ChangeDetectionStrategy,
  effect,
  computed,
  DestroyRef,
  Renderer2,
} from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  EmptyCellContextMenuService,
  EmptyCellContextMenuItem,
} from '../services/empty-cell-context-menu.service';

/**
 * Context menu component for empty dashboard cells.
 * Displays a list of available widgets that can be added to the empty cell.
 *
 * This component is similar to CellContextMenuComponent but designed specifically
 * for empty cells and includes support for SVG icons from widget metadata.
 *
 * @internal This component is for internal library use only
 */
@Component({
  selector: 'lib-empty-cell-context-menu',
  standalone: true,
  imports: [
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hidden trigger for menu positioned at exact mouse coordinates

         IMPORTANT: Angular Material applies its own positioning logic to menus,
         which by default offsets the menu from the trigger element to avoid overlap.
         To achieve precise positioning at mouse coordinates, we use these workarounds:

         1. The trigger container is 1x1px (not 0x0) because Material needs a physical
            element to calculate position against. Zero-sized elements cause unpredictable
            positioning.

         2. We use opacity:0 instead of visibility:hidden to keep the element in the
            layout flow while making it invisible.

         3. The button itself is styled to 1x1px with no padding to serve as a precise
            anchor point for the menu.

         4. The mat-menu uses [overlapTrigger]="true" to allow the menu to appear
            directly at the trigger position rather than offset from it.

         This approach ensures the menu appears at the exact mouse coordinates passed
         from the empty cell context provider's right-click handler.
    -->
    <div
      style="position: fixed; width: 1px; height: 1px; opacity: 0; pointer-events: none;"
      [style]="menuPosition()">
      <button
        mat-button
        #menuTrigger="matMenuTrigger"
        [matMenuTriggerFor]="contextMenu"
        style="width: 1px; height: 1px; padding: 0; min-width: 0; line-height: 0;">
      </button>
    </div>

    <!-- Context menu with widget list -->
    <mat-menu
      #contextMenu="matMenu"
      [overlapTrigger]="true"
      class="empty-cell-widget-menu">
      @for (item of menuItems(); track $index) {
        @if (item.divider) {
          <mat-divider></mat-divider>
        } @else {
          <button
            mat-menu-item
            (click)="executeAction(item)"
            [disabled]="item.disabled"
            class="widget-menu-item"
            [attr.aria-label]="item.label">
            @if (item.svgIcon) {
              <div class="widget-icon" [innerHTML]="sanitizeSvg(item.svgIcon)"></div>
            } @else if (item.icon) {
              <mat-icon>{{ item.icon }}</mat-icon>
            }
            <span>{{ item.label }}</span>
          </button>
        }
      }
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .empty-cell-widget-menu {
        max-height: 400px;
        overflow-y: auto;
      }

      .widget-menu-item {
        display: flex;
        align-items: center;
        gap: var(--mat-sys-space-3, 12px);
        min-height: 48px;
      }

      .widget-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        :deep(svg) {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
      }
    `,
  ],
})
export class EmptyCellContextMenuComponent {
  menuTrigger = viewChild.required('menuTrigger', { read: MatMenuTrigger });

  menuService = inject(EmptyCellContextMenuService);
  #sanitizer = inject(DomSanitizer);
  #renderer = inject(Renderer2);
  #destroyRef = inject(DestroyRef);

  menuPosition = computed(() => {
    const menu = this.menuService.activeMenu();
    return menu
      ? { left: `${menu.x}px`, top: `${menu.y}px` }
      : { left: '0px', top: '0px' };
  });

  menuItems = computed(() => {
    const menu = this.menuService.activeMenu();
    return menu?.items || [];
  });

  constructor() {
    // Material Menu has a backdrop that blocks events from reaching other elements.
    // When any right-click occurs while menu is open, we need to:
    // 1. Close the current menu
    // 2. Prevent the browser's default context menu
    //
    // Users will need to right-click again to open empty cell menus.
    // This follows standard UX patterns used by most applications.
    const unlisten = this.#renderer.listen(
      'document',
      'contextmenu',
      (event: Event) => {
        if (this.menuService.activeMenu()) {
          // Prevent browser's default context menu when closing widget menu
          event.preventDefault();
          this.menuService.hide();
        }
      }
    );

    this.#destroyRef.onDestroy(() => {
      unlisten();
    });

    // Show menu when service state changes
    effect(() => {
      const menu = this.menuService.activeMenu();
      if (menu) {
        // Use queueMicrotask to ensure the view is fully initialized
        // This fixes the issue where the menu disappears on first right-click
        queueMicrotask(() => {
          const trigger = this.menuTrigger();
          if (trigger) {
            // Close any existing menu first
            if (trigger.menuOpen) {
              trigger.closeMenu();
            }
            // Open menu - position is handled by signal
            trigger.openMenu();
          }
        });
      } else {
        const trigger = this.menuTrigger();
        if (trigger) {
          trigger.closeMenu();
        }
      }
    });

    // Subscribe to menu closed event once when trigger becomes available
    // This ensures the service state is synchronized when Material menu closes
    effect((onCleanup) => {
      const trigger = this.menuTrigger();
      if (trigger) {
        const subscription = trigger.menuClosed.subscribe(() => {
          if (this.menuService.activeMenu()) {
            this.menuService.hide();
          }
        });

        // Clean up subscription when effect re-runs or component destroys
        onCleanup(() => subscription.unsubscribe());
      }
    });
  }

  executeAction(item: EmptyCellContextMenuItem): void {
    if (!item.divider && item.action) {
      item.action();
      this.menuService.hide();
    }
  }

  sanitizeSvg(svg: string): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(svg);
  }
}
