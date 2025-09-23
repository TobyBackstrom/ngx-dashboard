import {
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  InjectionToken,
  linkedSignal,
  Renderer2,
  RendererFactory2,
  signal,
  Signal,
} from '@angular/core';

export type ColorMode = 'light' | 'dark';
export type ThemePalette =
  | 'custom'
  | 'red'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'cyan'
  | 'magenta'
  | 'orange'
  | 'chartreuse'
  | 'spring_green'
  | 'azure'
  | 'violet'
  | 'rose';

export interface ThemeConfig {
  readonly key: ThemePalette;
  readonly displayName: string;
  readonly cssClass: string;
  readonly cssVariable: string; // CSS Custom Property for the swatch color
}

export const PREFERRED_COLOR_MODE = new InjectionToken<Signal<ColorMode>>(
  'PREFERRED_COLOR_MODE',
  {
    providedIn: 'root',
    factory: () => {
      const destroyRef = inject(DestroyRef);
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const colorMode = signal<ColorMode>(
        mediaQuery.matches ? 'dark' : 'light'
      );

      const preferredColorModeChangeListener = (
        event: MediaQueryListEvent
      ): void => {
        colorMode.set(event.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', preferredColorModeChangeListener);

      destroyRef.onDestroy(() =>
        mediaQuery.removeEventListener(
          'change',
          preferredColorModeChangeListener
        )
      );

      return colorMode;
    },
  }
);

// Renderer2 cannot be directly injected into singleton service
export const injectRenderer2 = (): Renderer2 =>
  inject(RendererFactory2).createRenderer(null, null);

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly DARK_MODE_CLASS = 'dark-mode';

  private readonly THEMES: readonly ThemeConfig[] = [
    {
      key: 'custom',
      displayName: $localize`:@@demo.theme.custom:Custom`,
      cssClass: '',
      cssVariable: '--theme-palette-custom',
    },
    {
      key: 'red',
      displayName: $localize`:@@demo.theme.red:Red`,
      cssClass: 'theme-red',
      cssVariable: '--theme-palette-red',
    },
    {
      key: 'green',
      displayName: $localize`:@@demo.theme.green:Green`,
      cssClass: 'theme-green',
      cssVariable: '--theme-palette-green',
    },
    {
      key: 'blue',
      displayName: $localize`:@@demo.theme.blue:Blue`,
      cssClass: 'theme-blue',
      cssVariable: '--theme-palette-blue',
    },
    {
      key: 'yellow',
      displayName: $localize`:@@demo.theme.yellow:Yellow`,
      cssClass: 'theme-yellow',
      cssVariable: '--theme-palette-yellow',
    },
    {
      key: 'cyan',
      displayName: $localize`:@@demo.theme.cyan:Cyan`,
      cssClass: 'theme-cyan',
      cssVariable: '--theme-palette-cyan',
    },
    {
      key: 'magenta',
      displayName: $localize`:@@demo.theme.magenta:Magenta`,
      cssClass: 'theme-magenta',
      cssVariable: '--theme-palette-magenta',
    },
    {
      key: 'orange',
      displayName: $localize`:@@demo.theme.orange:Orange`,
      cssClass: 'theme-orange',
      cssVariable: '--theme-palette-orange',
    },
    {
      key: 'chartreuse',
      displayName: $localize`:@@demo.theme.chartreuse:Chartreuse`,
      cssClass: 'theme-chartreuse',
      cssVariable: '--theme-palette-chartreuse',
    },
    {
      key: 'spring_green',
      displayName: $localize`:@@demo.theme.springGreen:Spring Green`,
      cssClass: 'theme-spring-green',
      cssVariable: '--theme-palette-spring-green',
    },
    {
      key: 'azure',
      displayName: $localize`:@@demo.theme.azure:Azure`,
      cssClass: 'theme-azure',
      cssVariable: '--theme-palette-azure',
    },
    {
      key: 'violet',
      displayName: $localize`:@@demo.theme.violet:Violet`,
      cssClass: 'theme-violet',
      cssVariable: '--theme-palette-violet',
    },
    {
      key: 'rose',
      displayName: $localize`:@@demo.theme.rose:Rose`,
      cssClass: 'theme-rose',
      cssVariable: '--theme-palette-rose',
    },
  ] as const;

  readonly availableThemes = computed(() => this.THEMES);
  readonly themeConfigMap = computed(
    () => new Map(this.THEMES.map((theme) => [theme.key, theme]))
  );

  private readonly _renderer = injectRenderer2();
  private readonly _document = inject(DOCUMENT);
  private readonly _preferredColorMode = inject(PREFERRED_COLOR_MODE);

  private readonly _mode = linkedSignal(() => this._preferredColorMode());
  readonly mode = this._mode.asReadonly();
  readonly isDarkMode = computed(() => this.mode() === 'dark');

  private readonly _theme = signal<ThemePalette>('azure');
  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      this._applyDarkModeClass(this.isDarkMode());
    });

    effect(() => {
      this._applyThemeClass(this.theme());
    });
  }

  toggleDarkMode(): void {
    this._mode.update((mode) => (mode === 'light' ? 'dark' : 'light'));
  }

  setDarkMode(enabled: boolean): void {
    this._mode.set(enabled ? 'dark' : 'light');
  }

  setTheme(theme: ThemePalette): void {
    this._theme.set(theme);
  }

  getThemeDisplayName = computed(() => (theme: ThemePalette): string => {
    return this.themeConfigMap().get(theme)?.displayName ?? theme;
  });

  private _applyDarkModeClass(enabled: boolean): void {
    if (enabled) {
      this._renderer.addClass(this._document.body, this.DARK_MODE_CLASS);
    } else {
      this._renderer.removeClass(this._document.body, this.DARK_MODE_CLASS);
    }
  }

  private _applyThemeClass(theme: ThemePalette): void {
    const htmlElement = this._document.documentElement;

    // Remove all theme classes
    this.THEMES.forEach((themeConfig) => {
      if (themeConfig.cssClass) {
        this._renderer.removeClass(htmlElement, themeConfig.cssClass);
      }
    });

    // Add the selected theme class
    const themeConfig = this.themeConfigMap().get(theme);
    if (themeConfig?.cssClass) {
      this._renderer.addClass(htmlElement, themeConfig.cssClass);
    }
  }
}
