import { Injectable, computed, signal, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DashboardStore } from '../store/dashboard-store';
import { ReservedSpace, DEFAULT_RESERVED_SPACE } from '../models/reserved-space';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface DashboardConstraints {
  maxWidth: number;
  maxHeight: number;
  constrainedBy: 'width' | 'height' | 'none';
}

/**
 * Internal component-scoped service that provides viewport-aware constraints for a single dashboard.
 * Each dashboard component gets its own instance of this service.
 * 
 * This service is NOT part of the public API and should remain internal to the library.
 */
@Injectable()
export class DashboardViewportService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(DashboardStore);
  
  private readonly viewportSize = signal<ViewportSize>({ width: 0, height: 0 });
  private readonly reservedSpace = signal<ReservedSpace>(DEFAULT_RESERVED_SPACE);
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeViewportTracking();
    }
  }

  /**
   * Initialize viewport size tracking using ResizeObserver on the window
   */
  private initializeViewportTracking(): void {
    // Use ResizeObserver on document.documentElement for accurate viewport tracking
    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const entry = entries[0];
        const { inlineSize, blockSize } = entry.contentBoxSize[0];
        this.viewportSize.set({
          width: inlineSize,
          height: blockSize
        });
      }
    });

    this.resizeObserver.observe(document.documentElement);

    // Initial size
    this.viewportSize.set({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
    });
  }

  /**
   * Set reserved space that should be excluded from dashboard calculations
   * (e.g., toolbar height, widget list width, padding)
   */
  setReservedSpace(space: ReservedSpace): void {
    this.reservedSpace.set(space);
  }

  /**
   * Get current viewport size
   */
  readonly currentViewportSize = this.viewportSize.asReadonly();

  /**
   * Get current reserved space
   */
  readonly currentReservedSpace = this.reservedSpace.asReadonly();

  /**
   * Calculate available space for dashboard after accounting for reserved areas
   */
  readonly availableSpace = computed((): ViewportSize => {
    const viewport = this.viewportSize();
    const reserved = this.reservedSpace();
    
    return {
      width: Math.max(0, viewport.width - reserved.left - reserved.right),
      height: Math.max(0, viewport.height - reserved.top - reserved.bottom)
    };
  });

  /**
   * Calculate dashboard constraints for this dashboard instance
   */
  readonly constraints = computed((): DashboardConstraints => {
    const availableSize = this.availableSpace();
    
    // Get grid configuration from our component's store
    const rows = this.store.rows();
    const columns = this.store.columns();
    
    if (rows === 0 || columns === 0) {
      return {
        maxWidth: availableSize.width,
        maxHeight: availableSize.height,
        constrainedBy: 'none'
      };
    }

    // Calculate aspect ratio
    const aspectRatio = columns / rows;
    
    // Calculate maximum size that fits within available space
    const maxWidthFromHeight = availableSize.height * aspectRatio;
    const maxHeightFromWidth = availableSize.width / aspectRatio;
    
    let maxWidth: number;
    let maxHeight: number;
    let constrainedBy: 'width' | 'height';
    
    if (maxWidthFromHeight <= availableSize.width) {
      // Height is the limiting factor
      maxWidth = maxWidthFromHeight;
      maxHeight = availableSize.height;
      constrainedBy = 'height';
    } else {
      // Width is the limiting factor
      maxWidth = availableSize.width;
      maxHeight = maxHeightFromWidth;
      constrainedBy = 'width';
    }

    return {
      maxWidth: Math.max(0, maxWidth),
      maxHeight: Math.max(0, maxHeight),
      constrainedBy
    };
  });

}