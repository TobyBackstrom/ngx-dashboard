import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { CellDisplayData } from '../../models/cell-dialog';

@Component({
  selector: 'lib-cell-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>Cell Display Settings</h2>
    <mat-dialog-content>
      <p class="cell-info">Cell ID: <strong>{{ data.id }}</strong></p>
      
      <div class="radio-group">
        <mat-radio-group [(ngModel)]="selectedMode" name="displayMode">
          <mat-radio-button value="normal">
            <div class="radio-option">
              <div class="option-title">Normal</div>
              <div class="option-description">Standard cell display with full content visibility</div>
            </div>
          </mat-radio-button>
          
          <mat-radio-button value="flat">
            <div class="radio-option">
              <div class="option-title">Flat</div>
              <div class="option-description">Simplified display with reduced visual emphasis</div>
            </div>
          </mat-radio-button>
        </mat-radio-group>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button 
        mat-flat-button 
        (click)="save()"
        [disabled]="selectedMode === currentMode">
        Apply
      </button>
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

      .cell-info {
        margin: 0 0 1.5rem 0;
        padding-bottom: 1rem;
      }

      .radio-group {
        width: 100%;
      }

      mat-radio-group {
        display: block;
      }

      mat-radio-button {
        width: 100%;
        display: block;
        margin-bottom: 1rem;
      }

      mat-radio-button:last-child {
        margin-bottom: 0;
      }

      .radio-option {
        margin-left: 0.75rem;
        padding: 0.25rem 0;
      }

      .option-title {
        display: block;
        margin-bottom: 0.25rem;
      }

      .option-description {
        display: block;
      }
    `,
  ],
})
export class CellSettingsDialogComponent {
  selectedMode: 'normal' | 'flat';
  currentMode: 'normal' | 'flat';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CellDisplayData,
    private dialogRef: MatDialogRef<CellSettingsDialogComponent>
  ) {
    this.currentMode = data.flat ? 'flat' : 'normal';
    this.selectedMode = this.currentMode;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const newData: CellDisplayData = {
      ...this.data,
      flat: this.selectedMode === 'flat'
    };
    this.dialogRef.close(newData);
  }
}