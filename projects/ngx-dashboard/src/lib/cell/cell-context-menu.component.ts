import { Component, viewChild, inject, ChangeDetectionStrategy, effect, computed } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import {
  CellContextMenuService,
  CellContextMenuItem,
} from './cell-context-menu.service';

@Component({
  selector: 'lib-cell-context-menu',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatDividerModule, MatButtonModule],
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
         from the cell component's right-click handler.
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

    <!-- Context menu -->
    <mat-menu #contextMenu="matMenu" [overlapTrigger]="true">
      @for (item of menuItems(); track $index) {
        @if (item.divider) {
          <mat-divider></mat-divider>
        } @else {
          <button 
            mat-menu-item 
            (click)="executeAction(item)" 
            [disabled]="item.disabled">
            @if (item.icon) {
              <mat-icon>{{ item.icon }}</mat-icon>
            }
            <span>{{ item.label }}</span>
          </button>
        }
      }
    </mat-menu>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class CellContextMenuComponent {
  menuTrigger = viewChild.required('menuTrigger', { read: MatMenuTrigger });
  
  menuService = inject(CellContextMenuService);
  
  menuPosition = computed(() => {
    const menu = this.menuService.activeMenu();
    return menu ? { left: `${menu.x}px`, top: `${menu.y}px` } : { left: '0px', top: '0px' };
  });
  
  menuItems = computed(() => {
    const menu = this.menuService.activeMenu();
    return menu?.items || [];
  });
  
  constructor() {
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
    
    // Hide service menu when Material menu closes
    effect(() => {
      const trigger = this.menuTrigger();
      if (trigger) {
        trigger.menuClosed.subscribe(() => {
          if (this.menuService.activeMenu()) {
            this.menuService.hide();
          }
        });
      }
    });
  }
  
  executeAction(item: CellContextMenuItem) {
    if (!item.divider && item.action) {
      item.action();
      this.menuService.hide();
    }
  }
}