# ngx-dashboard-widgets i18n Translation Keys

This document lists all the translation keys used in the ngx-dashboard-widgets library. When using this library in an application with Angular i18n support, these keys will be extracted automatically when you run `ng extract-i18n` on your application.

## Setup Requirements

To use i18n features with ngx-dashboard-widgets, your consuming application must have `@angular/localize` configured:

1. Install @angular/localize in your application:

   ```bash
   npm install @angular/localize
   ```

2. Add the localize polyfill to your application's polyfills (in angular.json):

   ```json
   "polyfills": [
     "@angular/localize/init",
     "zone.js"
   ]
   ```

3. Ensure your application's tsconfig includes the localize types:
   ```json
   "compilerOptions": {
     "types": ["@angular/localize"]
   }
   ```

## Translation Keys

### Widget Metadata

#### Arrow Widget

- `@@ngx.dashboard.widgets.arrow.name` - "Arrow"
- `@@ngx.dashboard.widgets.arrow.description` - "A generic arrow"

#### Label Widget

- `@@ngx.dashboard.widgets.label.name` - "Label"
- `@@ngx.dashboard.widgets.label.description` - "A simple text label widget"

#### Clock Widget

- `@@ngx.dashboard.widgets.clock.name` - "Clock"
- `@@ngx.dashboard.widgets.clock.description` - "Display time in analog or digital format"

#### Radial Gauge Widget

- `@@ngx.dashboard.widgets.radialGauge.name` - "Radial Gauge"
- `@@ngx.dashboard.widgets.radialGauge.description` - "A semi-circular gauge indicator"

### Arrow Widget Settings Dialog

- `@@ngx.dashboard.widgets.arrow.dialog.title` - "Arrow Settings"
- `@@ngx.dashboard.widgets.arrow.dialog.direction` - "Arrow Direction"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.up` - "Up"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.right` - "Right"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.down` - "Down"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.left` - "Left"
- `@@ngx.dashboard.widgets.arrow.dialog.opacity` - "Opacity: {value}%"
- `@@ngx.dashboard.widgets.arrow.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.arrow.dialog.backgroundHint` - "Adds a background behind the arrow"

### Label Widget Settings Dialog

- `@@ngx.dashboard.widgets.label.dialog.title` - "Label Settings"
- `@@ngx.dashboard.widgets.label.dialog.labelText` - "Label Text"
- `@@ngx.dashboard.widgets.label.dialog.placeholder` - "Enter your label text..."
- `@@ngx.dashboard.widgets.label.dialog.responsive` - "Responsive Text"
- `@@ngx.dashboard.widgets.label.dialog.responsiveDescription` - "Automatically adjust text size to fit the widget"
- `@@ngx.dashboard.widgets.label.dialog.fontSizeLimits` - "Font Size Limits"
- `@@ngx.dashboard.widgets.label.dialog.minSize` - "Min Size (px)"
- `@@ngx.dashboard.widgets.label.dialog.minSizeError` - "Must be between 8-24px"
- `@@ngx.dashboard.widgets.label.dialog.minSizeRangeError` - "Must be less than max size"
- `@@ngx.dashboard.widgets.label.dialog.minSizeHint` - "8-24px range"
- `@@ngx.dashboard.widgets.label.dialog.maxSize` - "Max Size (px)"
- `@@ngx.dashboard.widgets.label.dialog.maxSizeError` - "Must be between 16-128px"
- `@@ngx.dashboard.widgets.label.dialog.maxSizeRangeError` - "Must be greater than min size"
- `@@ngx.dashboard.widgets.label.dialog.maxSizeHint` - "16-128px range"
- `@@ngx.dashboard.widgets.label.dialog.fontSize` - "Font Size (px)"
- `@@ngx.dashboard.widgets.label.dialog.alignment` - "Alignment"
- `@@ngx.dashboard.widgets.label.dialog.alignment.left` - "Left"
- `@@ngx.dashboard.widgets.label.dialog.alignment.center` - "Center"
- `@@ngx.dashboard.widgets.label.dialog.alignment.right` - "Right"
- `@@ngx.dashboard.widgets.label.dialog.fontWeight` - "Font Weight"
- `@@ngx.dashboard.widgets.label.dialog.fontWeight.normal` - "Normal"
- `@@ngx.dashboard.widgets.label.dialog.fontWeight.bold` - "Bold"
- `@@ngx.dashboard.widgets.label.dialog.opacity` - "Opacity: {value}%"
- `@@ngx.dashboard.widgets.label.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.label.dialog.backgroundDescription` - "Adds a background behind the text"

