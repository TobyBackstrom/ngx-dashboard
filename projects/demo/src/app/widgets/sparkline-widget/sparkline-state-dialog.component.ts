import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { SparklineWidgetState } from './sparkline-widget.component';

@Component({
  selector: 'demo-sparkline-state-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Sparkline Settings</h2>
    <mat-dialog-content>
      <div class="settings-form">
        <div class="setting-item">
          <mat-slide-toggle
            [(ngModel)]="formState().realtime"
            (ngModelChange)="updateRealtime($event)"
          >
            Connect to realtime data feed
          </mat-slide-toggle>
        </div>

        <div class="setting-item">
          <mat-form-field appearance="outline">
            <mat-label>Frame Rate (FPS)</mat-label>
            <mat-select
              [(ngModel)]="formState().frameRate"
              (ngModelChange)="updateFrameRate($event)"
              [disabled]="!formState().realtime"
            >
              <mat-option [value]="1">1 FPS (Very Slow)</mat-option>
              <mat-option [value]="5">5 FPS (Slow)</mat-option>
              <mat-option [value]="10">10 FPS (Moderate)</mat-option>
              <mat-option [value]="15">15 FPS (Smooth)</mat-option>
              <mat-option [value]="20">20 FPS (Default)</mat-option>
              <mat-option [value]="24">24 FPS (Fast)</mat-option>
              <mat-option [value]="30">30 FPS (Faster)</mat-option>
              <mat-option [value]="60">60 FPS (High Refresh)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="setting-item">
          <mat-slide-toggle
            [(ngModel)]="formState().responsiveLineColors"
            (ngModelChange)="updateResponsiveLineColors($event)"
          >
            Responsive line colors
          </mat-slide-toggle>
        </div>

        <div class="setting-item">
          <mat-slide-toggle
            [(ngModel)]="formState().hasBackground"
            (ngModelChange)="updateBackground($event)"
          >
            Show background
          </mat-slide-toggle>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: block;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 100px;
      }

      .settings-form {
        display: block;
        margin: 1rem 0;
      }

      .setting-item {
        margin: 1rem 0;
        display: block;
      }

      .setting-item:first-child {
        margin-top: 0;
      }

      .setting-item:last-child {
        margin-bottom: 0;
      }
    `,
  ],
})
export class SparklineStateDialogComponent {
  private readonly data = inject<SparklineWidgetState>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<SparklineStateDialogComponent>
  );

  readonly formState = signal<SparklineWidgetState>({
    hasBackground: this.data.hasBackground ?? true,
    realtime: this.data.realtime ?? false,
    frameRate: this.data.frameRate ?? 20,
    responsiveLineColors: this.data.responsiveLineColors ?? true,
  });

  updateRealtime(value: boolean): void {
    this.formState.update((state) => ({ ...state, realtime: value }));
  }

  updateBackground(value: boolean): void {
    this.formState.update((state) => ({ ...state, hasBackground: value }));
  }

  updateFrameRate(value: number): void {
    this.formState.update((state) => ({ ...state, frameRate: value }));
  }

  updateResponsiveLineColors(value: boolean): void {
    this.formState.update((state) => ({
      ...state,
      responsiveLineColors: value,
    }));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close(this.formState());
  }
}
