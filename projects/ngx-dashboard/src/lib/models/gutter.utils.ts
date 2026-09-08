// gutter.utils.ts
//
// Validation for the grid's gutter size. The value reaches CSS as the
// `--gutter-size` custom property, which `_dashboard-grid-vars.scss` feeds
// into a calc() with no fallback:
//
//   --cell-size: calc(100cqi / var(--columns) - ...)
//
// An invalid value therefore makes `--cell-size` invalid at computed-value
// time, `grid-template-columns` falls back to `none`, and the whole grid
// collapses with no error anywhere. Everything that can write the gutter —
// the public setter, `setGridConfig()` and the DTO import path — goes through
// `sanitizeGutterSize()` so a malformed value can never reach the style
// binding.

/**
 * CSS lengths accepted for the gutter.
 *
 * Deliberately limited to px/em/rem: percentage and viewport units interact
 * badly with the container-query arithmetic in `_dashboard-grid-vars.scss`,
 * which resolves the cell size against `100cqi`. `em` is the default because
 * it scales with the host application's type.
 */
const GUTTER_PATTERN = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*(px|em|rem)\s*$/;

/**
 * Discrete gutter steps offered by the reference UI in the demo application.
 *
 * Consumers are free to ignore these and pass any value that satisfies
 * `sanitizeGutterSize()`. `0` is deliberately absent: at a zero gutter the
 * grid loses the outer band the resize handles live in (they fall back to
 * their 6px floor in `grid-resize-handle.component.scss`) and the handles end
 * up sitting on top of the last column and row of widgets.
 */
export const GUTTER_SIZE_PRESETS = [
  '0.25em',
  '0.5em',
  '0.75em',
  '1em',
  '1.5em',
] as const;

/**
 * Returns `value` when it is a CSS length this grid can safely use, otherwise
 * `fallback`. Surrounding whitespace is trimmed from an accepted value.
 *
 * Rejection is silent by design — the caller keeps whatever gutter it already
 * had, which is always a value that has been through this function. `value`
 * accepts `undefined` so a partial geometry update can pass the field through
 * without the caller branching on its presence.
 *
 * @example
 * sanitizeGutterSize('0.5em', '1em'); // '0.5em'
 * sanitizeGutterSize('8', '1em');     // '1em'  (no unit)
 * sanitizeGutterSize('50%', '1em');   // '1em'  (unsupported unit)
 * sanitizeGutterSize(undefined, '1em'); // '1em' (field omitted)
 */
export function sanitizeGutterSize(
  value: string | undefined,
  fallback: string
): string {
  return typeof value === 'string' && GUTTER_PATTERN.test(value)
    ? value.trim()
    : fallback;
}
