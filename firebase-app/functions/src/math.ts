/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
/**
 * @class         SkewNormalDistribution
 * @description   This class creates random variates to skew towards
 *                a provided mean using the Skew Normal Distribution.
 *
 * @example
 * ```javascript
 * var skewer = new SkewNormalDistribution(0.8);
 * console.log(skewer.value);
 * ```
 *
 * @link https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/
 */
export class SkewNormalDistribution {
  /**
   * The random number generator. By default, uses
   * Math.random.
   * @var {any|callable}
   */
  public static RNG = Math.random;

  /**
   * Constructs a skew-normal distribution instance
   * using a mean value of \a mean.
   *
   * @param   {number}  mean
   * @param   {number}  divisibility
   */
  public constructor(
    protected readonly mean: number,
    protected readonly divisibility: number = 6,
  ) {}

  /**
   * Getter for the **skewed** value. For the sake of
   * simplicity, the standard deviation and  skewness
   * values cannot be edited.
   *
   * @returns   {number}  The random skewed value (variate).
   */
  public get value(): number {
    // mean of 0.8
    // standard deviation of 0.3
    // skewness of 0.5
    const variate = parseFloat(
      this.skewNormal(this.mean, 0.3, 0.5)
          .toFixed(this.divisibility)
    );

    // multiplies by 10 to power of "divisibility"
    return parseInt((
      Math.pow(10, this.divisibility)
      *
      variate
    ).toFixed(0));
  }

  /**
   * This method uses a Box-Muller transform to produce
   * two independent normal variates that will be  used
   * to get the skew-normal variate.
   *
   * @link https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/
   * @returns   {number[]}
   */
  protected random(): number[] {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = SkewNormalDistribution.RNG();
    while (u2 === 0) u2 = SkewNormalDistribution.RNG();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const dir = 2.0 * Math.PI * u2;
    return [mag * Math.cos(dir), mag * Math.sin(dir)];
  }

  /**
   * The skew-normal distribution implementation  which
   * uses the {@link random} method to get the pair  of
   * random variates then calculates a coefficient  and
   * produces a skew-normal variate using the deviation
   * and skewness as described in the linked article.
   *
   * @link https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/
   * @param   {number}  mean        The location or "mean" value.
   * @param   {number}  deviation   The standard deviation.
   * @param   {number}  skewness    The skewness, if 0 uses only deviation.
   * @returns {number}
   */
  protected skewNormal(mean: number, deviation: number, skewness: number = 0) {
    const [u0, v] = this.random();
    if (skewness === 0) {
        return mean + deviation * u0;
    }
    const coeff = skewness / Math.sqrt(1 + skewness * skewness);
    const u1 = coeff * u0 + Math.sqrt(1 - coeff * coeff) * v;
    const z = u0 >= 0 ? u1 : -u1;
    return mean + deviation * z;
  }
}
