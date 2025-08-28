import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DigitalClockComponent } from '../digital-clock.component';

describe('DigitalClockComponent', () => {
  let component: DigitalClockComponent;
  let fixture: ComponentFixture<DigitalClockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalClockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalClockComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure proper cleanup after each test
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should display current time immediately after initialization', () => {
      fixture.detectChanges();
      
      const timeElement = fixture.nativeElement.querySelector('.digital-time');
      expect(timeElement?.textContent?.trim()).toBeTruthy();
      expect(timeElement?.textContent?.trim()).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should display current time within reasonable bounds', () => {
      fixture.detectChanges();
      
      const timeElement = fixture.nativeElement.querySelector('.digital-time');
      const displayedTime = timeElement?.textContent?.trim();
      
      expect(displayedTime).toBeTruthy();
      expect(displayedTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      
      // The displayed time should be within reasonable bounds of current time
      const displayedHour = parseInt(displayedTime!.substring(0, 2));
      const currentHour = new Date().getHours();
      expect(Math.abs(displayedHour - currentHour)).toBeLessThanOrEqual(1);
    });
  });

  describe('User Configuration Options', () => {
    it('should display time in 24h format without seconds when configured', () => {
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', false);
      fixture.detectChanges();
      
      const formattedTime = component.formattedTime();
      expect(formattedTime).toMatch(/^\d{2}:\d{2}$/);
      expect(formattedTime).not.toContain('AM');
      expect(formattedTime).not.toContain('PM');
    });

    it('should display time in 24h format with seconds when configured', () => {
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      
      const formattedTime = component.formattedTime();
      expect(formattedTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(formattedTime).not.toContain('AM');
      expect(formattedTime).not.toContain('PM');
    });

    it('should display time in 12h format without seconds when configured', () => {
      fixture.componentRef.setInput('timeFormat', '12h');
      fixture.componentRef.setInput('showSeconds', false);
      fixture.detectChanges();
      
      const formattedTime = component.formattedTime();
      expect(formattedTime).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
    });

    it('should display time in 12h format with seconds when configured', () => {
      fixture.componentRef.setInput('timeFormat', '12h');
      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      
      const formattedTime = component.formattedTime();
      expect(formattedTime).toMatch(/^\d{2}:\d{2}:\d{2} (AM|PM)$/);
    });

    it('should update display format when switching between 24h and 12h', () => {
      // Start with 24h format
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', false);
      fixture.detectChanges();
      
      const time24h = component.formattedTime();
      expect(time24h).toMatch(/^\d{2}:\d{2}$/);
      
      // Switch to 12h format
      fixture.componentRef.setInput('timeFormat', '12h');
      fixture.detectChanges();
      
      const time12h = component.formattedTime();
      expect(time12h).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
      
      // Times should be different formats
      expect(time24h).not.toBe(time12h);
    });

    it('should update display when toggling seconds visibility', () => {
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', false);
      fixture.detectChanges();
      
      const timeWithoutSeconds = component.formattedTime();
      expect(timeWithoutSeconds).toMatch(/^\d{2}:\d{2}$/);
      
      // Enable seconds
      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      
      const timeWithSeconds = component.formattedTime();
      expect(timeWithSeconds).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      
      // Should be different lengths
      expect(timeWithSeconds.length).toBeGreaterThan(timeWithoutSeconds.length);
    });
  });

  describe('Template Integration', () => {
    it('should display formatted time in template element', () => {
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      
      const timeElement = fixture.nativeElement.querySelector('.digital-time');
      const templateTime = timeElement?.textContent?.trim();
      const componentTime = component.formattedTime();
      
      expect(templateTime).toBe(componentTime);
      expect(templateTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should update template when time format changes', () => {
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', false);
      fixture.detectChanges();
      
      let timeElement = fixture.nativeElement.querySelector('.digital-time');
      let templateTime = timeElement?.textContent?.trim();
      expect(templateTime).toMatch(/^\d{2}:\d{2}$/);
      
      // Change to 12h format
      fixture.componentRef.setInput('timeFormat', '12h');
      fixture.detectChanges();
      
      timeElement = fixture.nativeElement.querySelector('.digital-time');
      templateTime = timeElement?.textContent?.trim();
      expect(templateTime).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
    });

    it('should reflect input changes in host element classes', () => {
      fixture.componentRef.setInput('hasBackground', true);
      fixture.componentRef.setInput('timeFormat', '12h');
      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      
      const hostElement = fixture.nativeElement;
      expect(hostElement.classList.contains('has-background')).toBe(true);
      expect(hostElement.classList.contains('show-pm')).toBe(true);
      expect(hostElement.classList.contains('show-seconds')).toBe(true);
      expect(hostElement.classList.contains('clock-widget')).toBe(true);
      expect(hostElement.classList.contains('digital')).toBe(true);
    });

    it('should update host classes when inputs change', () => {
      fixture.componentRef.setInput('hasBackground', false);
      fixture.componentRef.setInput('timeFormat', '24h');
      fixture.componentRef.setInput('showSeconds', false);
      fixture.detectChanges();
      
      const hostElement = fixture.nativeElement;
      expect(hostElement.classList.contains('has-background')).toBe(false);
      expect(hostElement.classList.contains('show-pm')).toBe(false);
      expect(hostElement.classList.contains('show-seconds')).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should handle rapid input changes without errors', () => {
      fixture.detectChanges();
      
      // Rapidly change inputs multiple times
      for (let i = 0; i < 10; i++) {
        fixture.componentRef.setInput('timeFormat', i % 2 === 0 ? '24h' : '12h');
        fixture.componentRef.setInput('showSeconds', i % 2 === 0);
        fixture.componentRef.setInput('hasBackground', i % 3 === 0);
        fixture.detectChanges();
        
        // Should still display valid time format
        const formattedTime = component.formattedTime();
        expect(formattedTime).toMatch(/^\d{2}:\d{2}(:\d{2})?( (AM|PM))?$/);
      }
    });

    it('should maintain consistent formatting patterns', () => {
      fixture.detectChanges();
      
      // Test all combinations of inputs
      const timeFormats: ('12h' | '24h')[] = ['12h', '24h'];
      const showSecondsOptions = [true, false];
      const hasBackgroundOptions = [true, false];
      
      timeFormats.forEach(timeFormat => {
        showSecondsOptions.forEach(showSeconds => {
          hasBackgroundOptions.forEach(hasBackground => {
            fixture.componentRef.setInput('timeFormat', timeFormat);
            fixture.componentRef.setInput('showSeconds', showSeconds);
            fixture.componentRef.setInput('hasBackground', hasBackground);
            fixture.detectChanges();
            
            const formattedTime = component.formattedTime();
            
            if (timeFormat === '24h') {
              if (showSeconds) {
                expect(formattedTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
              } else {
                expect(formattedTime).toMatch(/^\d{2}:\d{2}$/);
              }
              expect(formattedTime).not.toContain('AM');
              expect(formattedTime).not.toContain('PM');
            } else {
              if (showSeconds) {
                expect(formattedTime).toMatch(/^\d{2}:\d{2}:\d{2} (AM|PM)$/);
              } else {
                expect(formattedTime).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
              }
            }
          });
        });
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle component destruction cleanly', () => {
      fixture.detectChanges();
      
      // Destroy should not throw errors
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should provide consistent output across multiple initialization cycles', () => {
      // Initialize and get initial time format
      fixture.detectChanges();
      const firstTime = component.formattedTime();
      
      // Destroy and recreate
      fixture.destroy();
      fixture = TestBed.createComponent(DigitalClockComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      
      const secondTime = component.formattedTime();
      
      // Both should be valid time formats (though potentially different times)
      expect(firstTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(secondTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });
});