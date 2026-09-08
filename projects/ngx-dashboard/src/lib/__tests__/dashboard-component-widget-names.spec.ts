import {
  Component,
  ViewContainerRef,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { DashboardService } from '../services/dashboard.service';
import { DashboardDataDto, Widget, WidgetFactory } from '../models';

@Component({
  selector: 'lib-test-widget',
  standalone: true,
  template: '<div class="test-widget">widget body</div>',
})
class TestWidgetComponent implements Widget {}

/**
 * Host exercising the public widget name badge surface of `<ngx-dashboard>`.
 *
 * Asserted through the rendered badge rather than a store accessor: the input
 * is the only write path, so the DOM is the only place the contract is
 * actually observable to a consumer.
 */
@Component({
  standalone: true,
  imports: [DashboardComponent],
  template: `
    <ngx-dashboard
      [dashboardData]="dashboardData"
      [showWidgetNames]="showWidgetNames()"
    ></ngx-dashboard>
  `,
})
class TestHostComponent {
  showWidgetNames = signal(false);

  readonly dashboardData: DashboardDataDto = {
    version: '1.1.0',
    dashboardId: 'badge-test',
    rows: 8,
    columns: 16,
    gutterSize: '0.5em',
    cells: [
      {
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetTypeid: 'test-widget',
        widgetState: undefined,
      },
    ],
  };
}

describe('DashboardComponent - widget name badges', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const badge = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.widget-name-badge');

  beforeEach(async () => {
    const testWidgetFactory: WidgetFactory = {
      widgetTypeid: 'test-widget',
      name: 'Test Widget',
      description: 'A test widget',
      svgIcon: '<svg><rect width="10" height="10"/></svg>',
      createInstance: (container: ViewContainerRef) =>
        container.createComponent(TestWidgetComponent),
    };

    const dashboardServiceSpy = jasmine.createSpyObj(
      'DashboardService',
      ['getFactory', 'collectSharedStates', 'restoreSharedStates'],
      { widgetTypes: signal([]) }
    );
    dashboardServiceSpy.getFactory.and.returnValue(testWidgetFactory);
    dashboardServiceSpy.collectSharedStates.and.returnValue(new Map());

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DashboardService, useValue: dashboardServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders no badge until the host asks for one', () => {
    expect(badge()).toBeNull();
  });

  it('names the widget type when the input turns badges on, and stops when it turns them off', async () => {
    host.showWidgetNames.set(true);
    await fixture.whenStable();
    expect(badge()?.textContent?.trim()).toBe('Test Widget');

    host.showWidgetNames.set(false);
    await fixture.whenStable();
    expect(badge()).toBeNull();
  });
});
