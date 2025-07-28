import { Injectable, signal } from '@angular/core';

export type CellContextMenuItem =
  | {
      label: string;
      icon?: string;  // Material icon name (e.g., 'edit', 'settings', 'delete')
      action: () => void;
      disabled?: boolean;
      divider?: false;
    }
  | {
      divider: true;
      label?: never;
      icon?: never;
      action?: never;
      disabled?: never;
    };

@Injectable()
export class CellContextMenuService {
  #activeMenu = signal<{
    x: number;
    y: number;
    items: CellContextMenuItem[];
  } | null>(null);

  activeMenu = this.#activeMenu.asReadonly();

  show(x: number, y: number, items: CellContextMenuItem[]) {
    this.#activeMenu.set({ x, y, items });
  }

  hide() {
    this.#activeMenu.set(null);
  }
}
