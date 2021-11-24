/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
export const AddressShortener = (address: string): string => {
  return [
    address.substr(0, 4),
    '...',
    address.substr(-3)
  ].join('-');
}

export const HashShortener = (hash: string): string => {
  return [
    hash.substr(0, 6),
    '...',
    hash.substr(-4)
  ].join('');
}
