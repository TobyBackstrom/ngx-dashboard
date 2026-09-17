import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../../services/dashboard.service';
import { UnknownWidgetComponent } from '../../../internal-widgets/unknown-widget/unknown-widget.component';
import { Widget } from '../../../models';
import {
  UNKNOWN_WIDGET_CONTEXT,
  UnknownWidgetContext,
} from '../unknown-widget.context';
import {
  UNKNOWN_WIDGET_RESOLVER,
  UnknownWidgetResolver,
} from '../unknown-widget.resolver';

@Component({
  selector: 'lib-test-no-permission',
  template: `<span class="no-permission">{{ context.widgetTypeid }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NoPermissionComponent {
  readonly context = inject(UNKNOWN_WIDGET_CONTEXT);
}

@Component({
  selector: 'lib-test-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly viewContainerRef = inject(ViewContainerRef);
}

@Component({
  selector: 'lib-test-scoped-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: UNKNOWN_WIDGET_RESOLVER,
      useValue: (() => NoPermissionComponent) as UnknownWidgetResolver,
    },
  ],
})
class ScopedHostComponent {
  readonly viewContainerRef = inject(ViewContainerRef);
}

@Injectable({ providedIn: 'root' })
class PermissionService {
  readonly gated = new Set<string>(['gated-widget']);
}

/** Configure a resolver (or the library default) and render one gated cell. */
function createFallbackWidget(
  resolver?: UnknownWidgetResolver,
  state?: unknown
) {
  TestBed.configureTestingModule({
    providers: resolver
      ? [{ provide: UNKNOWN_WIDGET_RESOLVER, useValue: resolver }]
      : [],
  });

  const fixture = TestBed.createComponent(HostComponent);

  return TestBed.inject(DashboardService)
    .getFactory('gated-widget')
    .createInstance(fixture.componentInstance.viewContainerRef, state);
}

describe('UNKNOWN_WIDGET_RESOLVER', () => {
  it('renders the library error view by default', () => {
    const ref = createFallbackWidget();

    expect(ref.instance).toBeInstanceOf(UnknownWidgetComponent);
  });

  it('renders the component returned by a custom resolver', () => {
    const ref = createFallbackWidget(() => NoPermissionComponent);

    expect(ref.instance).toBeInstanceOf(NoPermissionComponent);
  });

  it('provides the context to the resolved component', () => {
    const ref = createFallbackWidget(() => NoPermissionComponent, {
      value: 42,
    });

    expect((ref.instance as NoPermissionComponent).context).toEqual({
      reason: 'unregistered',
      widgetTypeid: 'gated-widget',
      widgetState: { value: 42 },
    });
  });

  it('passes the context to the resolver so it can branch on it', () => {
    const seen: UnknownWidgetContext[] = [];

    createFallbackWidget((context) => {
      seen.push(context);
      return NoPermissionComponent;
    }, { value: 1 });

    expect(seen).toEqual([
      {
        reason: 'unregistered',
        widgetTypeid: 'gated-widget',
        widgetState: { value: 1 },
      },
    ]);
  });

  it('runs the resolver in an injection context', () => {
    const ref = createFallbackWidget((context) =>
      inject(PermissionService).gated.has(context.widgetTypeid)
        ? NoPermissionComponent
        : null
    );

    expect(ref.instance).toBeInstanceOf(NoPermissionComponent);
  });

  it('falls back to the library error view when the resolver returns null', () => {
    const ref = createFallbackWidget(() => null);

    expect(ref.instance).toBeInstanceOf(UnknownWidgetComponent);
  });

  it('falls back to the library error view when the resolver throws', () => {
    const consoleSpy = spyOn(console, 'error');

    const ref = createFallbackWidget(() => {
      throw new Error('resolver boom');
    });

    expect(ref.instance).toBeInstanceOf(UnknownWidgetComponent);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('keeps the sentinel metadata so healing and export still see an unresolved cell', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UNKNOWN_WIDGET_RESOLVER,
          useValue: (() => NoPermissionComponent) as UnknownWidgetResolver,
        },
      ],
    });

    const factory = TestBed.inject(DashboardService).getFactory('gated-widget');

    expect(factory.widgetTypeid).toBe(
      UnknownWidgetComponent.metadata.widgetTypeid
    );
  });

  it('lets a single dashboard override the resolver through its own injector', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(ScopedHostComponent);

    const ref = TestBed.inject(DashboardService)
      .getFactory('gated-widget')
      .createInstance(fixture.componentInstance.viewContainerRef);

    // The application-wide DashboardService still resolves the page-scoped
    // provider, because the lookup goes through the cell's injector.
    expect(ref.instance).toBeInstanceOf(NoPermissionComponent);
  });

  it('warns once per type that no resolver answered for', () => {
    const consoleSpy = spyOn(console, 'warn');
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostComponent);
    const service = TestBed.inject(DashboardService);
    const container = fixture.componentInstance.viewContainerRef;

    service.getFactory('gated-widget').createInstance(container);
    service.getFactory('gated-widget').createInstance(container);
    service.getFactory('other-widget').createInstance(container);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('stays quiet when the app answers with its own error view', () => {
    const consoleSpy = spyOn(console, 'warn');

    createFallbackWidget(() => NoPermissionComponent);

    // A widget type withheld on purpose is not a fault to report.
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('does not round trip state through the error view', () => {
    const ref = createFallbackWidget(undefined, { value: 42 });

    // No dashboardGetState() => CellComponent exports the cell's stored state
    // unchanged, so a gated widget survives a load/save round trip.
    expect((ref.instance as Widget).dashboardGetState).toBeUndefined();
  });
});
