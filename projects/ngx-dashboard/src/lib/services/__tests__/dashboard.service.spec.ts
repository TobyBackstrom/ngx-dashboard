import { TestBed } from '@angular/core/testing';
import { Injectable, signal } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import {
  WidgetComponentClass,
  WidgetSharedStateProvider,
} from '../../models';

interface TestConfig {
  theme: string;
  fontSize: number;
}

@Injectable({ providedIn: 'root' })
class TestSharedState implements WidgetSharedStateProvider<TestConfig> {
  private readonly state = signal<TestConfig>({
    theme: 'default',
    fontSize: 12,
  });

  readonly config = this.state.asReadonly();

  getSharedState(): TestConfig {
    return this.state();
  }

  setSharedState(state: TestConfig): void {
    this.state.set(state);
  }
}

class TestWidgetComponent {
  static metadata = {
    widgetTypeid: 'test-lazy-widget',
    name: 'Test Lazy Widget',
    description: 'Widget registered after loadDashboard',
    svgIcon: '<svg></svg>',
  };
}

describe('DashboardService - shared state restoration with late registration', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardService);
  });

  it('applies shared state when provider is registered BEFORE restore (baseline)', () => {
    TestBed.runInInjectionContext(() => {
      service.registerWidgetType(
        TestWidgetComponent as unknown as WidgetComponentClass,
        TestSharedState
      );
    });

    const statesMap = new Map<string, unknown>([
      ['test-lazy-widget', { theme: 'dark', fontSize: 24 }],
    ]);
    service.restoreSharedStates(statesMap);

    const provider = service.getSharedStateProvider(
      'test-lazy-widget'
    ) as TestSharedState;
    expect(provider.getSharedState()).toEqual({ theme: 'dark', fontSize: 24 });
  });

  it('later restoreSharedStates call overwrites an earlier buffered value for an unregistered type', () => {
    // First load buffers one value
    service.restoreSharedStates(
      new Map<string, unknown>([
        ['test-lazy-widget', { theme: 'dark', fontSize: 24 }],
      ])
    );

    // Second load buffers a different value before the widget ever registers
    service.restoreSharedStates(
      new Map<string, unknown>([
        ['test-lazy-widget', { theme: 'light', fontSize: 16 }],
      ])
    );

    TestBed.runInInjectionContext(() => {
      service.registerWidgetType(
        TestWidgetComponent as unknown as WidgetComponentClass,
        TestSharedState
      );
    });

    const provider = service.getSharedStateProvider(
      'test-lazy-widget'
    ) as TestSharedState;
    expect(provider.getSharedState()).toEqual({ theme: 'light', fontSize: 16 });
  });

  it('applies shared state when provider is registered AFTER restore (lazy-loaded module)', () => {
    // Simulate loadDashboard happening before the lazy module registers its widget type
    const statesMap = new Map<string, unknown>([
      ['test-lazy-widget', { theme: 'dark', fontSize: 24 }],
    ]);
    service.restoreSharedStates(statesMap);

    // Later, the lazy module loads and registers the widget + provider
    TestBed.runInInjectionContext(() => {
      service.registerWidgetType(
        TestWidgetComponent as unknown as WidgetComponentClass,
        TestSharedState
      );
    });

    const provider = service.getSharedStateProvider(
      'test-lazy-widget'
    ) as TestSharedState;
    expect(provider.getSharedState()).toEqual({ theme: 'dark', fontSize: 24 });
  });
});
