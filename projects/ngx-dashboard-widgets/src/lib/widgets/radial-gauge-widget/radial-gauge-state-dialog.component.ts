import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { RadialGaugeWidgetState } from './radial-gauge-widget.component';

@Component({
  selector: 'lib-radial-gauge-state-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatRadioModule,
    FormsModule,
  ],
  template: `
    <h2
      mat-dialog-title
      i18n="@@ngx.dashboard.widgets.radialGauge.dialog.title"
    >
      Radial Gauge Settings
    </h2>
    <mat-dialog-content>
      <mat-form-field>
        <mat-label i18n="@@ngx.dashboard.widgets.radialGauge.dialog.value"
          >Value (0-100)</mat-label
        >
        <input
          matInput
          type="number"
          [(ngModel)]="localState.value"
          min="0"
          max="100"
        />
      </mat-form-field>

      <div class="section">
        <h4 i18n="@@ngx.dashboard.widgets.radialGauge.dialog.colorProfile">
          Color Profile
        </h4>
        <mat-radio-group [(ngModel)]="localState.colorProfile">
          <mat-radio-button
            value="dynamic"
            i18n="
              @@ngx.dashboard.widgets.radialGauge.dialog.colorProfile.dynamic"
            >Dynamic (Theme Colors)</mat-radio-button
          >
          <mat-radio-button
            value="static"
            i18n="
              @@ngx.dashboard.widgets.radialGauge.dialog.colorProfile.static"
            >Static (Performance Colors)</mat-radio-button
          >
        </mat-radio-group>
      </div>

      <div class="toggle-section">
        <mat-slide-toggle
          [(ngModel)]="localState.active"
          i18n="@@ngx.dashboard.widgets.radialGauge.dialog.activeDisplay"
        >
          Active Display
        </mat-slide-toggle>
        <p
          class="toggle-description"
          i18n="
            @@ngx.dashboard.widgets.radialGauge.dialog.activeDisplayDescription"
        >
          Display live gauge instead of passive icon
        </p>
      </div>

      <div class="toggle-section">
        <mat-slide-toggle
          [(ngModel)]="localState.hasBackground"
          i18n="@@ngx.dashboard.widgets.radialGauge.dialog.background"
        >
          Background
        </mat-slide-toggle>
        <p
          class="toggle-description"
          i18n="
            @@ngx.dashboard.widgets.radialGauge.dialog.backgroundDescription"
        >
          Add a background color to the widget
        </p>
      </div>

      <div class="toggle-section">
        <mat-slide-toggle
          [(ngModel)]="localState.showValueLabel"
          i18n="@@ngx.dashboard.widgets.radialGauge.dialog.showValueLabel"
        >
          Show Value Label
        </mat-slide-toggle>
        <p
          class="toggle-description"
          i18n="
            @@ngx.dashboard.widgets.radialGauge.dialog.showValueLabelDescription"
        >
          Display numeric value in gauge center
        </p>
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
        (click)="onSave()"
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

      .section {
        margin-bottom: 1.5rem;
      }

      .section h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--mat-sys-on-surface, #1f1f1f);
      }

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .toggle-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .toggle-description {
        margin: 0;
        flex: 1;
      }
    `,
  ],
})
export class RadialGaugeStateDialogComponent {
  private readonly data = inject<RadialGaugeWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<RadialGaugeStateDialogComponent>
  );

  localState: RadialGaugeWidgetState = {
    value: this.data.value ?? 50,
    colorProfile: this.data.colorProfile ?? 'dynamic',
    active: this.data.active ?? false,
    hasBackground: this.data.hasBackground ?? true,
    showValueLabel: this.data.showValueLabel ?? true,
  };

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.localState);
  }
}
