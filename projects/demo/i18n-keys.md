# Demo Application i18n Translation Keys

This document lists all the translation keys used in the demo application. The demo app demonstrates comprehensive i18n support with 288 translation keys.

## Setup Requirements

To use i18n features with the demo application:

1. Install @angular/localize:
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

## Translation Keys by Category

### Navigation (3 keys)
- `@@demo.navigation.dashboard` - "Dashboard"
- `@@demo.navigation.radialGaugeDemo` - "Radial Gauge Demo"
- `@@demo.navigation.colors` - "Colors Overview"

### App Level (4 keys)
- `@@demo.app.title` - "Dashboard Demo and Component Tests"
- `@@demo.theme.switchToLight` - "Switch to light theme"
- `@@demo.theme.switchToDark` - "Switch to dark theme"
- `@@demo.theme.selectTheme` - "Select theme"
- `@@demo.theme.selectSpecific` - "Select {themeName} theme"

### Theme Colors (13 keys)
- `@@demo.theme.custom` - "Custom"
- `@@demo.theme.red` - "Red"
- `@@demo.theme.green` - "Green"
- `@@demo.theme.blue` - "Blue"
- `@@demo.theme.yellow` - "Yellow"
- `@@demo.theme.cyan` - "Cyan"
- `@@demo.theme.magenta` - "Magenta"
- `@@demo.theme.orange` - "Orange"
- `@@demo.theme.chartreuse` - "Chartreuse"
- `@@demo.theme.springGreen` - "Spring Green"
- `@@demo.theme.azure` - "Azure"
- `@@demo.theme.violet` - "Violet"
- `@@demo.theme.rose` - "Rose"

### Colors Overview Page (5 keys)
- `@@demo.colors.title` - "Color System Overview"
- `@@demo.colors.subtitle` - "Current theme's Material Design 3 color tokens"
- `@@demo.colors.variableName` - "Variable Name"
- `@@demo.colors.colorValue` - "Color Value"
- `@@demo.colors.preview` - "Preview"
- `@@demo.colors.colorPreview` - "Color preview for {colorName}"

### Dashboard Actions (11 keys)
- `@@demo.dashboard.exportToFile` - "Export to File"
- `@@demo.dashboard.importFromFile` - "Import from File"
- `@@demo.dashboard.saveToBrowser` - "Save to Browser"
- `@@demo.dashboard.loadFromBrowser` - "Load from Browser"
- `@@demo.dashboard.resetToDefault` - "Reset to Default"
- `@@demo.dashboard.clearDashboard` - "Clear Dashboard"
- `@@demo.dashboard.closeSpeedDialMenu` - "Close speed dial menu"
- `@@demo.dashboard.switchToViewMode` - "Switch to View Mode"
- `@@demo.dashboard.switchToEditMode` - "Switch to Edit Mode"
- `@@demo.dashboard.closeMenu` - "Close menu"
- `@@demo.dashboard.dashboardActions` - "Dashboard actions"

### Cell Selection Dialog (8 keys)
- `@@demo.dashboard.cellSelection.dialog.title` - "Cell Selection"
- `@@demo.dashboard.cellSelection.dialog.topLeft` - "Top Left"
- `@@demo.dashboard.cellSelection.dialog.bottomRight` - "Bottom Right"
- `@@demo.dashboard.cellSelection.dialog.row` - "Row"
- `@@demo.dashboard.cellSelection.dialog.col` - "Column"
- `@@demo.dashboard.cellSelection.dialog.dimensions` - "Dimensions"
- `@@demo.dashboard.cellSelection.dialog.rows` - "Rows"
- `@@demo.dashboard.cellSelection.dialog.cols` - "Columns"

### Radial Gauge Demo - Controls (94 keys)

