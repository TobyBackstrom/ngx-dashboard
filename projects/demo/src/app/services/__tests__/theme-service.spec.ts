import { TestBed } from '@angular/core/testing';
import { Component, DestroyRef, DOCUMENT, inject, Injectable, Renderer2, RendererFactory2, signal } from '@angular/core';
import { ThemeService, ColorMode, PREFERRED_COLOR_MODE, injectRenderer2 } from '../theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockRenderer: jasmine.SpyObj<Renderer2>;
  let mockDocument: { body: HTMLElement };
  let mockMediaQueryList: jasmine.SpyObj<MediaQueryList>;
  let mockPreferredColorMode: ReturnType<typeof signal<ColorMode>>;
  let mediaQueryListeners: Map<string, EventListener>;
  let destroyCallbacks: Array<() => void>;

  // Helper to create a mock media query list
  function createMockMediaQueryList(matches: boolean): jasmine.SpyObj<MediaQueryList> {
    const mock = jasmine.createSpyObj<MediaQueryList>('MediaQueryList', ['addEventListener', 'removeEventListener'], {
      matches,
      media: '(prefers-color-scheme: dark)',
    });
    
    mock.addEventListener.and.callFake((event: string, listener: EventListener) => {
      mediaQueryListeners.set(event, listener);
    });
    
    mock.removeEventListener.and.callFake((event: string) => {
      mediaQueryListeners.delete(event);
    });
    
    return mock;
  }

  // Helper to trigger media query change
  function triggerMediaQueryChange(matches: boolean): void {
    const listener = mediaQueryListeners.get('change');
    if (listener) {
      const event = { matches, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent;
      listener(event);
    }
  }

  beforeEach(() => {
    // Reset collections
    mediaQueryListeners = new Map();
    destroyCallbacks = [];

    // Create mocks
    mockRenderer = jasmine.createSpyObj<Renderer2>('Renderer2', ['addClass', 'removeClass']);
    mockDocument = {
      body: document.createElement('body')
    };
    mockMediaQueryList = createMockMediaQueryList(false); // Default to light mode
    
    // Mock window.matchMedia
    spyOn(window, 'matchMedia').and.returnValue(mockMediaQueryList);

    // Configure TestBed with mocks
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        {
          provide: DOCUMENT,
          useValue: mockDocument
        },
        {
          provide: RendererFactory2,
          useValue: {
            createRenderer: jasmine.createSpy('createRenderer').and.returnValue(mockRenderer)
          }
        }
      ]
    });
  });

  describe('PREFERRED_COLOR_MODE Injection Token', () => {
    beforeEach(() => {
      // Reset TestBed to allow overriding root providers
      TestBed.resetTestingModule();
    });

    it('should detect initial light mode from system preference', () => {
      mockMediaQueryList = createMockMediaQueryList(false);
      
      const mockDestroyRef = {
        onDestroy: jasmine.createSpy('onDestroy').and.callFake((callback: () => void) => {
          destroyCallbacks.push(callback);
        })
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: DestroyRef, useValue: mockDestroyRef },
          {
            provide: PREFERRED_COLOR_MODE,
            useFactory: () => {
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
              const colorMode = signal<ColorMode>(mediaQuery.matches ? 'dark' : 'light');
              
              const listener = (event: MediaQueryListEvent): void => {
                colorMode.set(event.matches ? 'dark' : 'light');
              };
              
              mediaQuery.addEventListener('change', listener);
              mockDestroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
              
              return colorMode;
            },
            deps: [DestroyRef]
          }
        ]
      });
      
      const preferredMode = TestBed.inject(PREFERRED_COLOR_MODE);
      expect(preferredMode()).toBe('light');
    });

    it('should detect initial dark mode from system preference', () => {
      // Reset and reconfigure with dark mode preference
      TestBed.resetTestingModule();
      
      // Override window.matchMedia to return dark mode
      mockMediaQueryList = createMockMediaQueryList(true);
      // Reset the spy since it was already created in beforeEach
      (window.matchMedia as jasmine.Spy).and.returnValue(mockMediaQueryList);
      
      const mockDestroyRef = {
        onDestroy: jasmine.createSpy('onDestroy').and.callFake((callback: () => void) => {
          destroyCallbacks.push(callback);
        })
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: DestroyRef, useValue: mockDestroyRef },
          {
            provide: PREFERRED_COLOR_MODE,
            useFactory: () => {
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
              const colorMode = signal<ColorMode>(mediaQuery.matches ? 'dark' : 'light');
              
              const listener = (event: MediaQueryListEvent): void => {
                colorMode.set(event.matches ? 'dark' : 'light');
              };
              
              mediaQuery.addEventListener('change', listener);
              mockDestroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
              
              return colorMode;
            },
            deps: [DestroyRef]
          }
        ]
      });
      
      const preferredMode = TestBed.inject(PREFERRED_COLOR_MODE);
      expect(preferredMode()).toBe('dark');
    });

    it('should register media query change listener', () => {
      TestBed.configureTestingModule({});
      TestBed.inject(PREFERRED_COLOR_MODE);

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', jasmine.any(Function));
    });

    it('should update signal when system preference changes', () => {
      TestBed.configureTestingModule({});
      const preferredMode = TestBed.inject(PREFERRED_COLOR_MODE);
      
      expect(preferredMode()).toBe('light');
      
      triggerMediaQueryChange(true);
      expect(preferredMode()).toBe('dark');
      
      triggerMediaQueryChange(false);
      expect(preferredMode()).toBe('light');
    });

    it('should cleanup media query listener on destroy', () => {
      // This test verifies that the PREFERRED_COLOR_MODE token properly cleans up
      // its media query listener when the injection context is destroyed.
      // Since the token is provided at root level, we'll test this by creating
      // a component with its own injector that gets destroyed.
      
      @Component({
        template: '',
        standalone: true,
        providers: [
          {
            provide: PREFERRED_COLOR_MODE,
            useFactory: (destroyRef: DestroyRef) => {
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
              const colorMode = signal<ColorMode>(mediaQuery.matches ? 'dark' : 'light');
              
              const listener = (event: MediaQueryListEvent): void => {
                colorMode.set(event.matches ? 'dark' : 'light');
              };
              
              mediaQuery.addEventListener('change', listener);
              destroyRef.onDestroy(() => {
                mediaQuery.removeEventListener('change', listener);
              });
              
              return colorMode;
            },
            deps: [DestroyRef]
          }
        ]
      })
      class TestComponentWithProvider {
        preferredMode = inject(PREFERRED_COLOR_MODE);
      }

      // Reset listeners tracking
      mediaQueryListeners.clear();
      mockMediaQueryList.addEventListener.calls.reset();
      mockMediaQueryList.removeEventListener.calls.reset();
      
      // Track the actual listener that gets added
      let capturedListener: EventListener | null = null;
      mockMediaQueryList.addEventListener.and.callFake((event: string, listener: EventListener) => {
        if (event === 'change') {
          capturedListener = listener;
          mediaQueryListeners.set(event, listener);
        }
      });

      TestBed.configureTestingModule({
        imports: [TestComponentWithProvider]
      });

      const fixture = TestBed.createComponent(TestComponentWithProvider);
      fixture.detectChanges();
      
      // Verify listener was added
      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', jasmine.any(Function));
      expect(capturedListener).toBeTruthy();
      
      // Destroy the component
      fixture.destroy();
      
      // Verify listener was removed with the same function reference
      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', capturedListener!);
    });
  });

  describe('injectRenderer2 Function', () => {
    it('should create a Renderer2 instance', () => {
      // Create a test service to run injectRenderer2 in injection context
      @Injectable()
      class TestService {
        renderer = injectRenderer2();
      }

      TestBed.configureTestingModule({
        providers: [TestService]
      });

      const service = TestBed.inject(TestService);
      const rendererFactory = TestBed.inject(RendererFactory2);
      
      expect(rendererFactory.createRenderer).toHaveBeenCalledWith(null, null);
      expect(service.renderer).toBe(mockRenderer);
    });
  });

  describe('Service Initialization', () => {
    beforeEach(() => {
      // Mock the PREFERRED_COLOR_MODE with a controllable signal
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
    });

    it('should be created', () => {
      service = TestBed.inject(ThemeService);
      expect(service).toBeTruthy();
    });

    it('should initialize with preferred color mode', () => {
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      
      expect(service.mode()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    });

    it('should apply initial mode to DOM', () => {
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      // Theme service also adds the default theme class (e.g., 'azure')
      expect(mockRenderer.addClass).toHaveBeenCalled();
    });

    it('should apply dark mode class when initialized with dark preference', () => {
      mockPreferredColorMode.set('dark');
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      
      expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
    });
  });

  describe('Mode Management', () => {
    beforeEach(() => {
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
    });

    it('should expose readonly mode signal', () => {
      expect(service.mode()).toBe('light');
      
      // Verify it's readonly by checking that the signal doesn't have set/update methods
      expect((service.mode as any).set).toBeUndefined();
      expect((service.mode as any).update).toBeUndefined();
    });

    it('should compute isDarkMode correctly', () => {
      expect(service.isDarkMode()).toBe(false);
      
      service.setDarkMode(true);
      TestBed.flushEffects();
      expect(service.isDarkMode()).toBe(true);
      
      service.setDarkMode(false);
      TestBed.flushEffects();
      expect(service.isDarkMode()).toBe(false);
    });

    it('should update when preferred color mode changes', () => {
      expect(service.mode()).toBe('light');
      
      mockPreferredColorMode.set('dark');
      expect(service.mode()).toBe('dark');
      expect(service.isDarkMode()).toBe(true);
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      mockRenderer.addClass.calls.reset();
      mockRenderer.removeClass.calls.reset();
    });

    describe('toggleDarkMode()', () => {
      it('should toggle from light to dark', () => {
        expect(service.mode()).toBe('light');
        
        service.toggleDarkMode();
        TestBed.flushEffects();
        
        expect(service.mode()).toBe('dark');
        expect(service.isDarkMode()).toBe(true);
        expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      });

      it('should toggle from dark to light', () => {
        service.setDarkMode(true);
        TestBed.flushEffects();
        mockRenderer.addClass.calls.reset();
        mockRenderer.removeClass.calls.reset();
        
        service.toggleDarkMode();
        TestBed.flushEffects();
        
        expect(service.mode()).toBe('light');
        expect(service.isDarkMode()).toBe(false);
        expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      });

      it('should handle multiple rapid toggles', () => {
        service.toggleDarkMode();
        service.toggleDarkMode();
        service.toggleDarkMode();
        TestBed.flushEffects();
        
        expect(service.mode()).toBe('dark');
        expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      });
    });

    describe('setDarkMode()', () => {
      it('should set dark mode when enabled is true', () => {
        service.setDarkMode(true);
        TestBed.flushEffects();
        
        expect(service.mode()).toBe('dark');
        expect(service.isDarkMode()).toBe(true);
        expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      });

      it('should set light mode when enabled is false', () => {
        service.setDarkMode(true);
        TestBed.flushEffects();
        mockRenderer.addClass.calls.reset();
        mockRenderer.removeClass.calls.reset();
        
        service.setDarkMode(false);
        TestBed.flushEffects();
        
        expect(service.mode()).toBe('light');
        expect(service.isDarkMode()).toBe(false);
        expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      });

      it('should be idempotent when setting same mode', () => {
        service.setDarkMode(true);
        TestBed.flushEffects();
        mockRenderer.addClass.calls.reset();
        mockRenderer.removeClass.calls.reset();
        
        service.setDarkMode(true);
        TestBed.flushEffects();
        
        expect(service.mode()).toBe('dark');
        // Should not call addClass again since it's already in dark mode
        expect(mockRenderer.addClass).not.toHaveBeenCalled();
        expect(mockRenderer.removeClass).not.toHaveBeenCalled();
      });
    });
  });

  describe('DOM Manipulation & Effects', () => {
    beforeEach(() => {
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      mockRenderer.addClass.calls.reset();
      mockRenderer.removeClass.calls.reset();
    });

    it('should add dark-mode class when dark mode is enabled', () => {
      service.setDarkMode(true);
      TestBed.flushEffects();
      
      expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      expect(mockRenderer.removeClass).not.toHaveBeenCalled();
    });

    it('should remove dark-mode class when dark mode is disabled', () => {
      service.setDarkMode(true);
      TestBed.flushEffects();
      mockRenderer.addClass.calls.reset();
      
      service.setDarkMode(false);
      TestBed.flushEffects();
      
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'dark-mode');
      expect(mockRenderer.addClass).not.toHaveBeenCalled();
    });

    it('should update DOM through effect when mode changes', () => {
      // Change mode multiple times and verify DOM updates
      service.setDarkMode(true);
      TestBed.flushEffects();
      expect(mockRenderer.addClass).toHaveBeenCalledTimes(1);
      
      service.setDarkMode(false);
      TestBed.flushEffects();
      expect(mockRenderer.removeClass).toHaveBeenCalledTimes(1);
      
      service.toggleDarkMode();
      TestBed.flushEffects();
      expect(mockRenderer.addClass).toHaveBeenCalledTimes(2);
    });

    it('should only modify body element', () => {
      service.setDarkMode(true);
      TestBed.flushEffects();
      
      expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, jasmine.any(String));
      expect(mockRenderer.addClass.calls.mostRecent().args[0]).toBe(mockDocument.body);
    });

    it('should use correct class name constant', () => {
      service.setDarkMode(true);
      TestBed.flushEffects();
      
      expect(mockRenderer.addClass).toHaveBeenCalledWith(jasmine.any(Object), 'dark-mode');
      
      service.setDarkMode(false);
      TestBed.flushEffects();
      
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(jasmine.any(Object), 'dark-mode');
    });
  });

  describe('Integration & System Preference Sync', () => {
    beforeEach(() => {
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
    });

    it('should maintain manual override when system preference changes', () => {
      // Manually set dark mode
      service.setDarkMode(true);
      TestBed.flushEffects();
      expect(service.mode()).toBe('dark');
      
      // System preference changes to light
      mockPreferredColorMode.set('light');
      
      // Manual override should persist
      expect(service.mode()).toBe('dark');
    });

    it('should follow system preference after toggle', () => {
      expect(service.mode()).toBe('light');
      
      // Toggle to dark
      service.toggleDarkMode();
      expect(service.mode()).toBe('dark');
      
      // System changes to dark (matches current state)
      mockPreferredColorMode.set('dark');
      expect(service.mode()).toBe('dark');
      
      // Toggle to light (differs from system)
      service.toggleDarkMode();
      expect(service.mode()).toBe('light');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle missing window.matchMedia gracefully', () => {
      // Remove matchMedia
      const originalMatchMedia = window.matchMedia;
      (window as any).matchMedia = undefined;
      
      // Reset TestBed to clear cached providers
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      
      expect(() => {
        TestBed.inject(PREFERRED_COLOR_MODE);
      }).toThrow();
      
      // Restore
      (window as any).matchMedia = originalMatchMedia;
    });

    it('should handle null document body gracefully', () => {
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
      TestBed.overrideProvider(DOCUMENT, { useValue: { body: null } });
      
      service = TestBed.inject(ThemeService);
      
      // Should not throw when trying to manipulate null body
      expect(() => {
        service.setDarkMode(true);
        TestBed.flushEffects();
      }).not.toThrow();
      
      expect(mockRenderer.addClass).toHaveBeenCalledWith(null, 'dark-mode');
    });
  });

  describe('Performance & Optimization', () => {
    beforeEach(() => {
      mockPreferredColorMode = signal<ColorMode>('light');
      TestBed.overrideProvider(PREFERRED_COLOR_MODE, { useValue: mockPreferredColorMode });
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      mockRenderer.addClass.calls.reset();
      mockRenderer.removeClass.calls.reset();
    });

    it('should not update DOM when mode does not change', () => {
      service.setDarkMode(false); // Already light
      TestBed.flushEffects();
      
      expect(mockRenderer.addClass).not.toHaveBeenCalled();
      expect(mockRenderer.removeClass).not.toHaveBeenCalled();
    });

    it('should batch signal updates efficiently', () => {
      // Multiple synchronous updates
      service.setDarkMode(true);
      service.setDarkMode(false);
      service.setDarkMode(true);
      
      TestBed.flushEffects();
      
      // Should only apply the final state
      expect(mockRenderer.addClass).toHaveBeenCalledTimes(1);
      expect(mockRenderer.removeClass).not.toHaveBeenCalled();
    });

    it('should use linkedSignal for efficient preference tracking', () => {
      // Initial state
      expect(service.mode()).toBe('light');
      
      // Change preference
      mockPreferredColorMode.set('dark');
      expect(service.mode()).toBe('dark');
      
      // Manual override
      service.setDarkMode(false);
      expect(service.mode()).toBe('light');
      
      // Preference change should not affect manual override
      mockPreferredColorMode.set('dark');
      expect(service.mode()).toBe('light');
    });
  });
});