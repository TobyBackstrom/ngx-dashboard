import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  effect,
  OnInit,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ThemeService } from '../../services';

interface ColorInfo {
  name: string;
  value: string;
}

@Component({
  selector: 'app-colors',
  imports: [
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorsComponent implements OnInit {
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  protected readonly displayedColumns = ['name', 'value', 'preview'];
  protected readonly colors = signal<ColorInfo[]>([]);

  private readonly colorVars = [
    '--mat-sys-primary',
    '--mat-sys-on-primary',
    '--mat-sys-primary-container',
    '--mat-sys-on-primary-container',
    '--mat-sys-secondary',
    '--mat-sys-on-secondary',
    '--mat-sys-secondary-container',
    '--mat-sys-on-secondary-container',
    '--mat-sys-tertiary',
    '--mat-sys-on-tertiary',
    '--mat-sys-tertiary-container',
    '--mat-sys-on-tertiary-container',
    '--mat-sys-error',
    '--mat-sys-on-error',
    '--mat-sys-error-container',
    '--mat-sys-on-error-container',
    '--mat-sys-outline',
    '--mat-sys-outline-variant',
    '--mat-sys-surface',
    '--mat-sys-on-surface',
    '--mat-sys-surface-variant',
    '--mat-sys-on-surface-variant',
    '--mat-sys-inverse-surface',
    '--mat-sys-inverse-on-surface',
    '--mat-sys-inverse-primary',
    '--mat-sys-shadow',
    '--mat-sys-surface-tint',
    '--mat-sys-surface-bright',
    '--mat-sys-surface-dim',
    '--mat-sys-surface-container',
    '--mat-sys-surface-container-low',
    '--mat-sys-surface-container-lowest',
    '--mat-sys-surface-container-high',
    '--mat-sys-surface-container-highest',
  ];

  constructor() {
    // React to theme and dark mode changes
    effect(() => {
      // Trigger color extraction when theme or dark mode changes
      this.themeService.theme();
      this.themeService.mode();

      // Use queueMicrotask to ensure DOM has updated
      queueMicrotask(() => this.extractColors());
    });
  }

  ngOnInit(): void {
    this.extractColors();
  }

  private extractColors(): void {
    const computedStyles = getComputedStyle(this.document.documentElement);

    const colorData: ColorInfo[] = this.colorVars
      .map((varName) => ({
        name: varName,
        value: computedStyles.getPropertyValue(varName).trim(),
      }))
      .filter((color) => color.value !== ''); // Filter out undefined colors

    this.colors.set(colorData);
  }
}
