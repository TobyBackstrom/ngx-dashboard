// widget-list-grouping.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { WidgetListComponent } from '../widget-list.component';
import { DashboardBridgeService } from '../../services/dashboard-bridge.service';
import { DashboardService } from '../../services/dashboard.service';
import { Widget, WidgetComponentClass, WidgetMetadata } from '../../models';

function makeWidget(
  widgetTypeid: string,
  name: string,
  group?: string
): WidgetComponentClass {
  @Component({ standalone: true, template: '' })
  class TestWidgetComponent implements Widget {
    static metadata: WidgetMetadata = {
      widgetTypeid,
      name,
      description: `${name} description`,
      svgIcon: '<svg></svg>',
      group,
    };
  }

  return TestWidgetComponent as WidgetComponentClass;
}

describe('WidgetListComponent grouping', () => {
  let component: WidgetListComponent;
  let fixture: ComponentFixture<WidgetListComponent>;
  let dashboardService: DashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetListComponent],
      providers: [DashboardBridgeService, DashboardService],
    }).compileComponents();

    dashboardService = TestBed.inject(DashboardService);
    fixture = TestBed.createComponent(WidgetListComponent);
    component = fixture.componentInstance;
  });

  it('renders a single unlabelled group when no widget declares one', () => {
    dashboardService.registerWidgetType(makeWidget('@test/a', 'A'));
    dashboardService.registerWidgetType(makeWidget('@test/b', 'B'));

    const groups = component.widgetGroups();

    expect(groups.length).toBe(1);
    expect(groups[0].label).toBeUndefined();
    expect(groups[0].widgets.map((w) => w.widgetTypeid)).toEqual([
      '@test/a',
      '@test/b',
    ]);
  });

  it('buckets widgets sharing a group and keeps registration order within it', () => {
    dashboardService.registerWidgetType(makeWidget('@test/a', 'A', 'Metrics'));
    dashboardService.registerWidgetType(makeWidget('@test/b', 'B', 'Layout'));
    dashboardService.registerWidgetType(makeWidget('@test/c', 'C', 'Metrics'));

    const groups = component.widgetGroups();

    expect(groups.map((g) => g.label)).toEqual(['Metrics', 'Layout']);
    expect(groups[0].widgets.map((w) => w.widgetTypeid)).toEqual([
      '@test/a',
      '@test/c',
    ]);
    expect(groups[1].widgets.map((w) => w.widgetTypeid)).toEqual(['@test/b']);
  });

  it('places ungrouped widgets in a trailing unlabelled group', () => {
    dashboardService.registerWidgetType(makeWidget('@test/a', 'A'));
    dashboardService.registerWidgetType(makeWidget('@test/b', 'B', 'Metrics'));

    const groups = component.widgetGroups();

    expect(groups.map((g) => g.label)).toEqual(['Metrics', undefined]);
    expect(groups[1].widgets.map((w) => w.widgetTypeid)).toEqual(['@test/a']);
  });

  it('treats a blank group as no group', () => {
    dashboardService.registerWidgetType(makeWidget('@test/a', 'A', '   '));

    const groups = component.widgetGroups();

    expect(groups.length).toBe(1);
    expect(groups[0].label).toBeUndefined();
  });

  it('renders a heading per labelled group', () => {
    dashboardService.registerWidgetType(makeWidget('@test/a', 'A', 'Metrics'));
    dashboardService.registerWidgetType(makeWidget('@test/b', 'B', 'Layout'));
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.widget-group-label-text')
    ).map((el) => (el as HTMLElement).textContent?.trim());

    expect(labels).toEqual(['Metrics', 'Layout']);
    expect(
      fixture.nativeElement.querySelectorAll('.widget-list-item').length
    ).toBe(2);
  });
});
