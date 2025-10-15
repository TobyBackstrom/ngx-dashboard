// widget-shared-state-provider.ts

/**
 * Interface for providing shared state across all instances of a widget type.
 *
 * Widget families can implement this interface to manage state that should be
 * shared across all instances of that widget type (e.g., theme colors, configuration).
 *
 * During dashboard serialization, the framework calls getSharedState() once per
 * widget type (not per instance), and during deserialization, setSharedState()
 * is called to restore the shared configuration.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class ParkingSpaceSharedState implements WidgetSharedStateProvider<ParkingConfig> {
 *   private state = signal<ParkingConfig>({ color: '#4CAF50', pricePerHour: 5 });
 *
 *   getSharedState(): ParkingConfig {
 *     return this.state();
 *   }
 *
 *   setSharedState(state: ParkingConfig): void {
 *     this.state.set(state);
 *   }
 *
 *   readonly config = this.state.asReadonly();
 * }
 *
 * // Register with dashboard
 * dashboardService.registerWidgetType(ParkingSpaceWidget, ParkingSpaceSharedState);
 * ```
 */
export interface WidgetSharedStateProvider<T = unknown> {
  /**
   * Gets the current shared state for this widget type.
   * Called during dashboard export/serialization.
   *
   * @returns The current shared state, or undefined if no state should be serialized
   */
  getSharedState(): T | undefined;

  /**
   * Sets the shared state for this widget type.
   * Called during dashboard import/deserialization before widget instances are created.
   *
   * @param state The shared state to restore
   */
  setSharedState(state: T): void;
}
