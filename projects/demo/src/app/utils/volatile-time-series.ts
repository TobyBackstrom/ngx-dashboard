/**
 * A synthetic time series generator that mimics volatile behavior.
 *
 * Characteristics:
 * - High short-term volatility
 * - Random walk with momentum
 * - Mean reversion toward a central value
 * - Bounded within a minimum and maximum range
 */
export class VolatileTimeSeries {
  /**
   * Creates a price-like time series suitable for financial data simulation.
   *
   * @param basePrice - The base price around which the series will fluctuate.
   * @param volatilityPercentage - The volatility as a percentage of the base price (default 5%).
   * @returns A new VolatileTimeSeries configured for price simulation.
   */
  static createPriceSeries(
    basePrice: number,
    volatilityPercentage: number = 5
  ): VolatileTimeSeries {
    const range = basePrice * (volatilityPercentage / 100);
    return new VolatileTimeSeries(
      basePrice - range * 2,
      basePrice + range * 2,
      0.02
    );
  }

  /**
   * Creates a percentage-based time series (0-100).
   *
   * @param centerValue - The center value for the percentage (default 50).
   * @param volatility - How much the value can deviate from center (default 20).
   * @returns A new VolatileTimeSeries configured for percentage values.
   */
  static createPercentageSeries(
    centerValue: number = 50,
    volatility: number = 20
  ): VolatileTimeSeries {
    return new VolatileTimeSeries(
      Math.max(0, centerValue - volatility),
      Math.min(100, centerValue + volatility),
      0.015
    );
  }

  /**
   * Creates a general value-based time series with configurable bounds.
   *
   * @param minValue - The minimum value for the series.
   * @param maxValue - The maximum value for the series.
   * @param volatilityFactor - Controls the volatility relative to the range (default 0.3).
   *        Higher values create more volatile series. Range: 0.1 to 1.0.
   * @returns A new VolatileTimeSeries configured for general numeric values.
   */
  static createValueSeries(
    minValue: number,
    maxValue: number,
    volatilityFactor: number = 0.3
  ): VolatileTimeSeries {
    // Adjust mean reversion based on volatility factor
    // Higher volatility = weaker mean reversion
    const meanReversionStrength = 0.025 * (1 - volatilityFactor * 0.6);
    return new VolatileTimeSeries(minValue, maxValue, meanReversionStrength);
  }

  private center: number;
  private currentValue: number;
  private volatility: number;
  private momentum: number;

  /**
   * Constructs a new VolatileTimeSeries.
   *
   * @param minValue - The minimum value the series can return.
   * @param maxValue - The maximum value the series can return.
   * @param meanReversionStrength - Controls how strongly the value reverts toward the center.
   *        Higher values cause quicker reversion. Typical range: 0.01 to 0.2.
   */
  constructor(
    private minValue: number,
    private maxValue: number,
    private meanReversionStrength: number = 0.02
  ) {
    this.center = (minValue + maxValue) / 2;
    this.currentValue = this.center;
    this.volatility = (maxValue - minValue) * 0.06;
    this.momentum = 0;
  }

  /**
   * Advances the time series by one step and returns the new value.
   *
   * This simulates one unit of time (e.g., one second or one tick).
   * The output will reflect realistic movement with volatility and short-term trends.
   *
   * @returns The next value in the time series.
   */
  public next(): number {
    // Constrain volatility evolution to prevent drift (bound between 50% and 200% of initial)
    const baseVolatility = (this.maxValue - this.minValue) * 0.06;
    const volatilityChange = 1 + (Math.random() * 0.06 - 0.03);
    this.volatility = Math.max(
      baseVolatility * 0.5,
      Math.min(baseVolatility * 2.0, this.volatility * volatilityChange)
    );

    // Pull toward the center (mean reversion)
    const reversionForce =
      (this.center - this.currentValue) * this.meanReversionStrength;

    // Generate random "shock" with occasional large movements to hit extremes
    let shock = this.#randomNormal(0, this.volatility);
    
    // 5% chance of extreme shock to ensure min/max values are occasionally reached
    if (Math.random() < 0.05) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const extremeShock = (this.maxValue - this.minValue) * 0.15 * direction;
      shock += extremeShock;
    }

    // Update momentum with longer persistence (reduced decay from 0.8 to 0.92)
    this.momentum = 0.92 * this.momentum + 0.08 * shock;

    // Combine all forces into the new value
    this.currentValue += this.momentum + reversionForce;

    // Enforce bounds
    this.currentValue = Math.max(
      this.minValue,
      Math.min(this.maxValue, this.currentValue)
    );

    return this.currentValue;
  }

  /**
   * Generates a normally distributed random number using the Box-Muller transform.
   *
   * @param mean - The mean of the distribution (default 0).
   * @param stdDev - The standard deviation (default 1).
   * @returns A random number from N(mean, stdDev).
   */
  #randomNormal(mean = 0, stdDev = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
  }
}
