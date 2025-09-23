import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ThemeService, type ThemePalette } from './services';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatRadioModule,
  ],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Service injections
  themeService = inject(ThemeService);
  private router = inject(Router);

  protected title = $localize`:@@demo.app.title:Dashboard Demo and Component Tests`;

  /**
   * Get theme toggle aria label
   */
  getThemeToggleAriaLabel(): string {
    return this.themeService.isDarkMode()
      ? $localize`:@@demo.theme.switchToLight:Switch to light theme`
      : $localize`:@@demo.theme.switchToDark:Switch to dark theme`;
  }

  /**
   * Get theme selector aria label
   */
  getThemeSelectorAriaLabel(): string {
    return $localize`:@@demo.theme.selectTheme:Select theme`;
  }

  /**
   * Get theme option aria label
   */
  getThemeOptionAriaLabel(themeName: string): string {
    return $localize`:@@demo.theme.selectSpecific:Select ${themeName}:INTERPOLATION: theme`;
  }

  /**
   * Navigate to colors overview page
   */
  navigateToColors(): void {
    this.router.navigate(['/colors']);
  }

  /**
   * Navigate to dashboard page
   */
  navigateToDashboard(): void {
    this.router.navigate(['/']);
  }

  /**
   * Navigate to radial gauge demo page
   */
  navigateToRadialGaugeDemo(): void {
    this.router.navigate(['/radial-gauge-demo']);
  }

  /**
   * Toggle between light and dark theme
   */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  /**
   * Set the theme palette
   */
  setTheme(theme: ThemePalette): void {
    this.themeService.setTheme(theme);
  }
}
