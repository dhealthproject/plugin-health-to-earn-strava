/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
import { Address } from '@dhealth/sdk';

/**
 * @class         ReferralBonus
 * @description   This class creates multipliers based on a referral
 *                state tree generated from the dapp transactions.
 *
 * @example
 * ```javascript
 * var bonus = await ReferralBonus.getPayoutMultiplier(DATABASE, address);
 * console.log(`multiplier is: ${bonus}`);
 * ```
 *
 */
export class ReferralBonus {
  /**
   * Getter for the bonus multiplier which is applied
   * on the reward amount before sending it. Possible
   * values include:
   *
   * - 1: Default / Normal multiplier
   * - 2: First activity of the referred user
   *
   * @param     {any}       DATABASE    The firestore instance (e.g.: `admin.firestore()`).
   * @param     {Address}   address     The user's dHealth address.
   * @returns   {Promise<number>}       The bonus multiplier.
   */
  public static async getPayoutMultiplier(
    DATABASE: any,
    address: Address,
  ): Promise<number> {
    // gets users entry from db
    const usersSnapshot = await DATABASE.collection('users')
      .where('address', '==', address.plain())
      .get();

    // Error Case - fallback to multiplier = 1
    if (! usersSnapshot.size) {
      return 1;
    }

    // reads user details
    const user = usersSnapshot.docs[0];

    // Case 1 - NOT REFERRED: multiplier = 1
    if (!('referredBy' in user.data())) {
      // not a referred user
      return 1;
    }

    // Case 2 - COUNTER NOT SET: multiplier = 1
    if (! ('countRewards' in user.data()) || user.data().countRewards <= 0) {
      return 1;
    }

    // Case 3 - FIRST ACTIVITY: multiplier = 2
    if (1 === user.data().countRewards) {
      return 2;
    }

    return 1;
  }

  /**
   * Getter for the referrer bonus amount to define a
   * 0 or non-zero amount that will be rewarded to an
   * user that referred the activity's athlete.  This
   * method will return the following amounts:
   *
   * - 0: Default / No bonus for referrer (if any)
   * - 100000: First activity of the referred user (0.100000 DHP)
   * - 200000: Third activity of the referred user (0.200000 DHP)
   * - 300000: Fifth activity of the referred user (0.300000 DHP)
   * - 500000: Tenth activity of the referred user (0.500000 DHP)
   *
   * @param     {any}       DATABASE    The firestore instance (e.g.: `admin.firestore()`).
   * @param     {Address}   address     The user's dHealth address.
   * @returns   {Promise<number>}       The absolute referrer bonus amount (in DHP).
   */
  public static async getReferrerBonus(
    DATABASE: any,
    address: Address,
  ): Promise<number> {
    // gets users entry from db
    const usersSnapshot = await DATABASE.collection('users')
      .where('address', '==', address.plain())
      .get();

    // Error Case - fallback to bonus = 0
    if (! usersSnapshot.size) {
      return 0;
    }

    // reads user details
    const user = usersSnapshot.docs[0];

    // Case 1 - NOT REFERRED: bonus = 0
    if (!('referredBy' in user.data()) || !user.data().referredBy.length) {
      // not a referred user
      return 0;
    }

    // Case 2 - COUNTER NOT SET: bonus = 0
    if (! ('countRewards' in user.data()) || user.data().countRewards <= 0) {
      return 0;
    }

    // Case 3 - FIRST ACTIVITY: bonus = 0.100000 DHP
    if (1 === user.data().countRewards) {
      return 100000; // 0.100000 DHP
    }

    // Case 4 - THIRD ACTIVITY: bonus = 0.200000 DHP
    if (3 === user.data().countRewards) {
      return 200000; // 0.200000 DHP
    }

    // Case 5 - FIFTH ACTIVITY: bonus = 0.300000 DHP
    if (5 === user.data().countRewards) {
      return 300000; // 0.300000 DHP
    }

    // Case 6 - TENTH ACTIVITY: bonus = 0.500000 DHP
    if (10 === user.data().countRewards) {
      return 500000; // 0.500000 DHP
    }

    return 0;
  }
}
