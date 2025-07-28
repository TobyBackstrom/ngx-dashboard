/**
 * Defines space that should be reserved around the dashboard component
 * when calculating viewport constraints.
 */
export interface ReservedSpace {
  /** Space reserved at the top (e.g., toolbar height) */
  top: number;
  /** Space reserved on the right (e.g., padding, widget list) */
  right: number;
  /** Space reserved at the bottom (e.g., padding) */
  bottom: number;
  /** Space reserved on the left (e.g., padding) */
  left: number;
}

/**
 * Default reserved space when none is specified
 */
export const DEFAULT_RESERVED_SPACE: ReservedSpace = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};