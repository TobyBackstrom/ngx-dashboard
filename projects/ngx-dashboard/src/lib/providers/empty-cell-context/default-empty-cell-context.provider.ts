import { Injectable } from '@angular/core';
import { EmptyCellContextProvider } from './empty-cell-context.provider';

/**
 * Default empty cell context provider that prevents the browser's context menu
 * and performs no other action.
 *
 * This is the default behavior that allows users to right-click on empty dashboard
 * cells without triggering the browser's default context menu.
 */
@Injectable({
  providedIn: 'root',
})
export class DefaultEmptyCellContextProvider extends EmptyCellContextProvider {
  /**
   * Default empty cell context handler.
   * The browser context menu is already prevented by the component.
   * No additional action is taken by default.
   */
  handleEmptyCellContext(): void {
    // Default behavior: do nothing
  }
}
