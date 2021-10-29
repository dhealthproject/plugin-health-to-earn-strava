/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn with Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */

module.exports = {
    // Disables extract of CSS files
    css: {extract: false},
    // Disables module splitting
    configureWebpack: {
        optimization: {
            splitChunks: false
        }
    },
    // Enables templates in .vue files
    runtimeCompiler: true
}
