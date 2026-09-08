import {
  GUTTER_SIZE_PRESETS,
  sanitizeGutterSize,
} from '../gutter.utils';

describe('sanitizeGutterSize', () => {
  const FALLBACK = '0.5em';

  describe('accepted values', () => {
    // '0px' is a valid CSS length so the API allows it, even though the
    // preset scale deliberately stops short of a zero gutter.
    const accepted = ['0.5em', '1em', '8px', '0px', '.75rem', '2rem', '12.5px'];

    for (const value of accepted) {
      it(`accepts ${value}`, () => {
        expect(sanitizeGutterSize(value, FALLBACK)).toBe(value);
      });
    }

    it('trims surrounding whitespace from an accepted value', () => {
      expect(sanitizeGutterSize('  1em  ', FALLBACK)).toBe('1em');
    });
  });

  describe('rejected values', () => {
    // Each of these reaches --gutter-size, which _dashboard-grid-vars.scss
    // feeds into a calc() with no fallback: an invalid value collapses the
    // whole grid, so the fallback must win.
    const rejected = [
      ['a unitless number', '8'],
      ['a comma decimal separator', '0,5em'],
      ['an empty string', ''],
      ['whitespace only', '   '],
      ['a percentage', '50%'],
      ['viewport units', '2vw'],
      ['a calc expression', 'calc(1em + 2px)'],
      ['a negative length', '-1em'],
      ['an unknown unit', '4ch'],
      ['trailing junk', '1em; color: red'],
      ['a bare unit', 'em'],
    ] as const;

    for (const [label, value] of rejected) {
      it(`rejects ${label} (${JSON.stringify(value)})`, () => {
        expect(sanitizeGutterSize(value, FALLBACK)).toBe(FALLBACK);
      });
    }

    it('rejects a non-string value', () => {
      expect(
        sanitizeGutterSize(undefined as unknown as string, FALLBACK)
      ).toBe(FALLBACK);
      expect(sanitizeGutterSize(null as unknown as string, FALLBACK)).toBe(
        FALLBACK
      );
      expect(sanitizeGutterSize(8 as unknown as string, FALLBACK)).toBe(
        FALLBACK
      );
    });
  });

  it('accepts every preset it ships', () => {
    for (const preset of GUTTER_SIZE_PRESETS) {
      expect(sanitizeGutterSize(preset, FALLBACK)).toBe(preset);
    }
  });

  it('excludes a zero gutter from the presets', () => {
    // At gutter 0 the grid loses the outer band the resize handles live in,
    // so they fall back to their 6px floor and sit on top of widget content.
    for (const preset of GUTTER_SIZE_PRESETS) {
      expect(parseFloat(preset)).toBeGreaterThan(0);
    }
  });
});