### Clock Widget Settings Dialog

- `@@ngx.dashboard.widgets.clock.dialog.title` - "Clock Settings"
- `@@ngx.dashboard.widgets.clock.dialog.displayMode` - "Display Mode"
- `@@ngx.dashboard.widgets.clock.dialog.mode.digital` - "Digital"
- `@@ngx.dashboard.widgets.clock.dialog.mode.analog` - "Analog"
- `@@ngx.dashboard.widgets.clock.dialog.timeFormat` - "Time Format"
- `@@ngx.dashboard.widgets.clock.dialog.format.24h` - "24 Hour (14:30:45)"
- `@@ngx.dashboard.widgets.clock.dialog.format.12h` - "12 Hour (2:30:45 PM)"
- `@@ngx.dashboard.widgets.clock.dialog.showSeconds` - "Show Seconds"
- `@@ngx.dashboard.widgets.clock.dialog.showSecondsDescription.digital` - "Display seconds in the time"
- `@@ngx.dashboard.widgets.clock.dialog.showSecondsDescription.analog` - "Show the second hand on the clock"
- `@@ngx.dashboard.widgets.clock.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.clock.dialog.backgroundDescription` - "Adds a background behind the clock"

### Radial Gauge Widget Settings Dialog

- `@@ngx.dashboard.widgets.radialGauge.dialog.title` - "Radial Gauge Settings"
- `@@ngx.dashboard.widgets.radialGauge.dialog.value` - "Value (0-100)"
- `@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile` - "Color Profile"
- `@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile.dynamic` - "Dynamic (Theme Colors)"
- `@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile.static` - "Static (Performance Colors)"
- `@@ngx.dashboard.widgets.radialGauge.dialog.activeDisplay` - "Active Display"
- `@@ngx.dashboard.widgets.radialGauge.dialog.activeDisplayDescription` - "Display live gauge instead of passive icon"
- `@@ngx.dashboard.widgets.radialGauge.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.radialGauge.dialog.backgroundDescription` - "Add a background color to the widget"
- `@@ngx.dashboard.widgets.radialGauge.dialog.showValueLabel` - "Show Value Label"
- `@@ngx.dashboard.widgets.radialGauge.dialog.showValueLabelDescription` - "Display numeric value in gauge center"

### Common Actions

- `@@ngx.dashboard.common.cancel` - "Cancel"
- `@@ngx.dashboard.common.save` - "Save"

## Usage

When you include ngx-dashboard-widgets in your Angular application that uses i18n:

1. Run `ng extract-i18n` on your application
2. The above keys will be included in your translation files (e.g., messages.xlf)
3. Provide translations for each key in your locale-specific translation files
4. Build your application with the desired locale

## Example Translation (Spanish)

```xml
<trans-unit id="ngx.dashboard.widgets.arrow.name">
  <source>Arrow</source>
  <target>Flecha</target>
</trans-unit>

<trans-unit id="ngx.dashboard.widgets.label.name">
  <source>Label</source>
  <target>Etiqueta</target>
</trans-unit>

<trans-unit id="ngx.dashboard.widgets.clock.name">
  <source>Clock</source>
  <target>Reloj</target>
</trans-unit>

<trans-unit id="ngx.dashboard.widgets.arrow.dialog.title">
  <source>Arrow Settings</source>
  <target>Configuración de Flecha</target>
</trans-unit>

<trans-unit id="common.cancel">
  <source>Cancel</source>
  <target>Cancelar</target>
</trans-unit>

<trans-unit id="common.save">
  <source>Save</source>
  <target>Guardar</target>
</trans-unit>
```

## Note on Library i18n

Angular libraries with i18n support work differently than applications:

- Libraries mark their strings for translation using `$localize` and `i18n` attributes
- The consuming application extracts and provides the actual translations
- When the application is built with a specific locale, the library strings are translated automatically
- The ngx-dashboard-widgets library requires `@angular/localize` as a peer dependency
