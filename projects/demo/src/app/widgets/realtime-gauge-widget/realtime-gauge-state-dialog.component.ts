import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { RealtimeGaugeWidgetState } from './realtime-gauge-widget.component';

@Component({
  selector: 'demo-realtime-gauge-state-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatSliderModule
],
  template: `
    <h2 mat-dialog-title i18n="@@demo.widgets.realtimeGauge.dialog.title">Realtime Gauge Settings</h2>
    <mat-dialog-content>
      <div class="settings-grid">
        <!-- Visual Settings Section -->
        <div class="settings-section">
          <h3 i18n="@@demo.widgets.realtimeGauge.dialog.visualSettings">Visual Settings</h3>

          <div class="toggle-section">
            <mat-slide-toggle [(ngModel)]="localState.active">
              <span i18n="@@demo.widgets.realtimeGauge.dialog.activeDisplay">Active Display</span>
            </mat-slide-toggle>
            <p class="toggle-description" i18n="@@demo.widgets.realtimeGauge.dialog.activeDisplayDescription">Display live gauge instead of passive icon</p>
          </div>

          <div class="toggle-section">
            <mat-slide-toggle [(ngModel)]="localState.hasBackground">
              <span i18n="@@demo.widgets.realtimeGauge.dialog.background">Background</span>
            </mat-slide-toggle>
            <p class="toggle-description" i18n="@@demo.widgets.realtimeGauge.dialog.backgroundDescription">Add a background color to the widget</p>
          </div>

          <div class="toggle-section">
            <mat-slide-toggle [(ngModel)]="localState.showValueLabel">
              <span i18n="@@demo.widgets.realtimeGauge.dialog.showValueLabel">Show Value Label</span>
            </mat-slide-toggle>
            <p class="toggle-description" i18n="@@demo.widgets.realtimeGauge.dialog.showValueLabelDescription">Display numeric value in gauge center</p>
          </div>

          <div class="toggle-section">
            <mat-slide-toggle [(ngModel)]="localState.showLabel">
              <span i18n="@@demo.widgets.realtimeGauge.dialog.showLabel">Show Label</span>
            </mat-slide-toggle>
            <p class="toggle-description" i18n="@@demo.widgets.realtimeGauge.dialog.showLabelDescription">Display a label in the top-right corner</p>
          </div>

          @if (localState.showLabel) {
          <mat-form-field>
            <mat-label i18n="@@demo.widgets.realtimeGauge.dialog.labelText">Label Text</mat-label>
            <input matInput [(ngModel)]="localState.label" placeholder="e.g., kW, %, RPM" i18n-placeholder="@@demo.widgets.realtimeGauge.dialog.labelPlaceholder">
          </mat-form-field>
          }

          <div class="section">
            <h4 i18n="@@demo.widgets.realtimeGauge.dialog.colorProfile">Color Profile</h4>
            <mat-radio-group [(ngModel)]="localState.colorProfile">
              <mat-radio-button value="dynamic" i18n="@@demo.widgets.realtimeGauge.dialog.colorProfileDynamic">Dynamic (Theme Colors)</mat-radio-button>
              <mat-radio-button value="static" i18n="@@demo.widgets.realtimeGauge.dialog.colorProfileStatic">Static (Performance Colors)</mat-radio-button>
            </mat-radio-group>
          </div>
        </div>

        <!-- Real-time Settings Section -->
        <div class="settings-section">
          <h3 i18n="@@demo.widgets.realtimeGauge.dialog.realtimeDataSettings">Real-time Data Settings</h3>

          <div class="section">
            <h4 i18n="@@demo.widgets.realtimeGauge.dialog.dataSource">Data Source</h4>
            <mat-radio-group [(ngModel)]="localState.datasource">
              <mat-radio-button value="none" i18n="@@demo.widgets.realtimeGauge.dialog.dataSourceNone">None (Static)</mat-radio-button>
              <mat-radio-button value="random" i18n="@@demo.widgets.realtimeGauge.dialog.dataSourceRandom">Random</mat-radio-button>
            </mat-radio-group>
          </div>

          @if (localState.datasource === 'random') {
          <div class="section">
            <h4 i18n="@@demo.widgets.realtimeGauge.dialog.updateInterval">Update Interval: {{ localState.updateInterval }}s</h4>
            <mat-slider
              min="1"
              max="10"
              step="1"
              discrete
              [displayWith]="formatSeconds"
            >
              <input matSliderThumb [(ngModel)]="localState.updateInterval" />
            </mat-slider>
          </div>
          }
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" i18n="@@demo.common.cancel">Cancel</button>
      <button mat-flat-button (click)="onSave()" i18n="@@demo.common.save">Save</button>
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

      mat-slider {
        width: 100%;
        margin-top: 0.5rem;
      }

      .settings-grid {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .settings-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--mat-sys-on-surface, #1f1f1f);
      }
    `,
  ],
})
export class RealtimeGaugeStateDialogComponent {
  private readonly data = inject<RealtimeGaugeWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RealtimeGaugeStateDialogComponent>);

  localState: RealtimeGaugeWidgetState = {
    colorProfile: this.data.colorProfile ?? 'dynamic',
    active: this.data.active ?? false,
    hasBackground: this.data.hasBackground ?? true,
    showValueLabel: this.data.showValueLabel ?? true,
    label: this.data.label ?? '',
    showLabel: this.data.showLabel ?? false,
    datasource: this.data.datasource ?? 'none',
    updateInterval: this.data.updateInterval ?? 1,
  };

  formatSeconds(value: number): string {
    return $localize`:@@demo.widgets.realtimeGauge.dialog.secondsFormat:${value}:INTERPOLATION:s`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.localState);
  }
}
