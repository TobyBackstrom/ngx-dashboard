import { Injectable } from '@angular/core';
import { DashboardDataDto } from '@dragonworks/ngx-dashboard';

/**
 * Abstract service for dashboard persistence operations.
 * Provides a contract for saving and loading dashboard configurations.
 */
@Injectable({
  providedIn: 'root'
})
export abstract class DashboardPersistenceService {
  /**
   * Export/save dashboard data to persistent storage.
   * @param data - Dashboard data to save
   * @param filename - Optional filename for file-based storage
   */
  abstract exportDashboard(data: DashboardDataDto, filename?: string): Promise<void>;

  /**
   * Import/load dashboard data from persistent storage.
   * @returns Dashboard data if successful, null if cancelled or failed
   */
  abstract importDashboard(): Promise<DashboardDataDto | null>;

  /**
   * List available saved dashboards (optional feature).
   * @returns Array of available dashboard identifiers
   */
  abstract listDashboards?(): Promise<string[]>;

  /**
   * Delete a saved dashboard (optional feature).
   * @param identifier - Dashboard identifier to delete
   */
  abstract deleteDashboard?(identifier: string): Promise<void>;
}