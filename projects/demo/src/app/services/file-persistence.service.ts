import { Injectable } from '@angular/core';
import { DashboardDataDto } from '@dragonworks/ngx-dashboard';
import { DashboardPersistenceService } from './dashboard-persistence.service';

/**
 * File-based persistence service for dashboard data.
 * Handles saving dashboards as JSON files and loading them from user's file system.
 */
@Injectable({
  providedIn: 'root'
})
export class FilePersistenceService extends DashboardPersistenceService {
  
  /**
   * Export dashboard data as a JSON file download.
   * @param data - Dashboard data to export
   * @param filename - Name of the file to download (defaults to 'dashboard.json')
   */
  async exportDashboard(data: DashboardDataDto, filename = 'dashboard.json'): Promise<void> {
    try {
      // Ensure filename has .json extension
      if (!filename.endsWith('.json')) {
        filename += '.json';
      }

      // Create formatted JSON string
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create blob with JSON data
      const blob = new Blob([jsonString], { 
        type: 'application/json;charset=utf-8' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      throw new Error('Failed to export dashboard file');
    }
  }

  /**
   * Import dashboard data from a JSON file selected by the user.
   * @returns Promise resolving to dashboard data or null if cancelled
   */
  async importDashboard(): Promise<DashboardDataDto | null> {
    return new Promise((resolve, reject) => {
      try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        
        // Handle file selection
        input.onchange = async (event: Event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) {
            resolve(null);
            return;
          }

          try {
            // Read file content
            const text = await file.text();
            
            // Parse JSON
            const data = JSON.parse(text) as DashboardDataDto;
            
            // Basic validation
            if (!this.isValidDashboardData(data)) {
              throw new Error('Invalid dashboard data format');
            }
            
            resolve(data);
          } catch (parseError) {
            console.error('Error parsing dashboard file:', parseError);
            reject(new Error('Invalid dashboard file format'));
          } finally {
            // Cleanup
            document.body.removeChild(input);
          }
        };

        // Handle cancellation
        input.oncancel = () => {
          document.body.removeChild(input);
          resolve(null);
        };

        // Trigger file dialog
        document.body.appendChild(input);
        input.click();
        
      } catch (error) {
        console.error('Error importing dashboard:', error);
        reject(new Error('Failed to import dashboard file'));
      }
    });
  }

  /**
   * List dashboards - not supported for file-based persistence.
   * @returns Empty array since file system doesn't track saved files
   */
  async listDashboards(): Promise<string[]> {
    // File-based persistence doesn't track saved files
    return [];
  }

  /**
   * Delete dashboard - not supported for file-based persistence.
   * @param _identifier - Dashboard identifier (ignored)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteDashboard(_identifier: string): Promise<void> {
    // File-based persistence doesn't support deletion
    throw new Error('Delete operation not supported for file-based persistence');
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