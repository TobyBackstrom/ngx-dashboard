import { Component, ChangeDetectionStrategy, input, inject, signal, computed, DestroyRef, viewChild, ElementRef, Renderer2, effect } from '@angular/core';

@Component({
  selector: 'lib-analog-clock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analog-clock.component.html',
  styleUrl: './analog-clock.component.scss',
  host: {
    '[class.has-background]': 'hasBackground()',
    '[class.show-seconds]': 'showSeconds()',
    'class': 'clock-widget analog'
  }
})
export class AnalogClockComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly #renderer = inject(Renderer2);

  // Inputs
  hasBackground = input<boolean>(false);
  showSeconds = input<boolean>(true);

  // ViewChild references for clock hands
  hourHand = viewChild<ElementRef<SVGPathElement>>('hourHand');
  minuteHand = viewChild<ElementRef<SVGPathElement>>('minuteHand');
  secondHand = viewChild<ElementRef<SVGPathElement>>('secondHand');

  // Time tracking
  currentTime = signal(new Date());

  // Computed rotation signals
  secondHandRotation = computed(() => {
    const seconds = this.currentTime().getSeconds();
    return seconds * 6; // 360° / 60s = 6° per second
  });

  minuteHandRotation = computed(() => {
    const time = this.currentTime();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    return minutes * 6 + seconds / 10; // Smooth minute hand movement
  });

  hourHandRotation = computed(() => {
    const time = this.currentTime();
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    return hours * 30 + minutes / 2 + seconds / 120; // Smooth hour hand movement
  });

  #intervalId: number | null = null;

  constructor() {
    // Set up time update timer
    this.#startTimer();
    
    // Clean up timer on component destruction
    this.#destroyRef.onDestroy(() => {
      this.#stopTimer();
    });

    // Update DOM when rotations change
    effect(() => {
      this.#updateClockHands();
    });
  }

  #startTimer(): void {
    // Sync to the next second boundary for smooth start
    const now = new Date();
    const msUntilNextSecond = 1000 - now.getMilliseconds();
    
    setTimeout(() => {
      this.currentTime.set(new Date());
      
      // Start the regular 1-second interval
      this.#intervalId = window.setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);
    }, msUntilNextSecond);
  }

  #stopTimer(): void {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  #updateClockHands(): void {
    const hourElement = this.hourHand()?.nativeElement;
    const minuteElement = this.minuteHand()?.nativeElement;
    const secondElement = this.secondHand()?.nativeElement;

    if (hourElement) {
      this.#renderer.setAttribute(
        hourElement,
        'transform',
        `rotate(${this.hourHandRotation()}, 400, 400)`
      );
    }

    if (minuteElement) {
      this.#renderer.setAttribute(
        minuteElement,
        'transform',
        `rotate(${this.minuteHandRotation()}, 400, 400)`
      );
    }

    if (secondElement && this.showSeconds()) {
      this.#renderer.setAttribute(
        secondElement,
        'transform',
        `rotate(${this.secondHandRotation()}, 400, 400)`
      );
    }
  }
}