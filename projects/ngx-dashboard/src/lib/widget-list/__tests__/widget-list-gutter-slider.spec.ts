// widget-list-gutter-slider.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { WidgetListComponent } from '../widget-list.component';
import { formatGutterSize, parseGutterSize } from '../gutter-size';
import { DashboardBridgeService } from '../../services/dashboard-bridge.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../../store/dashboard-store';
import { Widget, WidgetComponentClass, WidgetMetadata } from '../../models';

function makeWidget(widgetTypeid: string): WidgetComponentClass {
  @Component({ standalone: true, template: '' })
  class TestWidgetComponent implements Widget {
    static metadata: WidgetMetadata = {
      widgetTypeid,
      name: 'Test',
      description: 'A widget',
      svgIcon: '<svg></svg>',
    };
  }

  return TestWidgetComponent as WidgetComponentClass;
}

describe('gutter size parsing', () => {
  it('keeps the unit the dashboard authored', () => {
    expect(parseGutterSize('0.5em')).toEqual({ value: 0.5, unit: 'em' });
    expect(parseGutterSize('12px')).toEqual({ value: 12, unit: 'px' });
    expect(parseGutterSize('1.25rem')).toEqual({ value: 1.25, unit: 'rem' });
  });

  it('falls back to the store default for units the slider cannot drive', () => {
    for (const raw of ['2%', 'calc(1em + 2px)', '', 'auto', null]) {
      expect(parseGutterSize(raw)).toEqual({ value: 0.5, unit: 'em' });
    }
  });

  it('clamps to the top of the unit range', () => {
    expect(parseGutterSize('99em')).toEqual({ value: 3, unit: 'em' });
    expect(parseGutterSize('999px')).toEqual({ value: 48, unit: 'px' });
  });

  it('rounds away floating point noise from the slider steps', () => {
    expect(formatGutterSize({ value: 0.1 + 0.05, unit: 'em' })).toBe('0.15em');
    expect(formatGutterSize({ value: 8, unit: 'px' })).toBe('8px');
  });
});

describe('WidgetListComponent gutter slider', () => {
  let fixture: ComponentFixture<WidgetListComponent>;
  let component: WidgetListComponent;
  let bridge: DashboardBridgeService;
  let store: InstanceType<typeof DashboardStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetListComponent],
      providers: [DashboardBridgeService, DashboardService, DashboardStore],
    }).compileComponents();

    TestBed.inject(DashboardService).registerWidgetType(makeWidget('@test/a'));
    bridge = TestBed.inject(DashboardBridgeService);
    store = TestBed.inject(DashboardStore);

    fixture = TestBed.createComponent(WidgetListComponent);
    component = fixture.componentInstance;
  });

  function dock(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.gutter-dock');
  }

  /** Registers a dashboard so the bridge has something to drive. */
  function registerDashboard(gutterSize = '0.5em'): void {
    store.loadDashboard({
      version: '1.1.0',
      dashboardId: 'test-dashboard',
      rows: 8,
      columns: 16,
      gutterSize,
      cells: [],
    });
    bridge.registerDashboard(store);
  }

  it('is hidden unless enabled', () => {
    registerDashboard();
    fixture.componentRef.setInput('enableGutterSlider', false);
    fixture.detectChanges();

    expect(dock()).toBeNull();
  });

  it('is hidden until a dashboard registers: there is nothing to drive', () => {
    fixture.componentRef.setInput('enableGutterSlider', true);
    fixture.detectChanges();
    expect(dock()).toBeNull();

    registerDashboard();
    fixture.detectChanges();
    expect(dock()).not.toBeNull();
  });

  it('is hidden in the icon-only rail, which has no room for it', () => {
    registerDashboard();
    fixture.componentRef.setInput('enableGutterSlider', true);
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    expect(dock()).toBeNull();
  });

  it('takes its range and readout from the dashboard\'s own unit', () => {
    registerDashboard('12px');
    fixture.componentRef.setInput('enableGutterSlider', true);
    fixture.detectChanges();

    expect(component.gutterMax()).toBe(48);
    expect(component.gutterStep()).toBe(1);
    expect(component.gutterLabel()).toBe('12px');
  });

  it('writes slider input straight through to the dashboard', () => {
    registerDashboard('0.5em');
    fixture.componentRef.setInput('enableGutterSlider', true);
    fixture.detectChanges();

    component.onGutterInput(1.5);

    expect(store.gutterSize()).toBe('1.5em');
    expect(component.gutterLabel()).toBe('1.5em');
  });

  it('tracks a gutter changed elsewhere rather than holding its own copy', () => {
    registerDashboard('0.5em');
    fixture.componentRef.setInput('enableGutterSlider', true);
    fixture.detectChanges();

    store.setGridConfig({ gutterSize: '2rem' });

    expect(component.gutter()).toEqual({ value: 2, unit: 'rem' });
    expect(component.gutterMax()).toBe(3);
  });
});
