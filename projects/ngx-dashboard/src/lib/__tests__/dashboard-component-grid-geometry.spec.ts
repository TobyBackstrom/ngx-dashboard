import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { DashboardService } from '../services/dashboard.service';
import { GridConfig, GridResizeResult } from '../models';
import { createEmptyDashboard } from '../models/dashboard-data.utils';

/**
 * Host exercising the public grid geometry surface of `<ngx-dashboard>`:
 * the gutterSize / maxRows / maxColumns inputs, the gridConfig and
 * minGridSize accessors, and the gridConfigChanged output.
 */
@Component({
  standalone: true,
  imports: [DashboardComponent],
  template: `
    <ngx-dashboard
      [dashboardData]="dashboardData()"
      [gutterSize]="gutterSize()"
      [maxRows]="maxRows()"
      [maxColumns]="maxColumns()"
      (gridConfigChanged)="configEvents.push($event)"
      (gridResized)="resizeEvents.push($event)"
    ></ngx-dashboard>
  `,
})
class TestHostComponent {
  dashboard = viewChild.required(DashboardComponent);

  dashboardData = signal(createEmptyDashboard('geometry-test', 8, 16, '0.5em'));
  gutterSize = signal<string | undefined>(undefined);
  maxRows = signal(64);
  maxColumns = signal(128);

  configEvents: GridConfig[] = [];
  resizeEvents: GridResizeResult[] = [];
}

describe('DashboardComponent - grid geometry', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj(
      'DashboardService',
      ['getFactory', 'collectSharedStates', 'restoreSharedStates'],
      { widgetTypes: signal([]) }
    );
    dashboardServiceSpy.collectSharedStates.and.returnValue({});

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

  describe('gridConfig', () => {
    it('exposes the geometry loaded from the dashboard data', () => {
      expect(host.dashboard().gridConfig()).toEqual({
        rows: 8,
        columns: 16,
        gutterSize: '0.5em',
      });
    });
  });

  describe('minGridSize', () => {
    it('is 1 x 1 for an empty dashboard', () => {
      expect(host.dashboard().minGridSize()).toEqual({ rows: 1, columns: 1 });
    });
  });

  describe('gutterSize input', () => {
    it('seeds the store when bound', async () => {
      host.gutterSize.set('1em');
      await fixture.whenStable();

      expect(host.dashboard().gridConfig().gutterSize).toBe('1em');
    });

    it('ignores a value that is not a usable CSS length', async () => {
      host.gutterSize.set('0,5em');
      await fixture.whenStable();

      expect(host.dashboard().gridConfig().gutterSize).toBe('0.5em');
    });

    it('does not overwrite a later loadDashboard() while unchanged', async () => {
      host.gutterSize.set('1em');
      await fixture.whenStable();

      host
        .dashboard()
        .loadDashboard(createEmptyDashboard('imported', 4, 6, '1.5em'));
      await fixture.whenStable();

      // The input has not changed, so its effect does not re-run and the
      // imported dashboard's gutter survives.
      expect(host.dashboard().gridConfig().gutterSize).toBe('1.5em');
    });
  });

  describe('setGutterSize()', () => {
    it('applies a valid value and returns it', () => {
      expect(host.dashboard().setGutterSize('0.75em')).toBe('0.75em');
      expect(host.dashboard().gridConfig().gutterSize).toBe('0.75em');
    });

    it('returns the current value when the request is rejected', () => {
      expect(host.dashboard().setGutterSize('bogus')).toBe('0.5em');
      expect(host.dashboard().gridConfig().gutterSize).toBe('0.5em');
    });
  });

  describe('size limits', () => {
    it('caps setGridSize() at the bound maximum', async () => {
      host.maxRows.set(10);
      host.maxColumns.set(20);
      await fixture.whenStable();

      const result = host.dashboard().setGridSize(500, 900);

      expect(result).toEqual({ rows: 10, columns: 20, clamped: true });
      expect(host.dashboard().gridConfig()).toEqual({
        rows: 10,
        columns: 20,
        gutterSize: '0.5em',
      });
    });

    it('applies the default cap when nothing is bound', () => {
      const result = host.dashboard().setGridSize(5000, 5000);

      expect(result.rows).toBe(64);
      expect(result.columns).toBe(128);
    });
  });

  describe('gridConfigChanged', () => {
    it('does not emit for the initial load', () => {
      expect(host.configEvents).toEqual([]);
    });

    it('emits once when the size changes', () => {
      host.dashboard().setGridSize(12, 24);

      expect(host.configEvents.length).toBe(1);
      expect(host.configEvents[0]).toEqual({
        rows: 12,
        columns: 24,
        gutterSize: '0.5em',
      });
    });

    it('emits when the gutter changes', () => {
      host.dashboard().setGutterSize('1em');

      expect(host.configEvents.length).toBe(1);
      expect(host.configEvents[0].gutterSize).toBe('1em');
    });

    it('does not emit when a request changes nothing', () => {
      host.dashboard().setGridSize(8, 16); // already the committed size
      host.dashboard().setGutterSize('0.5em'); // already the committed gutter
      host.dashboard().setGutterSize('not-a-length'); // rejected

      expect(host.configEvents).toEqual([]);
    });

    it('accompanies gridResized on a size change', () => {
      host.dashboard().setGridSize(12, 24);

      expect(host.resizeEvents.length).toBe(1);
      expect(host.configEvents.length).toBe(1);
    });

    it('does not emit gridResized for a gutter-only change', () => {
      host.dashboard().setGutterSize('1em');

      expect(host.resizeEvents).toEqual([]);
      expect(host.configEvents.length).toBe(1);
    });
  });
});
