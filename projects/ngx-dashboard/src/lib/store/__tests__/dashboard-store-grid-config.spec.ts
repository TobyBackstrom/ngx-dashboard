import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';

describe('DashboardStore - Grid Configuration', () => {
  let store: InstanceType<typeof DashboardStore>;

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getFactory', 'collectSharedStates', 'restoreSharedStates', 'widgetTypes']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    store.setGridConfig({ rows: 8, columns: 16 });
  });

  describe('setGridConfig', () => {
    it('should update rows only', () => {
      store.setGridConfig({ rows: 12 });
      expect(store.rows()).toBe(12);
      expect(store.columns()).toBe(16); // unchanged
      expect(store.gutterSize()).toBe('0.5em'); // unchanged
    });

    it('should update columns only', () => {
      store.setGridConfig({ columns: 20 });
      expect(store.columns()).toBe(20);
      expect(store.rows()).toBe(8); // unchanged
    });

    it('should update gutterSize only', () => {
      store.setGridConfig({ gutterSize: '1em' });
      expect(store.gutterSize()).toBe('1em');
      expect(store.rows()).toBe(8); // unchanged
      expect(store.columns()).toBe(16); // unchanged
    });

    it('should update multiple properties at once', () => {
      store.setGridConfig({ rows: 10, columns: 24, gutterSize: '2rem' });
      expect(store.rows()).toBe(10);
      expect(store.columns()).toBe(24);
      expect(store.gutterSize()).toBe('2rem');
    });

    it('should handle edge case values', () => {
      store.setGridConfig({ rows: 1, columns: 1, gutterSize: '0px' });
      expect(store.rows()).toBe(1);
      expect(store.columns()).toBe(1);
      expect(store.gutterSize()).toBe('0px');
    });
  });

  describe('setGridCellDimensions', () => {
    it('should update grid cell dimensions', () => {
      store.setGridCellDimensions(100, 50);
      expect(store.gridCellDimensions()).toEqual({ width: 100, height: 50 });
    });

    it('should handle zero dimensions', () => {
      store.setGridCellDimensions(0, 0);
      expect(store.gridCellDimensions()).toEqual({ width: 0, height: 0 });
    });

    it('should handle large dimensions', () => {
      store.setGridCellDimensions(9999, 9999);
      expect(store.gridCellDimensions()).toEqual({ width: 9999, height: 9999 });
    });

    it('should handle fractional dimensions', () => {
      store.setGridCellDimensions(100.5, 75.25);
      expect(store.gridCellDimensions()).toEqual({ width: 100.5, height: 75.25 });
    });
  });

  describe('toggleEditMode', () => {
    it('should toggle from false to true', () => {
      expect(store.isEditMode()).toBe(false);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(true);
    });

    it('should toggle from true to false', () => {
      store.setEditMode(true);
      expect(store.isEditMode()).toBe(true);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(false);
    });

    it('should toggle multiple times', () => {
      expect(store.isEditMode()).toBe(false);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(true);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(false);
      store.toggleEditMode();
      expect(store.isEditMode()).toBe(true);
    });
  });

  describe('setEditMode', () => {
    it('should set edit mode to true', () => {
      store.setEditMode(true);
      expect(store.isEditMode()).toBe(true);
    });

    it('should set edit mode to false', () => {
      store.setEditMode(false);
      expect(store.isEditMode()).toBe(false);
    });

    it('should be idempotent', () => {
      store.setEditMode(true);
      store.setEditMode(true);
      expect(store.isEditMode()).toBe(true);

      store.setEditMode(false);
      store.setEditMode(false);
      expect(store.isEditMode()).toBe(false);
    });
  });
});