#### Basic Controls (7 keys)
- `@@demo.radialGaugeDemo.title` - "Radial Gauge Component Demo"
- `@@demo.radialGaugeDemo.controls` - "Gauge Controls"
- `@@demo.radialGaugeDemo.presetConfigurations` - "Preset Configurations"
- `@@demo.radialGaugeDemo.default` - "Default"
- `@@demo.radialGaugeDemo.temperature` - "Temperature"
- `@@demo.radialGaugeDemo.performance` - "Performance"
- `@@demo.radialGaugeDemo.battery` - "Battery"
- `@@demo.radialGaugeDemo.network` - "Network"
- `@@demo.radialGaugeDemo.storage` - "Storage"

#### Value Settings (5 keys)
- `@@demo.radialGaugeDemo.valueSettings` - "Value Settings"
- `@@demo.radialGaugeDemo.valueLabel` - "Value: {value}"
- `@@demo.radialGaugeDemo.randomValue` - "Random Value"
- `@@demo.radialGaugeDemo.min` - "Min"
- `@@demo.radialGaugeDemo.max` - "Max"

#### Dimensions (6 keys)
- `@@demo.radialGaugeDemo.dimensions` - "Dimensions"
- `@@demo.radialGaugeDemo.sizeLabel` - "Size: {size}px"
- `@@demo.radialGaugeDemo.outerThicknessLabel` - "Outer Thickness: {outerThickness}px"
- `@@demo.radialGaugeDemo.innerThicknessLabel` - "Inner Thickness: {innerThickness}px"
- `@@demo.radialGaugeDemo.gapLabel` - "Gap: {gap}px"
- `@@demo.radialGaugeDemo.segmentGapLabel` - "Segment Gap: {segmentGapPx}px"

#### Animation (3 keys)
- `@@demo.radialGaugeDemo.animation` - "Animation"
- `@@demo.radialGaugeDemo.startAnimation` - "Start Animation"
- `@@demo.radialGaugeDemo.stopAnimation` - "Stop Animation"

#### Advanced Features (10 keys)
- `@@demo.radialGaugeDemo.advancedFeatures` - "Advanced Features"
- `@@demo.radialGaugeDemo.showValueLabel` - "Show Value Label"
- `@@demo.radialGaugeDemo.hasBackground` - "Has Background"
- `@@demo.radialGaugeDemo.labelReference` - "Label Reference"
- `@@demo.radialGaugeDemo.labelReferencePlaceholder` - "e.g., '00000' or leave empty"
- `@@demo.radialGaugeDemo.labelReferenceHint` - "Text/number for width calculation"
- `@@demo.radialGaugeDemo.referenceGlyph` - "Reference Glyph"
- `@@demo.radialGaugeDemo.referenceGlyphHint` - "Single character"
- `@@demo.radialGaugeDemo.labelPaddingLabel` - "Label Padding: {labelPadding}px"
- `@@demo.radialGaugeDemo.baselineSafetyLabel` - "Baseline Safety: {baselineSafety}"

#### Preview Section (4 keys)
- `@@demo.radialGaugeDemo.preview` - "Gauge Preview"
- `@@demo.radialGaugeDemo.animatedGauge` - "Animated Gauge"
- `@@demo.radialGaugeDemo.liveData` - "Live Data"
- `@@demo.radialGaugeDemo.realtimeMonitoring` - "Real-time monitoring"

#### Responsive Container Demo (6 keys)
- `@@demo.radialGaugeDemo.responsiveContainerDemo` - "Responsive Container Demo"
- `@@demo.radialGaugeDemo.responsiveDescription` - "Drag the resize handles to see the gauge adapt to container size changes..."
- `@@demo.radialGaugeDemo.containerWidthLabel` - "Container Width: {containerWidth}px"
- `@@demo.radialGaugeDemo.containerHeightLabel` - "Container Height: {containerHeight}px"
- `@@demo.radialGaugeDemo.sizeToThicknessRatioLabel` - "Size To Thickness Ratio: {sizeToThicknessRatio}"
- `@@demo.radialGaugeDemo.dimensionsDisplay` - "{containerWidth} × {containerHeight}px container"

