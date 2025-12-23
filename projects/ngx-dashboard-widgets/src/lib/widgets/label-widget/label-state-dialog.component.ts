import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // Add this import
import { LabelWidgetState } from './label-widget.component';

@Component({
  selector: 'lib-label-state-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule
],
  template: `
    <h2 mat-dialog-title i18n="@@ngx.dashboard.widgets.label.dialog.title">
      Label Settings
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="label-text-field">
        <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.labelText"
          >Label Text</mat-label
        >
        <input
          matInput
          type="text"
          [value]="label()"
          (input)="label.set($any($event.target).value)"
          i18n-placeholder="@@ngx.dashboard.widgets.label.dialog.placeholder"
          placeholder="Enter your label text..."
        />
      </mat-form-field>

      <!-- Responsive Text Toggle -->
      <div class="toggle-section">
        <mat-slide-toggle
          [checked]="responsive()"
          (change)="responsive.set($event.checked)"
          i18n="@@ngx.dashboard.widgets.label.dialog.responsive"
        >
          Responsive Text
        </mat-slide-toggle>
        <span
          class="toggle-description"
          i18n="@@ngx.dashboard.widgets.label.dialog.responsiveDescription"
          >Automatically adjust text size to fit the widget</span
        >
      </div>

      <!-- Responsive Font Size Constraints (only shown when responsive is enabled) -->
      @if (responsive()) {
      <div class="responsive-section">
        <div
          class="section-label"
          i18n="@@ngx.dashboard.widgets.label.dialog.fontSizeLimits"
        >
          Font Size Limits
        </div>
        <div class="row-layout">
          <mat-form-field appearance="outline">
            <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.minSize"
              >Min Size (px)</mat-label
            >
            <input
              matInput
              type="number"
              [value]="minFontSize()"
              (input)="
                validateAndCorrectMinFontSize(+$any($event.target).value)
              "
              (blur)="validateAndCorrectMinFontSize(minFontSize())"
              min="8"
              max="24"
              placeholder="8"
            />
            @if (!isMinFontSizeValid() || !isFontSizeRangeValid()) {
            <mat-error>
              @if (!isMinFontSizeValid()) {
              <span i18n="@@ngx.dashboard.widgets.label.dialog.minSizeError"
                >Must be between 8-24px</span
              >
              } @else {
              <span
                i18n="@@ngx.dashboard.widgets.label.dialog.minSizeRangeError"
                >Must be less than max size</span
              >
              }
            </mat-error>
            } @else {
            <mat-hint i18n="@@ngx.dashboard.widgets.label.dialog.minSizeHint"
              >8-24px range</mat-hint
            >
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.maxSize"
              >Max Size (px)</mat-label
            >
            <input
              matInput
              type="number"
              [value]="maxFontSize()"
              (input)="
                validateAndCorrectMaxFontSize(+$any($event.target).value)
              "
              (blur)="validateAndCorrectMaxFontSize(maxFontSize())"
              min="16"
              max="128"
              placeholder="64"
            />
            @if (!isMaxFontSizeValid() || !isFontSizeRangeValid()) {
            <mat-error>
              @if (!isMaxFontSizeValid()) {
              <span i18n="@@ngx.dashboard.widgets.label.dialog.maxSizeError"
                >Must be between 16-128px</span
              >
              } @else {
              <span
                i18n="@@ngx.dashboard.widgets.label.dialog.maxSizeRangeError"
                >Must be greater than min size</span
              >
              }
            </mat-error>
            } @else {
            <mat-hint i18n="@@ngx.dashboard.widgets.label.dialog.maxSizeHint"
              >16-128px range</mat-hint
            >
            }
          </mat-form-field>
        </div>

        <!-- Template String field -->
        <mat-form-field appearance="outline">
          <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.templateString"
            >Template String</mat-label
          >
          <input
            matInput
            type="text"
            [value]="templateString() || ''"
            (input)="templateString.set($any($event.target).value || undefined)"
            i18n-placeholder="@@ngx.dashboard.widgets.label.dialog.templateStringPlaceholder"
            placeholder="Optional: Text to use for size calculation"
          />
          <mat-hint i18n="@@ngx.dashboard.widgets.label.dialog.templateStringHint"
            >Use when displayed text varies but size should remain consistent</mat-hint
          >
        </mat-form-field>
      </div>
      }

      <div class="row-layout">
        <mat-form-field appearance="outline">
          <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.fontSize"
            >Font Size (px)</mat-label
          >
          <input
            matInput
            type="number"
            [value]="fontSize()"
            (input)="fontSize.set(+$any($event.target).value)"
            [disabled]="responsive()"
            min="8"
            max="48"
            placeholder="16"
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.alignment"
            >Alignment</mat-label
          >
          <mat-select
            [value]="alignment()"
            (selectionChange)="alignment.set($any($event.value))"
          >
            <mat-option
              value="left"
              i18n="@@ngx.dashboard.widgets.label.dialog.alignment.left"
              >Left</mat-option
            >
            <mat-option
              value="center"
              i18n="@@ngx.dashboard.widgets.label.dialog.alignment.center"
              >Center</mat-option
            >
            <mat-option
              value="right"
              i18n="@@ngx.dashboard.widgets.label.dialog.alignment.right"
              >Right</mat-option
            >
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label i18n="@@ngx.dashboard.widgets.label.dialog.fontWeight"
          >Font Weight</mat-label
        >
        <mat-select
          [value]="fontWeight()"
          (selectionChange)="fontWeight.set($any($event.value))"
        >
          <mat-option
            value="normal"
            i18n="@@ngx.dashboard.widgets.label.dialog.fontWeight.normal"
            >Normal</mat-option
          >
          <mat-option
            value="bold"
            i18n="@@ngx.dashboard.widgets.label.dialog.fontWeight.bold"
            >Bold</mat-option
          >
        </mat-select>
      </mat-form-field>

      <!-- Opacity Slider -->
      <div class="slider-section">
        <div
          class="slider-label"
          i18n="@@ngx.dashboard.widgets.label.dialog.opacity"
        >
          Opacity: {{ formatOpacity(opacity()) }}%
        </div>
        <mat-slider [min]="0.1" [max]="1" [step]="0.1">
          <input matSliderThumb [(ngModel)]="opacity" />
        </mat-slider>
      </div>

      <!-- Background Toggle -->
      <div class="toggle-section">
        <mat-slide-toggle
          [checked]="!transparentBackground()"
          (change)="onBackgroundToggle($event.checked)"
          i18n="@@ngx.dashboard.widgets.label.dialog.background"
        >
          Background
        </mat-slide-toggle>
        <span
          class="toggle-description"
          i18n="@@ngx.dashboard.widgets.label.dialog.backgroundDescription"
          >Adds a background behind the text</span
        >
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-button
        (click)="onCancel()"
        i18n="@@ngx.dashboard.common.cancel"
      >
        Cancel
      </button>
      <button
        mat-flat-button
        (click)="save()"
        [disabled]="!hasChanged() || !isFormValid()"
        i18n="@@ngx.dashboard.common.save"
      >
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: block;
        overflow-y: auto;
        overflow-x: hidden;
      }

      mat-form-field {
        width: 100%;
        display: block;
        margin-bottom: 1rem;
      }

      .label-text-field {
        margin-top: 1rem;
      }

      /* Side-by-side layout for font size and alignment */
      .row-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .row-layout mat-form-field {
        margin-bottom: 0;
      }

      /* Opacity slider section */
      .slider-section {
        margin-bottom: 1.5rem;
        margin-right: 1rem;
      }

      .slider-label {
        display: block;
        margin-bottom: 0.5rem;
      }

      mat-slider {
        width: 100%;
        display: block;
      }

      /* Toggle section */
      .toggle-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .toggle-description {
        margin: 0;
      }

      /* Responsive font size section */
      .responsive-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        border-radius: 12px;
        background-color: var(
          --mat-app-surface-variant,
          rgba(var(--mat-app-on-surface-rgb, 0, 0, 0), 0.05)
        );
        border: 1px solid
          var(
            --mat-app-outline-variant,
            rgba(var(--mat-app-on-surface-rgb, 0, 0, 0), 0.12)
          );
      }

      .section-label {
        display: block;
        margin-bottom: 0.75rem;
        font-weight: 500;
        color: var(
          --mat-app-on-surface-variant,
          rgba(var(--mat-app-on-surface-rgb, 0, 0, 0), 0.6)
        );
      }

      /* Ensure responsive section row layout has no bottom margin */
      .responsive-section .row-layout {
        margin-bottom: 0;
      }
    `,
  ],
})
export class LabelStateDialogComponent {
  private readonly data = inject<LabelWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<LabelStateDialogComponent>);

  // State signals
  readonly label = signal<string>(this.data.label ?? '');
  readonly fontSize = signal<number>(this.data.fontSize ?? 16);
  readonly alignment = signal<'left' | 'center' | 'right'>(
    this.data.alignment ?? 'center'
  );
  readonly fontWeight = signal<'normal' | 'bold'>(
    this.data.fontWeight ?? 'normal'
  );
  readonly opacity = signal<number>(this.data.opacity ?? 1);
  readonly hasBackground = signal<boolean>(this.data.hasBackground ?? true);
  readonly transparentBackground = signal<boolean>(
    !(this.data.hasBackground ?? true)
  );
  readonly responsive = signal<boolean>(this.data.responsive ?? false);
  // Responsive font size constraints
  readonly minFontSize = signal<number>(this.data.minFontSize ?? 8);
  readonly maxFontSize = signal<number>(this.data.maxFontSize ?? 64);
  readonly templateString = signal<string | undefined>(this.data.templateString);

  // Store original values for comparison
  private readonly originalLabel = this.data.label ?? '';
  private readonly originalFontSize = this.data.fontSize ?? 16;
  private readonly originalAlignment = this.data.alignment ?? 'center';
  private readonly originalFontWeight = this.data.fontWeight ?? 'normal';
  private readonly originalOpacity = this.data.opacity ?? 1;
  private readonly originalHasBackground = this.data.hasBackground ?? true;
  private readonly originalResponsive = this.data.responsive ?? false;
  private readonly originalMinFontSize = this.data.minFontSize ?? 8;
  private readonly originalMaxFontSize = this.data.maxFontSize ?? 64;
  private readonly originalTemplateString = this.data.templateString;

  // Validation computed properties
  readonly isMinFontSizeValid = computed(() => {
    const min = this.minFontSize();
    return min >= 8 && min <= 24;
  });

  readonly isMaxFontSizeValid = computed(() => {
    const max = this.maxFontSize();
    return max >= 16 && max <= 128;
  });

  readonly isFontSizeRangeValid = computed(
    () => this.minFontSize() < this.maxFontSize()
  );

  readonly isFormValid = computed(
    () =>
      this.isMinFontSizeValid() &&
      this.isMaxFontSizeValid() &&
      this.isFontSizeRangeValid()
  );

  // Computed values
  readonly hasChanged = computed(
    () =>
      this.label() !== this.originalLabel ||
      this.fontSize() !== this.originalFontSize ||
      this.alignment() !== this.originalAlignment ||
      this.fontWeight() !== this.originalFontWeight ||
      this.opacity() !== this.originalOpacity ||
      this.hasBackground() !== this.originalHasBackground ||
      this.responsive() !== this.originalResponsive ||
      this.minFontSize() !== this.originalMinFontSize ||
      this.maxFontSize() !== this.originalMaxFontSize ||
      this.templateString() !== this.originalTemplateString
  );

  formatOpacity(value: number): number {
    return Math.round(value * 100);
  }

  formatOpacitySlider = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  // Validation methods with robust min < max enforcement
  validateAndCorrectMinFontSize(value: number): void {
    // Clamp to valid range
    const corrected = Math.max(8, Math.min(24, value));
    this.minFontSize.set(corrected);

    // Ensure min < max with adequate gap
    if (corrected >= this.maxFontSize()) {
      const newMax = Math.min(128, corrected + 8); // Ensure at least 8px gap
      this.maxFontSize.set(newMax);
    }
  }

  validateAndCorrectMaxFontSize(value: number): void {
    // Clamp to valid range
    const corrected = Math.max(16, Math.min(128, value));
    this.maxFontSize.set(corrected);

    // Ensure min < max with adequate gap
    if (corrected <= this.minFontSize()) {
      const newMin = Math.max(8, corrected - 8); // Ensure at least 8px gap
      this.minFontSize.set(newMin);
    }
  }

  onBackgroundToggle(hasWhiteBackground: boolean): void {
    this.hasBackground.set(hasWhiteBackground);
    this.transparentBackground.set(!hasWhiteBackground);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const state: LabelWidgetState = {
      label: this.label(),
      fontSize: this.fontSize(),
      alignment: this.alignment(),
      fontWeight: this.fontWeight(),
      opacity: this.opacity(),
      hasBackground: this.hasBackground(),
      responsive: this.responsive(),
      minFontSize: this.minFontSize(),
      maxFontSize: this.maxFontSize(),
    };

    // Only include templateString if it has a value
    const templateString = this.templateString();
    if (templateString) {
      state.templateString = templateString;
    }

    this.dialogRef.close(state);
  }
}
