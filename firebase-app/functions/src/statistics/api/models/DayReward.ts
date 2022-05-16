/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      dHealth Network <devs@dhealth.foundation>
 * @license     LGPL-3.0
 */
/**
 * @type    DayReward
 *
 * Reward for the day.
 */
export type DayReward = {
  /**
   * Average reward of the day.
   *
   * @var {number}
   */
  averageReward: number;

  /**
   * Total reward of the day.
   *
   * @var {number}
   */
  totalRewards: number;

  /**
   * Total transactions of the day.
   *
   * @var {number}
   */
  totalTransactions: number;
}