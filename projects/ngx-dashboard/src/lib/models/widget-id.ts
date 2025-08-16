/**
 * Branded type for widget identifiers to ensure type safety when working with widget instances.
 * This prevents accidentally mixing up widget IDs with other string values.
 */
export type WidgetId = string & { __brand: 'WidgetId' };

/**
 * Utility functions for working with WidgetId branded type.
 * WidgetIds are UUIDs that uniquely identify widget instances throughout their lifecycle,
 * independent of their position on the dashboard grid.
 */
export const WidgetIdUtils = {
  /**
   * Generates a new unique WidgetId.
   * Uses crypto.randomUUID() when available, falls back to timestamp-based ID for older browsers.
   * @returns A new unique WidgetId
   */
  generate(): WidgetId {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID() as WidgetId;
    }
    // Fallback for older browsers
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as WidgetId;
  },

  /**
   * Validates if a string is a valid WidgetId format.
   * @param id - The string to validate
   * @returns True if the string is a valid WidgetId format
   */
  validate(id: string): id is WidgetId {
    // UUID v4 format or fallback format
    return (
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      /^widget-\d+-[a-z0-9]{9}$/i.test(id)
    );
  },

  /**
   * Converts a WidgetId to a string for use as map keys or serialization.
   * @param id - The WidgetId to convert
   * @returns The string representation of the WidgetId
   */
  toString(id: WidgetId): string {
    return id;
  },

  /**
   * Creates a WidgetId from a string, validating the format.
   * @param str - The string to convert to WidgetId
   * @returns A WidgetId
   * @throws Error if the string is not a valid WidgetId format
   */
  fromString(str: string): WidgetId {
    if (!this.validate(str)) {
      throw new Error(`Invalid WidgetId format: ${str}`);
    }
    return str as WidgetId;
  },

  /**
   * Checks if two WidgetIds are equal.
   * @param a - First WidgetId
   * @param b - Second WidgetId
   * @returns True if the WidgetIds are the same
   */
  equals(a: WidgetId, b: WidgetId): boolean {
    return a === b;
  },
};