# ngx-dashboard i18n Translation Keys

This document lists all the translation keys used in the ngx-dashboard library. When using this library in an application with Angular i18n support, these keys will be extracted automatically when you run `ng extract-i18n` on your application.

## Setup Requirements

To use i18n features with ngx-dashboard, your consuming application must have `@angular/localize` configured:

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

### Context Menu

- `@@ngx.dashboard.cell.menu.edit` - "Edit Widget"
- `@@ngx.dashboard.cell.menu.settings` - "Settings"
- `@@ngx.dashboard.cell.menu.delete` - "Delete"

### Cell Settings Dialog

- `@@ngx.dashboard.cell.settings.title` - "Cell Display Settings"
- `@@ngx.dashboard.cell.settings.cellId` - "Cell ID: {id}"
- `@@ngx.dashboard.cell.settings.mode.normal` - "Normal"
- `@@ngx.dashboard.cell.settings.mode.normal.description` - "Standard cell display with full content visibility"
- `@@ngx.dashboard.cell.settings.mode.flat` - "Flat"
- `@@ngx.dashboard.cell.settings.mode.flat.description` - "Simplified display with reduced visual emphasis"

### Common Actions

- `@@ngx.dashboard.common.cancel` - "Cancel"
- `@@ngx.dashboard.common.apply` - "Apply"

### Widget List

- `@@ngx.dashboard.widget.list.available` - "Available widgets" (aria-label)
- `@@ngx.dashboard.widget.list.item.ariaLabel` - "{name} widget: {description}" (aria-label pattern)

### Cell Resize

- `@@ngx.dashboard.cell.resize.dimensions` - "{width} × {height}" (dimension display format)

### Unknown Widget

- `@@ngx.dashboard.unknown.widget.name` - "Unknown Widget"
- `@@ngx.dashboard.unknown.widget.description` - "Fallback widget for unknown widget types"

## Usage

When you include ngx-dashboard in your Angular application that uses i18n:

1. Run `ng extract-i18n` on your application
2. The above keys will be included in your translation files (e.g., messages.xlf)
3. Provide translations for each key in your locale-specific translation files
4. Build your application with the desired locale

## Example Translation (Spanish)

```xml
<trans-unit id="cell.menu.edit">
  <source>Edit Widget</source>
  <target>Editar Widget</target>
</trans-unit>

<trans-unit id="cell.menu.settings">
  <source>Settings</source>
  <target>Configuración</target>
</trans-unit>

<trans-unit id="cell.menu.delete">
  <source>Delete</source>
  <target>Eliminar</target>
</trans-unit>
```

## Note on Library i18n

Angular libraries with i18n support work differently than applications:

- Libraries mark their strings for translation using `$localize` and `i18n` attributes
- The consuming application extracts and provides the actual translations
- When the application is built with a specific locale, the library strings are translated automatically
