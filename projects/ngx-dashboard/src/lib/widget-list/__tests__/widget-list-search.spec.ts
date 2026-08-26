// widget-list-search.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { WidgetListComponent } from '../widget-list.component';
import { DashboardBridgeService } from '../../services/dashboard-bridge.service';
import { DashboardService } from '../../services/dashboard.service';
import { Widget, WidgetComponentClass, WidgetMetadata } from '../../models';

function makeWidget(
  widgetTypeid: string,
  name: string,
  description: string,
  group?: string
): WidgetComponentClass {
  @Component({ standalone: true, template: '' })
  class TestWidgetComponent implements Widget {
    static metadata: WidgetMetadata = {
      widgetTypeid,
      name,
      description,
      svgIcon: '<svg></svg>',
      group,
    };
  }

  return TestWidgetComponent as WidgetComponentClass;
}

/** Widgets a user can actually see: collapsed panels keep theirs inert. */
function visibleItems(
  fixture: ComponentFixture<WidgetListComponent>
): HTMLElement[] {
  return (
    Array.from(
      fixture.nativeElement.querySelectorAll('.widget-list-item')
    ) as HTMLElement[]
  ).filter((el) => !el.closest('[inert]'));
}

describe('WidgetListComponent search', () => {
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

    dashboardService.registerWidgetType(
      makeWidget('@test/gauge', 'Radial Gauge', 'Shows a value on a dial')
    );
    dashboardService.registerWidgetType(
      makeWidget('@test/label', 'Label', 'Static caption text', 'Basics')
    );
    dashboardService.registerWidgetType(
      makeWidget('@test/arrow', 'Arrow', 'Points somewhere', 'Basics')
    );
  });

  function typeSearch(term: string): void {
    const input = fixture.nativeElement.querySelector(
      '.widget-search input'
    ) as HTMLInputElement;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('lists every widget when the search box is empty', () => {
    fixture.detectChanges();

    expect(component.isFiltering()).toBe(false);
    expect(visibleItems(fixture).length).toBe(3);
  });

  it('keeps only widgets whose name contains the term', () => {
    component.searchTerm.set('gau');

    expect(component.widgets().map((w) => w.widgetTypeid)).toEqual([
      '@test/gauge',
    ]);
  });

  it('matches the description', () => {
    component.searchTerm.set('caption');

    expect(component.widgets().map((w) => w.widgetTypeid)).toEqual([
      '@test/label',
    ]);
  });

  it('matches the widget type id', () => {
    component.searchTerm.set('@test/arrow');

    expect(component.widgets().map((w) => w.widgetTypeid)).toEqual([
      '@test/arrow',
    ]);
  });

  it('ignores case and surrounding whitespace', () => {
    component.searchTerm.set('  RADIAL  ');

    expect(component.widgets().map((w) => w.widgetTypeid)).toEqual([
      '@test/gauge',
    ]);
    expect(component.isFiltering()).toBe(true);
  });

  it('drops groups left without a match', () => {
    component.searchTerm.set('label');

    expect(component.widgetGroups().map((g) => g.label)).toEqual(['Basics']);
    expect(component.widgetGroups()[0].widgets.map((w) => w.name)).toEqual([
      'Label',
    ]);
  });

  it('renders matches from the input and an empty state when nothing matches', () => {
    fixture.detectChanges();

    typeSearch('arrow');
    expect(visibleItems(fixture).length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.widget-search-empty')
    ).toBeNull();

    typeSearch('nothing here');
    expect(visibleItems(fixture).length).toBe(0);
    expect(
      fixture.nativeElement.querySelector('.widget-search-empty')
    ).not.toBeNull();
  });

  it('shows matches inside a group the user had collapsed, then restores it', () => {
    fixture.detectChanges();

    component.toggleGroup('Basics');
    fixture.detectChanges();
    expect(visibleItems(fixture).length).toBe(1); // the ungrouped gauge

    typeSearch('label');
    expect(component.isGroupExpanded('Basics')).toBe(true);
    expect(visibleItems(fixture).length).toBe(1);
    expect(visibleItems(fixture)[0].textContent).toContain('Label');

    typeSearch('');
    expect(component.isGroupExpanded('Basics')).toBe(false);
  });

  it('clears the filter from the clear button', () => {
    fixture.detectChanges();
    typeSearch('label');

    const clear = fixture.nativeElement.querySelector(
      '.widget-search-clear'
    ) as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    expect(component.searchTerm()).toBe('');
    expect(visibleItems(fixture).length).toBe(3);
  });

  it('drops the search box when disabled, and stops filtering with it', () => {
    component.searchTerm.set('label');
    fixture.componentRef.setInput('enableSearchBox', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.widget-search')).toBeNull();
    expect(component.isFiltering()).toBe(false);
    expect(visibleItems(fixture).length).toBe(3);
  });

  it('restores the term when the search box is enabled again', () => {
    component.searchTerm.set('label');
    fixture.componentRef.setInput('enableSearchBox', false);
    fixture.detectChanges();

    fixture.componentRef.setInput('enableSearchBox', true);
    fixture.detectChanges();

    expect(visibleItems(fixture).length).toBe(1);
  });

  it('hides the search box in the icon-only rail but keeps filtering', () => {
    component.searchTerm.set('label');
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.widget-search')).toBeNull();
    expect(visibleItems(fixture).length).toBe(1);
  });
});
