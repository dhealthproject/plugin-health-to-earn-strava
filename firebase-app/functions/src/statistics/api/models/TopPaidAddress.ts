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
 * @type    TopPaidAddress
 *
 * This class describes a top paid address schema structure.
*/
export type TopPaidAddress = {
  /**
   * The wallet address of the account.
   *
   * @var {string}
   */
  address: string;

  /**
   * The total reward that the address received.
   *
   * @var {number}
   */
  totalReward: number;
}