#### Dashboard Example (24 keys)
- `@@demo.radialGaugeDemo.dashboardExample` - "Dashboard Example"
- `@@demo.radialGaugeDemo.cpuUsage` - "CPU Usage"
- `@@demo.radialGaugeDemo.cpuUsageTitle` - "CPU Usage"
- `@@demo.radialGaugeDemo.percentage` - "Percentage"
- `@@demo.radialGaugeDemo.memory` - "Memory"
- `@@demo.radialGaugeDemo.memoryUsageTitle` - "Memory Usage"
- `@@demo.radialGaugeDemo.percentageMemory` - "Percentage"
- `@@demo.radialGaugeDemo.diskIO` - "Disk I/O"
- `@@demo.radialGaugeDemo.diskIOTitle` - "Disk I/O"
- `@@demo.radialGaugeDemo.percentageDisk` - "Percentage"
- `@@demo.radialGaugeDemo.networkHeader` - "Network"
- `@@demo.radialGaugeDemo.networkTitle` - "Network"
- `@@demo.radialGaugeDemo.signalStrength` - "Signal Strength"
- `@@demo.radialGaugeDemo.batteryHeader` - "Battery"
- `@@demo.radialGaugeDemo.batteryTitle` - "Battery"
- `@@demo.radialGaugeDemo.chargeLevel` - "Charge Level"
- `@@demo.radialGaugeDemo.temperatureHeader` - "Temperature"
- `@@demo.radialGaugeDemo.temperatureTitle` - "Temperature"
- `@@demo.radialGaugeDemo.celsius` - "Celsius"

#### Usage Examples (5 keys)
- `@@demo.radialGaugeDemo.usageExamples` - "Usage Examples"
- `@@demo.radialGaugeDemo.responsiveContainerGauge` - "1. Responsive Container Gauge (Recommended for Dashboards)"
- `@@demo.radialGaugeDemo.fixedSizeGauge` - "2. Fixed Size Gauge (Traditional)"
- `@@demo.radialGaugeDemo.scalableDesignGauge` - "3. Scalable Design Gauge"
- `@@demo.radialGaugeDemo.advancedFeaturesExample` - "4. Advanced Features (Text Display & Styling)"
- `@@demo.radialGaugeDemo.typeScriptInterface` - "TypeScript Interface"

#### Gauge Titles and Descriptions (12 keys)
- `@@demo.radialGaugeDemo.titleTemperature` - "Temperature"
- `@@demo.radialGaugeDemo.titlePerformance` - "Performance"
- `@@demo.radialGaugeDemo.titleBatteryLevel` - "Battery Level"
- `@@demo.radialGaugeDemo.titleNetworkSignal` - "Network Signal"
- `@@demo.radialGaugeDemo.titleStorageUsage` - "Storage Usage"
- `@@demo.radialGaugeDemo.titleDefaultGauge` - "Gauge"
- `@@demo.radialGaugeDemo.descriptionCelsius` - "Celsius"
- `@@demo.radialGaugeDemo.descriptionScore` - "Score"
- `@@demo.radialGaugeDemo.descriptionPercentage` - "Percentage"
- `@@demo.radialGaugeDemo.descriptionBars` - "Bars"
- `@@demo.radialGaugeDemo.descriptionGBUsed` - "GB Used"

### Custom Widgets (Demo App) - 57 keys

