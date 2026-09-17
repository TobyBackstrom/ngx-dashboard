import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NGX_DASHBOARD_VERSION } from '@dragonworks/ngx-dashboard';
import { NGX_DASHBOARD_WIDGETS_VERSION } from '@dragonworks/ngx-dashboard-widgets';
import { ThemeService, type ThemePalette } from './services';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
  ],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Service injections
  themeService = inject(ThemeService);

  protected title = $localize`:@@demo.app.title:Dashboard Demo`;

  // Library versions
  protected readonly dashboardVersion = NGX_DASHBOARD_VERSION;
  protected readonly widgetsVersion = NGX_DASHBOARD_WIDGETS_VERSION;

  /**
   * Get theme toggle aria label
   */
  getThemeToggleAriaLabel(): string {
    return this.themeService.isDarkMode()
      ? $localize`:@@demo.theme.switchToLight:Switch to light theme`
      : $localize`:@@demo.theme.switchToDark:Switch to dark theme`;
  }

  /**
   * Get navigation menu aria label
   */
  getNavigationMenuAriaLabel(): string {
    return $localize`:@@demo.navigation.menuAriaLabel:Open navigation menu`;
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
   * Get GitHub link aria label
   */
  getGitHubLinkAriaLabel(): string {
    return $localize`:@@demo.github.viewOnGitHub:View source code on GitHub`;
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
