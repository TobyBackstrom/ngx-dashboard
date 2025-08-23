/**
 * Resolves a CSS custom property that may contain a light-dark() function to a concrete color value.
 * 
 * This utility function handles Material Design 3 CSS custom properties that use the light-dark()
 * function to define different colors for light and dark themes. It extracts the appropriate
 * color based on the current theme mode.
 * 
 * @example
 * ```typescript
 * // Resolve surface variant color for light mode
 * const lightColor = resolveCssColor('--mat-sys-surface-variant', false, '#f3f3f3');
 * 
 * // Resolve primary color for dark mode  
 * const darkColor = resolveCssColor('--mat-sys-primary', true, '#6750a4');
 * ```
 * 
 * @param cssProperty - The CSS custom property name (e.g., '--mat-sys-surface-variant').
 *                      Must include the leading '--' prefix.
 * @param isDarkMode - Whether the current theme is in dark mode. Used to select between
 *                     light and dark colors when parsing light-dark() function values.
 * @param fallback - Optional fallback color if the property cannot be resolved or parsed.
 *                   Defaults to '#000000'. Should be a valid CSS color value.
 * @returns The resolved color value as a string. Returns either the parsed color from
 *          the CSS property or the fallback value if resolution fails.
 * 
 * @remarks
 * - The function automatically detects light-dark() function syntax and extracts the appropriate color
 * - If the CSS property contains a direct color value (not light-dark()), it returns that value
 * - CSS custom properties are resolved from the document root element (:root)
 * - The function is pure and has no side effects
 */
export function resolveCssColor(
  cssProperty: string,
  isDarkMode: boolean,
  fallback = '#000000'
): string {
  // Get the computed CSS custom property value from document root
  const rootStyle = getComputedStyle(document.documentElement);
  const propertyValue = rootStyle
    .getPropertyValue(cssProperty)
    .trim();

  // Return fallback if property is not defined
  if (!propertyValue) {
    return fallback;
  }

  // Parse light-dark() function value if present
  if (propertyValue.startsWith('light-dark(')) {
    const match = propertyValue.match(/light-dark\(\s*([^,]+),\s*([^)]+)\)/);
    if (match) {
      const lightColor = match[1].trim();
      const darkColor = match[2].trim();
      
      return isDarkMode ? darkColor : lightColor;
    }
    
    // Malformed light-dark() function, return fallback
    return fallback;
  }
  
  // Property contains a direct color value
  return propertyValue;
}