#### Realtime Gauge Widget (21 keys)
- `@@demo.widgets.realtimeGauge.name` - "Realtime Gauge"
- `@@demo.widgets.realtimeGauge.description` - "Gauge with real-time data updates"
- `@@demo.widgets.realtimeGauge.dialog.title` - "Realtime Gauge Settings"
- `@@demo.widgets.realtimeGauge.dialog.visualSettings` - "Visual Settings"
- `@@demo.widgets.realtimeGauge.dialog.activeDisplay` - "Active Display"
- `@@demo.widgets.realtimeGauge.dialog.activeDisplayDescription` - "Display live gauge instead of passive icon"
- `@@demo.widgets.realtimeGauge.dialog.background` - "Background"
- `@@demo.widgets.realtimeGauge.dialog.backgroundDescription` - "Add a background color to the widget"
- `@@demo.widgets.realtimeGauge.dialog.showValueLabel` - "Show Value Label"
- `@@demo.widgets.realtimeGauge.dialog.showValueLabelDescription` - "Display numeric value in gauge center"
- `@@demo.widgets.realtimeGauge.dialog.showLabel` - "Show Label"
- `@@demo.widgets.realtimeGauge.dialog.showLabelDescription` - "Display a label in the top-right corner"
- `@@demo.widgets.realtimeGauge.dialog.labelText` - "Label Text"
- `@@demo.widgets.realtimeGauge.dialog.labelPlaceholder` - "e.g., kW, %, RPM"
- `@@demo.widgets.realtimeGauge.dialog.colorProfile` - "Color Profile"
- `@@demo.widgets.realtimeGauge.dialog.colorProfileDynamic` - "Dynamic (Theme Colors)"
- `@@demo.widgets.realtimeGauge.dialog.colorProfileStatic` - "Static (Performance Colors)"
- `@@demo.widgets.realtimeGauge.dialog.realtimeDataSettings` - "Real-time Data Settings"
- `@@demo.widgets.realtimeGauge.dialog.dataSource` - "Data Source"
- `@@demo.widgets.realtimeGauge.dialog.dataSourceNone` - "None (Static)"
- `@@demo.widgets.realtimeGauge.dialog.dataSourceRandom` - "Random"
- `@@demo.widgets.realtimeGauge.dialog.updateInterval` - "Update Interval: {updateInterval}s"
- `@@demo.widgets.realtimeGauge.dialog.secondsFormat` - "{value}s"

#### Sparkbar Widget (22 keys)
- `@@demo.widgets.sparkbar.name` - "Sparkbar"
- `@@demo.widgets.sparkbar.description` - "A sparkbar graph"
- `@@demo.widgets.sparkbar.dialog.title` - "Sparkbar Settings"
- `@@demo.widgets.sparkbar.dialog.connectRealtime` - "Connect to realtime data feed"
- `@@demo.widgets.sparkbar.dialog.frameRate` - "Frame Rate (FPS)"
- `@@demo.widgets.sparkbar.dialog.fps1` - "1 FPS (Very Slow)"
- `@@demo.widgets.sparkbar.dialog.fps5` - "5 FPS (Slow)"
- `@@demo.widgets.sparkbar.dialog.fps10` - "10 FPS (Moderate)"
- `@@demo.widgets.sparkbar.dialog.fps15` - "15 FPS (Smooth)"
- `@@demo.widgets.sparkbar.dialog.fps20` - "20 FPS (Default)"
- `@@demo.widgets.sparkbar.dialog.fps24` - "24 FPS (Fast)"
- `@@demo.widgets.sparkbar.dialog.fps30` - "30 FPS (Faster)"
- `@@demo.widgets.sparkbar.dialog.fps60` - "60 FPS (High Refresh)"
- `@@demo.widgets.sparkbar.dialog.numberOfBars` - "Number of Bars"
- `@@demo.widgets.sparkbar.dialog.bars5` - "5 bars (Default)"
- `@@demo.widgets.sparkbar.dialog.bars10` - "10 bars"
- `@@demo.widgets.sparkbar.dialog.bars15` - "15 bars"
- `@@demo.widgets.sparkbar.dialog.bars20` - "20 bars"
- `@@demo.widgets.sparkbar.dialog.bars25` - "25 bars"
- `@@demo.widgets.sparkbar.dialog.bars30` - "30 bars"
- `@@demo.widgets.sparkbar.dialog.bars50` - "50 bars"
- `@@demo.widgets.sparkbar.dialog.bars100` - "100 bars"
- `@@demo.widgets.sparkbar.dialog.responsiveBarColors` - "Responsive bar colors"
- `@@demo.widgets.sparkbar.dialog.showBackground` - "Show background"

