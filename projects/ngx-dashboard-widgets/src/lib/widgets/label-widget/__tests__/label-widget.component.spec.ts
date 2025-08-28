import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelWidgetComponent, LabelWidgetState } from '../label-widget.component';

describe('LabelWidgetComponent', () => {
  let component: LabelWidgetComponent;
  let fixture: ComponentFixture<LabelWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabelWidgetComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default State Serialization', () => {
    it('should return complete default state with correct min/max font sizes', () => {
      fixture.detectChanges();
      
      const state = component.dashboardGetState();
      
      expect(state).toEqual({
        label: '',
        fontSize: 16,
        alignment: 'center',
        fontWeight: 'normal',
        opacity: 1,
        hasBackground: true,
        responsive: false,
        minFontSize: 8,
        maxFontSize: 64
      });
    });

    it('should have all required properties in default state', () => {
      fixture.detectChanges();
      
      const state = component.dashboardGetState();
      
      expect(state.label).toBeDefined();
      expect(state.fontSize).toBeDefined();
      expect(state.alignment).toBeDefined();
      expect(state.fontWeight).toBeDefined();
      expect(state.opacity).toBeDefined();
      expect(state.hasBackground).toBeDefined();
      expect(state.responsive).toBeDefined();
      expect(state.minFontSize).toBeDefined();
      expect(state.maxFontSize).toBeDefined();
    });

    it('should use correct default values for new font size properties', () => {
      fixture.detectChanges();
      
      const state = component.dashboardGetState();
      
      expect(state.minFontSize).toBe(8);
      expect(state.maxFontSize).toBe(64);
    });
  });

  describe('State Deserialization', () => {
    it('should accept complete state object and preserve all properties', () => {
      const inputState: LabelWidgetState = {
        label: 'Test Label',
        fontSize: 20,
        alignment: 'left',
        fontWeight: 'bold',
        opacity: 0.8,
        hasBackground: false,
        responsive: true,
        minFontSize: 10,
        maxFontSize: 48
      };

      component.dashboardSetState(inputState);
      fixture.detectChanges();

      const retrievedState = component.dashboardGetState();
      expect(retrievedState).toEqual(inputState);
    });

    it('should handle partial state objects and use defaults for missing properties', () => {
      const partialState = {
        label: 'Partial State Test',
        responsive: true
      };

      component.dashboardSetState(partialState);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      expect(state.label).toBe('Partial State Test');
      expect(state.responsive).toBe(true);
      expect(state.fontSize).toBe(16); // default
      expect(state.alignment).toBe('center'); // default
      expect(state.fontWeight).toBe('normal'); // default
      expect(state.opacity).toBe(1); // default
      expect(state.hasBackground).toBe(true); // default
      expect(state.minFontSize).toBe(8); // default
      expect(state.maxFontSize).toBe(64); // default
    });

    it('should handle undefined state input gracefully', () => {
      component.dashboardSetState(undefined);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      // Should return default state
      expect(state).toEqual({
        label: '',
        fontSize: 16,
        alignment: 'center',
        fontWeight: 'normal',
        opacity: 1,
        hasBackground: true,
        responsive: false,
        minFontSize: 8,
        maxFontSize: 64
      });
    });

    it('should handle null state input gracefully', () => {
      component.dashboardSetState(null);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      // Should return default state  
      expect(state).toEqual({
        label: '',
        fontSize: 16,
        alignment: 'center',
        fontWeight: 'normal',
        opacity: 1,
        hasBackground: true,
        responsive: false,
        minFontSize: 8,
        maxFontSize: 64
      });
    });
  });

  describe('Responsive Mode State Preservation', () => {
    it('should preserve min/max font sizes when responsive is true', () => {
      const responsiveState: LabelWidgetState = {
        label: 'Responsive Label',
        fontSize: 18,
        alignment: 'center',
        fontWeight: 'normal',
        opacity: 1,
        hasBackground: true,
        responsive: true,
        minFontSize: 12,
        maxFontSize: 72
      };

      component.dashboardSetState(responsiveState);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      expect(state.responsive).toBe(true);
      expect(state.minFontSize).toBe(12);
      expect(state.maxFontSize).toBe(72);
      expect(state.fontSize).toBe(18); // Should still be preserved even when responsive
    });

    it('should preserve min/max font sizes when responsive is false', () => {
      const nonResponsiveState: LabelWidgetState = {
        label: 'Non-Responsive Label',
        fontSize: 24,
        alignment: 'right',
        fontWeight: 'bold',
        opacity: 0.9,
        hasBackground: false,
        responsive: false,
        minFontSize: 16,
        maxFontSize: 96
      };

      component.dashboardSetState(nonResponsiveState);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      expect(state.responsive).toBe(false);
      expect(state.minFontSize).toBe(16);
      expect(state.maxFontSize).toBe(96);
      expect(state.fontSize).toBe(24);
    });

    it('should preserve custom min/max values across responsive mode changes', () => {
      // Start with responsive mode
      component.dashboardSetState({
        label: 'Toggle Test',
        responsive: true,
        minFontSize: 14,
        maxFontSize: 80
      });
      fixture.detectChanges();

      let state = component.dashboardGetState();
      expect(state.responsive).toBe(true);
      expect(state.minFontSize).toBe(14);
      expect(state.maxFontSize).toBe(80);

      // Switch to non-responsive mode
      component.dashboardSetState({
        ...state,
        responsive: false
      });
      fixture.detectChanges();

      state = component.dashboardGetState();
      expect(state.responsive).toBe(false);
      expect(state.minFontSize).toBe(14); // Should be preserved
      expect(state.maxFontSize).toBe(80); // Should be preserved
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy state format without min/max font size properties', () => {
      const legacyState = {
        label: 'Legacy Widget',
        fontSize: 18,
        alignment: 'left' as const,
        fontWeight: 'bold' as const,
        opacity: 0.7,
        hasBackground: true,
        responsive: true
        // Note: minFontSize and maxFontSize are intentionally missing
      };

      component.dashboardSetState(legacyState);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      // Legacy properties should be preserved
      expect(state.label).toBe('Legacy Widget');
      expect(state.fontSize).toBe(18);
      expect(state.alignment).toBe('left');
      expect(state.fontWeight).toBe('bold');
      expect(state.opacity).toBe(0.7);
      expect(state.hasBackground).toBe(true);
      expect(state.responsive).toBe(true);
      
      // Missing properties should get default values
      expect(state.minFontSize).toBe(8);
      expect(state.maxFontSize).toBe(64);
    });

    it('should handle very old state format with minimal properties', () => {
      const minimalState = {
        label: 'Old Widget'
      };

      component.dashboardSetState(minimalState);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      expect(state.label).toBe('Old Widget');
      expect(state.fontSize).toBe(16);
      expect(state.alignment).toBe('center');
      expect(state.fontWeight).toBe('normal');
      expect(state.opacity).toBe(1);
      expect(state.hasBackground).toBe(true);
      expect(state.responsive).toBe(false);
      expect(state.minFontSize).toBe(8);
      expect(state.maxFontSize).toBe(64);
    });

    it('should upgrade legacy responsive state correctly', () => {
      const legacyResponsiveState = {
        label: 'Legacy Responsive',
        responsive: true
        // Missing min/max properties
      };

      component.dashboardSetState(legacyResponsiveState);
      fixture.detectChanges();

      const state = component.dashboardGetState();
      
      expect(state.responsive).toBe(true);
      expect(state.minFontSize).toBe(8); // Should get defaults
      expect(state.maxFontSize).toBe(64); // Should get defaults
    });
  });

  describe('State Roundtrip Consistency', () => {
    it('should maintain state consistency through multiple set/get cycles', () => {
      const originalState: LabelWidgetState = {
        label: 'Roundtrip Test',
        fontSize: 22,
        alignment: 'right',
        fontWeight: 'bold',
        opacity: 0.85,
        hasBackground: false,
        responsive: true,
        minFontSize: 10,
        maxFontSize: 100
      };

      // First roundtrip
      component.dashboardSetState(originalState);
      fixture.detectChanges();
      const firstRetrieved = component.dashboardGetState();
      
      // Second roundtrip
      component.dashboardSetState(firstRetrieved);
      fixture.detectChanges();
      const secondRetrieved = component.dashboardGetState();
      
      // Third roundtrip
      component.dashboardSetState(secondRetrieved);
      fixture.detectChanges();
      const thirdRetrieved = component.dashboardGetState();
      
      // All states should be identical
      expect(firstRetrieved).toEqual(originalState);
      expect(secondRetrieved).toEqual(originalState);
      expect(thirdRetrieved).toEqual(originalState);
    });

    it('should handle edge case font size values consistently', () => {
      const edgeCaseState: LabelWidgetState = {
        label: 'Edge Cases',
        fontSize: 8,
        alignment: 'center',
        fontWeight: 'normal',
        opacity: 0.1,
        hasBackground: true,
        responsive: true,
        minFontSize: 8,  // Minimum allowed value
        maxFontSize: 128 // Maximum allowed value
      };

      component.dashboardSetState(edgeCaseState);
      fixture.detectChanges();
      const retrievedState = component.dashboardGetState();
      
      expect(retrievedState).toEqual(edgeCaseState);
      expect(retrievedState.minFontSize).toBe(8);
      expect(retrievedState.maxFontSize).toBe(128);
    });

    it('should preserve all alignment options through serialization', () => {
      const alignmentOptions: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
      
      alignmentOptions.forEach(alignment => {
        const testState: LabelWidgetState = {
          label: `${alignment} aligned`,
          fontSize: 16,
          alignment: alignment,
          fontWeight: 'normal',
          opacity: 1,
          hasBackground: true,
          responsive: false,
          minFontSize: 8,
          maxFontSize: 64
        };

        component.dashboardSetState(testState);
        fixture.detectChanges();
        const retrievedState = component.dashboardGetState();
        
        expect(retrievedState.alignment).toBe(alignment);
        expect(retrievedState).toEqual(testState);
      });
    });

    it('should preserve all font weight options through serialization', () => {
      const fontWeightOptions: ('normal' | 'bold')[] = ['normal', 'bold'];
      
      fontWeightOptions.forEach(fontWeight => {
        const testState: LabelWidgetState = {
          label: `${fontWeight} text`,
          fontSize: 16,
          alignment: 'center',
          fontWeight: fontWeight,
          opacity: 1,
          hasBackground: true,
          responsive: false,
          minFontSize: 8,
          maxFontSize: 64
        };

        component.dashboardSetState(testState);
        fixture.detectChanges();
        const retrievedState = component.dashboardGetState();
        
        expect(retrievedState.fontWeight).toBe(fontWeight);
        expect(retrievedState).toEqual(testState);
      });
    });
  });

  describe('Custom Font Size Range Serialization', () => {
    it('should serialize custom min/max font sizes correctly', () => {
      const customRangeStates = [
        { minFontSize: 8, maxFontSize: 32 },
        { minFontSize: 12, maxFontSize: 48 },
        { minFontSize: 16, maxFontSize: 96 },
        { minFontSize: 8, maxFontSize: 128 }
      ];

      customRangeStates.forEach(({ minFontSize, maxFontSize }) => {
        const testState: LabelWidgetState = {
          label: `Range ${minFontSize}-${maxFontSize}`,
          fontSize: 16,
          alignment: 'center',
          fontWeight: 'normal',
          opacity: 1,
          hasBackground: true,
          responsive: true,
          minFontSize: minFontSize,
          maxFontSize: maxFontSize
        };

        component.dashboardSetState(testState);
        fixture.detectChanges();
        const retrievedState = component.dashboardGetState();
        
        expect(retrievedState.minFontSize).toBe(minFontSize);
        expect(retrievedState.maxFontSize).toBe(maxFontSize);
        expect(retrievedState).toEqual(testState);
      });
    });

    it('should handle all combinations of responsive mode and custom font ranges', () => {
      const testCombinations = [
        { responsive: true, minFontSize: 10, maxFontSize: 50 },
        { responsive: false, minFontSize: 10, maxFontSize: 50 },
        { responsive: true, minFontSize: 8, maxFontSize: 128 },
        { responsive: false, minFontSize: 8, maxFontSize: 128 }
      ];

      testCombinations.forEach(({ responsive, minFontSize, maxFontSize }) => {
        const testState: LabelWidgetState = {
          label: `Combo ${responsive ? 'responsive' : 'fixed'} ${minFontSize}-${maxFontSize}`,
          fontSize: 18,
          alignment: 'left',
          fontWeight: 'bold',
          opacity: 0.9,
          hasBackground: false,
          responsive: responsive,
          minFontSize: minFontSize,
          maxFontSize: maxFontSize
        };

        component.dashboardSetState(testState);
        fixture.detectChanges();
        const retrievedState = component.dashboardGetState();
        
        expect(retrievedState.responsive).toBe(responsive);
        expect(retrievedState.minFontSize).toBe(minFontSize);
        expect(retrievedState.maxFontSize).toBe(maxFontSize);
        expect(retrievedState).toEqual(testState);
      });
    });
  });

  describe('State Object Type Safety', () => {
    it('should handle unknown properties in state object gracefully', () => {
      const stateWithExtraProps = {
        label: 'Extra Props Test',
        fontSize: 16,
        alignment: 'center' as const,
        fontWeight: 'normal' as const,
        opacity: 1,
        hasBackground: true,
        responsive: false,
        minFontSize: 8,
        maxFontSize: 64,
        unknownProperty: 'should be preserved',
        anotherExtra: 123
      };

      // TypeScript won't allow this normally, but simulate receiving unknown props
      component.dashboardSetState(stateWithExtraProps as any);
      fixture.detectChanges();

      const retrievedState = component.dashboardGetState();
      
      // Should include all known properties with correct values
      expect(retrievedState.label).toBe('Extra Props Test');
      expect(retrievedState.fontSize).toBe(16);
      expect(retrievedState.alignment).toBe('center');
      expect(retrievedState.fontWeight).toBe('normal');
      expect(retrievedState.opacity).toBe(1);
      expect(retrievedState.hasBackground).toBe(true);
      expect(retrievedState.responsive).toBe(false);
      expect(retrievedState.minFontSize).toBe(8);
      expect(retrievedState.maxFontSize).toBe(64);
      
      // Unknown properties are preserved by the current implementation (this is acceptable behavior)
      expect((retrievedState as any).unknownProperty).toBeDefined();
      expect((retrievedState as any).anotherExtra).toBeDefined();
    });

    it('should return a new object instance on each call to dashboardGetState', () => {
      const testState: LabelWidgetState = {
        label: 'Instance Test',
        fontSize: 16,
        alignment: 'center',
        fontWeight: 'normal',
        opacity: 1,
        hasBackground: true,
        responsive: false,
        minFontSize: 8,
        maxFontSize: 64
      };

      component.dashboardSetState(testState);
      fixture.detectChanges();

      const firstCall = component.dashboardGetState();
      const secondCall = component.dashboardGetState();
      
      // Should be equal in content but different instances
      expect(firstCall).toEqual(secondCall);
      expect(firstCall).not.toBe(secondCall);
    });
  });
});