import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';

export interface DigitalClockConfig {
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  hasBackground: boolean;
}

@Component({
  selector: 'lib-digital-clock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './digital-clock.component.html',
  styleUrl: './digital-clock.component.scss',
  host: {
    '[class.has-background]': 'hasBackground()',
    '[class.show-pm]': 'timeFormat() === "12h"',
    '[class.show-seconds]': 'showSeconds()',
    class: 'clock-widget digital',
  },
})
export class DigitalClockComponent {
  readonly #destroyRef = inject(DestroyRef);

  // Inputs
  timeFormat = input<'12h' | '24h'>('24h');
  showSeconds = input<boolean>(true);
  hasBackground = input<boolean>(false);

  // Time tracking
  currentTime = signal(new Date());

  formattedTime = computed(() => {
    const time = this.currentTime();
    const format = this.timeFormat();
    const showSecs = this.showSeconds();
    return this.#formatTime(time, format, showSecs);
  });

  #intervalId: number | null = null;

  #formatTime(time: Date, format: '12h' | '24h', showSecs: boolean): string {
    let hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Pad with leading zeros
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    if (format === '12h') {
      // 12-hour format with AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12; // Convert 0 to 12 for 12 AM/PM

      const hh = hours.toString().padStart(2, '0');
      return showSecs ? `${hh}:${mm}:${ss} ${ampm}` : `${hh}:${mm} ${ampm}`;
    } else {
      // 24-hour format
      const hh = hours.toString().padStart(2, '0');
      return showSecs ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
    }
  }

  constructor() {
    // Set up time update timer
    this.#startTimer();

    // Clean up timer on component destruction
    this.#destroyRef.onDestroy(() => {
      this.#stopTimer();
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
}