#### Sparkline Widget (14 keys)
- `@@demo.widgets.sparkline.name` - "Sparkline"
- `@@demo.widgets.sparkline.description` - "A sparkline graph"
- `@@demo.widgets.sparkline.dialog.title` - "Sparkline Settings"
- `@@demo.widgets.sparkline.dialog.connectRealtime` - "Connect to realtime data feed"
- `@@demo.widgets.sparkline.dialog.frameRate` - "Frame Rate (FPS)"
- `@@demo.widgets.sparkline.dialog.fps1` - "1 FPS (Very Slow)"
- `@@demo.widgets.sparkline.dialog.fps5` - "5 FPS (Slow)"
- `@@demo.widgets.sparkline.dialog.fps10` - "10 FPS (Moderate)"
- `@@demo.widgets.sparkline.dialog.fps15` - "15 FPS (Smooth)"
- `@@demo.widgets.sparkline.dialog.fps20` - "20 FPS (Default)"
- `@@demo.widgets.sparkline.dialog.fps24` - "24 FPS (Fast)"
- `@@demo.widgets.sparkline.dialog.fps30` - "30 FPS (Faster)"
- `@@demo.widgets.sparkline.dialog.fps60` - "60 FPS (High Refresh)"
- `@@demo.widgets.sparkline.dialog.responsiveLineColors` - "Responsive line colors"
- `@@demo.widgets.sparkline.dialog.showBackground` - "Show background"

#### Temperature Widget (13 keys)
- `@@demo.widgets.temperature.name` - "Temperature"
- `@@demo.widgets.temperature.description` - "Display a temperature value"
- `@@demo.widgets.temperature.dialog.title` - "Temperature Settings"
- `@@demo.widgets.temperature.dialog.temperatureValue` - "Temperature Value (°C)"
- `@@demo.widgets.temperature.dialog.temperatureValuePlaceholder` - "Enter temperature"
- `@@demo.widgets.temperature.dialog.temperatureHint` - "Value stored in Celsius and converted for display"
- `@@demo.widgets.temperature.dialog.unit` - "Temperature Unit"
- `@@demo.widgets.temperature.dialog.unitCelsius` - "Celsius (°C)"
- `@@demo.widgets.temperature.dialog.unitFahrenheit` - "Fahrenheit (°F)"
- `@@demo.widgets.temperature.dialog.unitKelvin` - "Kelvin (K)"
- `@@demo.widgets.temperature.dialog.label` - "Label (optional)"
- `@@demo.widgets.temperature.dialog.labelPlaceholder` - "e.g., Room Temp, CPU"
- `@@demo.widgets.temperature.dialog.background` - "Background"
- `@@demo.widgets.temperature.dialog.backgroundDescription` - "Adds a background behind the temperature"

### Common Actions (3 keys)
- `@@demo.common.cancel` - "Cancel"
- `@@demo.common.save` - "Save"
- `@@demo.common.ok` - "OK"

### NGX Dashboard Widgets Library - 77 keys

