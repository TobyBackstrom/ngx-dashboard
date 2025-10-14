import { InjectionToken } from '@angular/core';
import { EmptyCellContextProvider } from './empty-cell-context.provider';
import { DefaultEmptyCellContextProvider } from './default-empty-cell-context.provider';

/**
 * Injection token for the empty cell context provider.
 * Use this to provide your custom implementation for handling right-clicks on empty dashboard cells.
 *
 * @example
 * ```typescript
 * // Provide a custom implementation
 * providers: [
 *   {
 *     provide: EMPTY_CELL_CONTEXT_PROVIDER,
 *     useClass: MyCustomEmptyCellProvider
 *   }
 * ]
 * ```
 */
export const EMPTY_CELL_CONTEXT_PROVIDER =
  new InjectionToken<EmptyCellContextProvider>(
    'EmptyCellContextProvider',
    {
      providedIn: 'root',
      factory: () => new DefaultEmptyCellContextProvider(),
    }
  );
