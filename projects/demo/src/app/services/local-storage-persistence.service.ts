import { Injectable } from '@angular/core';
import { DashboardDataDto } from '@dragonworks/ngx-dashboard';
import { DashboardPersistenceService } from './dashboard-persistence.service';

/**
 * LocalStorage-based persistence service for dashboard data.
 * Stores dashboards in browser's localStorage with multiple slot support.
 */
@Injectable({
  providedIn: 'root'
})
export class LocalStoragePersistenceService extends DashboardPersistenceService {
  private readonly STORAGE_KEY_PREFIX = 'ngx-dashboard-';
  private readonly METADATA_KEY = 'ngx-dashboard-metadata';
  private readonly DEFAULT_SLOT = 'default';

  /**
   * Save dashboard data to localStorage.
   * @param data - Dashboard data to save
   * @param slotName - Storage slot name (defaults to 'default')
   */
  async exportDashboard(data: DashboardDataDto, slotName = this.DEFAULT_SLOT): Promise<void> {
    try {
      const storageKey = this.getStorageKey(slotName);
      const serializedData = JSON.stringify(data);
      
      // Save dashboard data
      localStorage.setItem(storageKey, serializedData);
      
      // Update metadata
      await this.updateMetadata(slotName, data);
      
    } catch (error) {
      console.error('Error saving dashboard to localStorage:', error);
      throw new Error('Failed to save dashboard to browser storage');
    }
  }

  /**
   * Load dashboard data from localStorage.
   * If no slot is specified, shows a selection dialog for available dashboards.
   * @returns Promise resolving to dashboard data or null if cancelled/not found
   */
  async importDashboard(): Promise<DashboardDataDto | null> {
    try {
      const availableDashboards = await this.listDashboards();
      
      if (availableDashboards.length === 0) {
        alert('No saved dashboards found in browser storage.');
        return null;
      }

      // If only one dashboard, load it directly
      if (availableDashboards.length === 1) {
        return this.loadDashboardBySlot(availableDashboards[0]);
      }

      // Show selection dialog for multiple dashboards
      const selectedSlot = await this.showDashboardSelectionDialog(availableDashboards);
      
      if (!selectedSlot) {
        return null; // User cancelled
      }

      return this.loadDashboardBySlot(selectedSlot);
      
    } catch (error) {
      console.error('Error loading dashboard from localStorage:', error);
      throw new Error('Failed to load dashboard from browser storage');
    }
  }

  /**
   * List all available saved dashboards.
   * @returns Array of dashboard slot names
   */
  async listDashboards(): Promise<string[]> {
    try {
      const metadata = this.getMetadata();
      return Object.keys(metadata);
    } catch (error) {
      console.error('Error listing dashboards:', error);
      return [];
    }
  }

  /**
   * Delete a saved dashboard.
   * @param slotName - Slot name to delete
   */
  async deleteDashboard(slotName: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(slotName);
      localStorage.removeItem(storageKey);
      
      // Update metadata
      const metadata = this.getMetadata();
      delete metadata[slotName];
      this.saveMetadata(metadata);
      
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw new Error('Failed to delete dashboard from browser storage');
    }
  }

  /**
   * Load dashboard data from a specific slot.
   * @param slotName - Slot name to load from
   * @returns Dashboard data or null if not found
   */
  private async loadDashboardBySlot(slotName: string): Promise<DashboardDataDto | null> {
    try {
      const storageKey = this.getStorageKey(slotName);
      const serializedData = localStorage.getItem(storageKey);
      
      if (!serializedData) {
        return null;
      }

      const data = JSON.parse(serializedData) as DashboardDataDto;
      
      // Basic validation
      if (!this.isValidDashboardData(data)) {
        throw new Error('Invalid dashboard data format');
      }

      return data;
      
    } catch (error) {
      console.error('Error loading dashboard from slot:', slotName, error);
      throw new Error(`Failed to load dashboard from slot: ${slotName}`);
    }
  }

  /**
   * Show a simple dialog to select from available dashboards.
   * @param availableDashboards - Array of available dashboard slot names
   * @returns Selected slot name or null if cancelled
   */
  private async showDashboardSelectionDialog(availableDashboards: string[]): Promise<string | null> {
    const metadata = this.getMetadata();
    
    // Create a formatted list with timestamps
    const dashboardList = availableDashboards
      .map((slot, index) => {
        const meta = metadata[slot] as Record<string, unknown> | undefined;
        const timestamp = meta?.['savedAt'] ? new Date(meta['savedAt'] as string).toLocaleString() : 'Unknown';
        return `${index + 1}. ${slot} (saved: ${timestamp})`;
      })
      .join('\n');

    const selection = prompt(
      `Select a dashboard to load:\n\n${dashboardList}\n\nEnter number (1-${availableDashboards.length}) or cancel:`
    );

    if (!selection) {
      return null; // User cancelled
    }

    const selectedIndex = parseInt(selection) - 1;
    
    if (selectedIndex >= 0 && selectedIndex < availableDashboards.length) {
      return availableDashboards[selectedIndex];
    }

    alert('Invalid selection. Please try again.');
    return null;
  }

  /**
   * Update metadata for a saved dashboard.
   * @param slotName - Slot name
   * @param data - Dashboard data
   */
  private async updateMetadata(slotName: string, data: DashboardDataDto): Promise<void> {
    const metadata = this.getMetadata();
    
    metadata[slotName] = {
      version: data.version,
      savedAt: new Date().toISOString(),
      gridSize: `${data.rows}x${data.columns}`,
      widgetCount: data.cells.length
    };

    this.saveMetadata(metadata);
  }

  /**
   * Get metadata for all saved dashboards.
   * @returns Metadata object
   */
  private getMetadata(): Record<string, unknown> {
    try {
      const metadata = localStorage.getItem(this.METADATA_KEY);
      return metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.error('Error reading metadata:', error);
      return {};
    }
  }

  /**
   * Save metadata to localStorage.
   * @param metadata - Metadata object to save
   */
  private saveMetadata(metadata: Record<string, unknown>): void {
    try {
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  }

  /**
   * Generate storage key for a dashboard slot.
   * @param slotName - Slot name
   * @returns Full storage key
   */
  private getStorageKey(slotName: string): string {
    return `${this.STORAGE_KEY_PREFIX}${slotName}`;
  }

  /**
   * Basic validation of dashboard data structure.
   * @param data - Data to validate
   * @returns True if data appears to be valid dashboard data
   */
  private isValidDashboardData(data: unknown): data is DashboardDataDto {
    return (
      data !== null &&
      typeof data === 'object' &&
      typeof (data as Record<string, unknown>)['version'] === 'string' &&
      typeof (data as Record<string, unknown>)['dashboardId'] === 'string' &&
      typeof (data as Record<string, unknown>)['rows'] === 'number' &&
      typeof (data as Record<string, unknown>)['columns'] === 'number' &&
      typeof (data as Record<string, unknown>)['gutterSize'] === 'string' &&
      Array.isArray((data as Record<string, unknown>)['cells'])
    );
  }
}