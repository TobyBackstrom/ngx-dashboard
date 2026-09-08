import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  output,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import {
  GridConfig,
  GridSizeLimits,
  GUTTER_SIZE_PRESETS,
} from '@dragonworks/ngx-dashboard';

/** One axis of the grid, used to drive both size fields from one handler. */
type GridAxis = 'rows' | 'columns';

/** Data handed to the grid settings dialog. */
export interface GridSettingsDialogData {
  /**
   * Live committed geometry. A signal rather than a snapshot because edits
   * apply as they are made and the dashboard clamps them — the fields must
   * show what was accepted, not what was asked for.
   */
  config: Signal<GridConfig>;
  /** Clamp-to-content floor — the smallest size that still fits every widget. */
  minSize: Signal<{ rows: number; columns: number }>;
  /** Ceiling in force on the dashboard. */
  limits: GridSizeLimits;
}

/**
 * Reference implementation of a host-owned grid geometry control.
 *
 * Every edit is applied to the dashboard straight away, so the grid reflows
 * behind the dialog and the result is visible while choosing it. Cancel (and
 * ESC, and a backdrop click) restores the geometry the dialog opened with;
 * OK accepts what is on screen.
 *
 * The dialog holds no pending state of its own: it displays the dashboard's
 * committed geometry and requests changes to it. Clamping is the library's
 * policy and is deliberately not duplicated here.
 */
@Component({
  selector: 'app-grid-settings-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
  ],
  template: `
    <h2 mat-dialog-title i18n="@@demo.dashboard.grid.title">Grid settings</h2>

    <mat-dialog-content>
      <div class="section">
        <div class="row-layout">
          <mat-form-field>
            <mat-label i18n="@@demo.dashboard.grid.columns">Columns</mat-label>
            <input
              #columnsInput
              matInput
              type="number"
              inputmode="numeric"
              [min]="minSize().columns"
              [max]="maxColumns()"
              [value]="config().columns"
              (change)="onSizeCommit('columns', columnsInput)"
            />
          </mat-form-field>

          <mat-form-field>
            <mat-label i18n="@@demo.dashboard.grid.rows">Rows</mat-label>
            <input
              #rowsInput
              matInput
              type="number"
              inputmode="numeric"
              [min]="minSize().rows"
              [max]="maxRows()"
              [value]="config().rows"
              (change)="onSizeCommit('rows', rowsInput)"
            />
          </mat-form-field>
        </div>

        <!-- The floor is stated rather than discovered: without it, entering a
             smaller number and being clamped back reads as a broken field. -->
        <p class="hint" i18n="@@demo.dashboard.grid.smallestFit">
          Smallest fit {{ minSize().columns }} × {{ minSize().rows }} — set by
          the widgets already placed
        </p>
      </div>

      <div class="section slider-section">
        <!-- Label and value read as one phrase, matching the widget dialogs'
             "Opacity: 50%" pattern. -->
        <label
          class="slider-label"
          for="grid-gap-slider"
          i18n="@@demo.dashboard.grid.gap"
        >
          Gap: {{ gutterLabel() }}
        </label>
        <!-- The slider's value is an index into the presets, so displayWith
             maps it back to the gutter it stands for; without it the smallest
             stop announces as "0" rather than the 0.25em it actually is.
             Not discrete: the value indicator bubble is sized for short
             numerals and clips a string like "0.25em", and the label above
             already shows the live value. -->
        <mat-slider
          min="0"
          [max]="presets.length - 1"
          step="1"
          showTickMarks
          [displayWith]="formatGutter"
        >
          <input
            id="grid-gap-slider"
            matSliderThumb
            i18n-aria-label="@@demo.dashboard.grid.gapAriaLabel"
            aria-label="Gap between grid cells"
            [value]="gutterIndex()"
            (valueChange)="onGutterCommit($event)"
          />
        </mat-slider>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" i18n="@@demo.common.cancel">Cancel</button>
      <button mat-flat-button (click)="onOk()" i18n="@@demo.common.ok">OK</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: block;
        overflow-y: auto;
        overflow-x: hidden;
        padding-top: 0.5rem;
      }

      .row-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .row-layout mat-form-field {
        width: 100%;
        display: block;
        margin-bottom: 0;
      }

      .section {
        margin-bottom: 1.5rem;
      }

      .section:last-child {
        margin-bottom: 0.5rem;
      }

      .hint {
        margin: 0;
      }

      .slider-label {
        display: block;
        margin-bottom: 0.5rem;
      }

      mat-slider {
        width: 100%;
        display: block;
      }
    `,
  ],
})
export class GridSettingsDialogComponent {
  protected readonly data = inject<GridSettingsDialogData>(MAT_DIALOG_DATA);
  readonly #dialogRef = inject(
    MatDialogRef<GridSettingsDialogComponent, boolean>
  );

  protected readonly presets = GUTTER_SIZE_PRESETS;
  protected readonly config = this.data.config;
  protected readonly minSize = this.data.minSize;

  /** Emitted on every edit so the host can apply it to the live dashboard. */
  configChange = output<GridConfig>();

  // A dashboard imported above the cap keeps its size, so the floor can exceed
  // the ceiling; the field's own max must not fall below its min.
  protected readonly maxRows = computed(() =>
    Math.max(this.data.limits.maxRows, this.minSize().rows)
  );
  protected readonly maxColumns = computed(() =>
    Math.max(this.data.limits.maxColumns, this.minSize().columns)
  );

  /**
   * Slider position for the current gutter, or -1 when the dashboard was
   * loaded with a value outside the preset scale. A custom value is left
   * untouched until the user actually moves the slider.
   */
  protected readonly gutterIndex = computed(() =>
    this.presets.indexOf(
      this.config().gutterSize as (typeof GUTTER_SIZE_PRESETS)[number]
    )
  );

  protected readonly gutterLabel = computed(() => {
    const gutterSize = this.config().gutterSize;
    return this.gutterIndex() === -1
      ? $localize`:@@demo.dashboard.grid.gapCustom:Custom (${gutterSize}:value:)`
      : gutterSize;
  });

  /**
   * Label for a slider position. Bound as a field rather than a method so it
   * keeps its `this` when Material calls it.
   */
  protected readonly formatGutter = (index: number): string =>
    this.presets[index] ?? '';

  protected onSizeCommit(axis: GridAxis, input: HTMLInputElement): void {
    const requested = Math.floor(Number(input.value));
    this.configChange.emit({
      ...this.config(),
      [axis]: Number.isFinite(requested) ? requested : this.config()[axis],
    });
    // Show what the dashboard accepted. When it refuses the request outright
    // the committed value is unchanged, so the [value] binding does not
    // re-write the field and it would otherwise keep the rejected number.
    input.value = String(this.config()[axis]);
  }

  protected onGutterCommit(index: number): void {
    const preset = this.presets[index];
    if (preset && preset !== this.config().gutterSize) {
      this.configChange.emit({ ...this.config(), gutterSize: preset });
    }
  }

  /** Cancel, like ESC and a backdrop click, leaves the host to revert. */
  protected onCancel(): void {
    this.#dialogRef.close(false);
  }

  protected onOk(): void {
    this.#dialogRef.close(true);
  }
}
