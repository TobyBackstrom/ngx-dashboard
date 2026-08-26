// gutter-size.ts
//
// Helpers for driving a dashboard's CSS gutter length from a numeric slider.

/**
 * Units the gutter slider can drive, with the range that makes sense for each.
 * A gutter is a small inter-cell gap, so the ranges stay deliberately tight —
 * wide enough to be useful, narrow enough that the slider keeps usable
 * resolution.
 */
export const GUTTER_UNITS = {
  px: { max: 48, step: 1 },
  em: { max: 3, step: 0.05 },
  rem: { max: 3, step: 0.05 },
} as const;

export type GutterUnit = keyof typeof GUTTER_UNITS;

export interface GutterSize {
  value: number;
  unit: GutterUnit;
}

/** Matches `DashboardStore`'s own default, so an unparseable value lands there. */
const DEFAULT_GUTTER: GutterSize = { value: 0.5, unit: 'em' };

/**
 * Splits a CSS gutter length into the number the slider drives and the unit it
 * keeps. Only the units the slider can render are recognised; anything else
 * (`calc()`, `%`, `vw`, an empty string) falls back to the store default rather
 * than being silently reinterpreted in the wrong unit.
 */
export function parseGutterSize(raw: string | null | undefined): GutterSize {
  const match = /^\s*(\d*\.?\d+)\s*(px|em|rem)?\s*$/i.exec(raw ?? '');
  if (!match) return { ...DEFAULT_GUTTER };

  const unit = (match[2]?.toLowerCase() as GutterUnit | undefined) ?? 'em';
  return { value: Math.min(Number(match[1]), GUTTER_UNITS[unit].max), unit };
}

/**
 * Renders a gutter size back to CSS. Rounded to two decimals because the
 * fractional slider steps otherwise surface floating point noise
 * (`0.15000000000000002em`) in the exported dashboard.
 */
export function formatGutterSize({ value, unit }: GutterSize): string {
  return `${Number(value.toFixed(2))}${unit}`;
}