#### Arrow Widget (10 keys)
- `@@ngx.dashboard.widgets.arrow.name` - "Arrow"
- `@@ngx.dashboard.widgets.arrow.description` - "A generic arrow"
- `@@ngx.dashboard.widgets.arrow.dialog.title` - "Arrow Settings"
- `@@ngx.dashboard.widgets.arrow.dialog.direction` - "Arrow Direction"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.up` - "Up"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.right` - "Right"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.down` - "Down"
- `@@ngx.dashboard.widgets.arrow.dialog.direction.left` - "Left"
- `@@ngx.dashboard.widgets.arrow.dialog.opacity` - "Opacity: {value}%"
- `@@ngx.dashboard.widgets.arrow.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.arrow.dialog.backgroundHint` - "Adds a background behind the arrow"

#### Clock Widget (14 keys)
- `@@ngx.dashboard.widgets.clock.name` - "Clock"
- `@@ngx.dashboard.widgets.clock.description` - "Displays current time"
- `@@ngx.dashboard.widgets.clock.dialog.title` - "Clock Settings"
- `@@ngx.dashboard.widgets.clock.dialog.displayMode` - "Display Mode"
- `@@ngx.dashboard.widgets.clock.dialog.mode.digital` - "Digital"
- `@@ngx.dashboard.widgets.clock.dialog.mode.analog` - "Analog"
- `@@ngx.dashboard.widgets.clock.dialog.showSeconds` - "Show Seconds"
- `@@ngx.dashboard.widgets.clock.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.clock.dialog.backgroundDescription` - "Add a background color to the widget"
- `@@ngx.dashboard.widgets.clock.dialog.timeFormat` - "Time Format"
- `@@ngx.dashboard.widgets.clock.dialog.format.24h` - "24-hour"
- `@@ngx.dashboard.widgets.clock.dialog.format.12h` - "12-hour (AM/PM)"
- `@@ngx.dashboard.widgets.clock.dialog.showSecondsDescription.digital` - "Display seconds in digital format"
- `@@ngx.dashboard.widgets.clock.dialog.showSecondsDescription.analog` - "Show second hand on analog clock"

#### Label Widget (33 keys)
- `@@ngx.dashboard.widgets.label.name` - "Label"
- `@@ngx.dashboard.widgets.label.description` - "Text label for dashboard"
- `@@ngx.dashboard.widgets.label.dialog.title` - "Label Settings"
- `@@ngx.dashboard.widgets.label.dialog.labelText` - "Label Text"
- `@@ngx.dashboard.widgets.label.dialog.placeholder` - "Enter label text..."
- `@@ngx.dashboard.widgets.label.dialog.responsive` - "Responsive"
- `@@ngx.dashboard.widgets.label.dialog.responsiveDescription` - "Automatically resize text to fit container"
- `@@ngx.dashboard.widgets.label.dialog.fontSize` - "Font Size"
- `@@ngx.dashboard.widgets.label.dialog.alignment` - "Text Alignment"
- `@@ngx.dashboard.widgets.label.dialog.alignment.left` - "Left"
- `@@ngx.dashboard.widgets.label.dialog.alignment.center` - "Center"
- `@@ngx.dashboard.widgets.label.dialog.alignment.right` - "Right"
- `@@ngx.dashboard.widgets.label.dialog.fontWeight` - "Font Weight"
- `@@ngx.dashboard.widgets.label.dialog.fontWeight.normal` - "Normal"
- `@@ngx.dashboard.widgets.label.dialog.fontWeight.bold` - "Bold"
- `@@ngx.dashboard.widgets.label.dialog.opacity` - "Opacity"
- `@@ngx.dashboard.widgets.label.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.label.dialog.backgroundDescription` - "Add a background color to the widget"
- `@@ngx.dashboard.widgets.label.dialog.templateStringPlaceholder` - "e.g., 'WWWWW' or leave empty"
- `@@ngx.dashboard.widgets.label.dialog.fontSizeLimits` - "Font Size Limits"
- `@@ngx.dashboard.widgets.label.dialog.minSize` - "Min Size"
- `@@ngx.dashboard.widgets.label.dialog.maxSize` - "Max Size"
- `@@ngx.dashboard.widgets.label.dialog.templateString` - "Template String"
- `@@ngx.dashboard.widgets.label.dialog.templateStringHint` - "Text for width calculation (optional)"
- `@@ngx.dashboard.widgets.label.dialog.minSizeError` - "Minimum font size is required"
- `@@ngx.dashboard.widgets.label.dialog.minSizeRangeError` - "Must be between 8 and 200"
- `@@ngx.dashboard.widgets.label.dialog.minSizeHint` - "Minimum font size in pixels"
- `@@ngx.dashboard.widgets.label.dialog.maxSizeError` - "Maximum font size is required"
- `@@ngx.dashboard.widgets.label.dialog.maxSizeRangeError` - "Must be between 8 and 200"
- `@@ngx.dashboard.widgets.label.dialog.maxSizeHint` - "Maximum font size in pixels"

#### Radial Gauge Widget (18 keys)
- `@@ngx.dashboard.widgets.radialGauge.name` - "Radial Gauge"
- `@@ngx.dashboard.widgets.radialGauge.description` - "Semi-circular gauge display"
- `@@ngx.dashboard.widgets.radialGauge.dialog.title` - "Radial Gauge Settings"
- `@@ngx.dashboard.widgets.radialGauge.dialog.value` - "Value"
- `@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile` - "Color Profile"
- `@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile.dynamic` - "Dynamic (Theme Colors)"
- `@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile.static` - "Static (Performance Colors)"
- `@@ngx.dashboard.widgets.radialGauge.dialog.activeDisplay` - "Active Display"
- `@@ngx.dashboard.widgets.radialGauge.dialog.activeDisplayDescription` - "Display live gauge instead of passive icon"
- `@@ngx.dashboard.widgets.radialGauge.dialog.background` - "Background"
- `@@ngx.dashboard.widgets.radialGauge.dialog.backgroundDescription` - "Add a background color to the widget"
- `@@ngx.dashboard.widgets.radialGauge.dialog.showValueLabel` - "Show Value Label"
- `@@ngx.dashboard.widgets.radialGauge.dialog.showValueLabelDescription` - "Display numeric value in gauge center"

#### Common Actions (2 keys)
- `@@ngx.dashboard.common.cancel` - "Cancel"
- `@@ngx.dashboard.common.save` - "Save"

### NGX Dashboard Core Library - 20 keys

#### Context Menu (3 keys)
- `@@ngx.dashboard.cell.menu.edit` - "Edit Widget"
- `@@ngx.dashboard.cell.menu.settings` - "Settings"
- `@@ngx.dashboard.cell.menu.delete` - "Delete"

#### Cell Settings Dialog (6 keys)
- `@@ngx.dashboard.cell.settings.title` - "Cell Display Settings"
- `@@ngx.dashboard.cell.settings.cellId` - "Cell ID: {id}"
- `@@ngx.dashboard.cell.settings.mode.normal` - "Normal"
- `@@ngx.dashboard.cell.settings.mode.normal.description` - "Standard cell display with full content visibility"
- `@@ngx.dashboard.cell.settings.mode.flat` - "Flat"
- `@@ngx.dashboard.cell.settings.mode.flat.description` - "Simplified display with reduced visual emphasis"

#### Common Actions (2 keys)
- `@@ngx.dashboard.common.cancel` - "Cancel"
- `@@ngx.dashboard.common.apply` - "Apply"

#### Widget List (2 keys)
- `@@ngx.dashboard.widget.list.available` - "Available widgets"
- `@@ngx.dashboard.widget.list.item.ariaLabel` - "{name} widget: {description}"

#### Cell Resize (1 key)
- `@@ngx.dashboard.cell.resize.dimensions` - "{width} × {height}"

#### Unknown Widget (2 keys)
- `@@ngx.dashboard.unknown.widget.name` - "Unknown Widget"
- `@@ngx.dashboard.unknown.widget.description` - "Fallback widget for unknown widget types"

## Usage

When including the demo application in a multi-locale build:

1. Run `ng extract-i18n` to extract all keys
2. The above keys will be included in your translation files (e.g., messages.xlf)
3. Provide translations for each key in your locale-specific translation files
4. Build your application with the desired locale

## Example Translation (Spanish)

```xml
<trans-unit id="demo.navigation.dashboard">
  <source>Dashboard</source>
  <target>Tablero</target>
</trans-unit>

<trans-unit id="demo.navigation.radialGaugeDemo">
  <source>Radial Gauge Demo</source>
  <target>Demo de Indicador Radial</target>
</trans-unit>

<trans-unit id="demo.navigation.colors">
  <source>Colors Overview</source>
  <target>Vista General de Colores</target>
</trans-unit>
```

## Notes

- Interpolations like `<x id="INTERPOLATION"/>` must be preserved in translations
- HTML entities like `&apos;` should be maintained
- Total count: **275 translation keys**
- Keys are namespaced to prevent conflicts:
  - `@@demo.*` - Demo application keys
  - `@@ngx.dashboard.*` - Core dashboard library keys
  - `@@ngx.dashboard.widgets.*` - Widget library keys