/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn with Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
import Vue, { VueConstructor } from "vue";

// vee-validate extension
import { extend } from 'vee-validate';
import { digits, excluded, integer, is, is_not, max_value, max, min_value, min, regex, required } from 'vee-validate/dist/rules';
extend('digits', digits);
extend('excluded', excluded);
extend('integer', integer);
extend('is', is);
extend('is_not', is_not);
extend('max_value', max_value);
extend('max', max);
extend('min_value', min_value);
extend('min', min);
extend('regex', regex);
extend('required', required);

// internal dependencies
// child components
import HealthToEarn from "./views/pages/HealthToEarn/HealthToEarn.vue";

/// region components library
const components: { [s: string]: VueConstructor } = {
  HealthToEarn,
};

export const registerComponents = (): { [s: string]: VueConstructor } => {
  Object.keys(components).forEach((k) => Vue.component(k, components[k]));
  return components;
};
/// end-region components library

/// region installable plugin
export default {
  view: "HealthToEarn",

  routes: [
    {
      path: "/health-to-earn-with-strava",
      name: "healthToEarn.home",
      meta: {
        protected: true,
        title: "Health to Earn with Strava",
        hideFromMenu: true,
      },
      // @ts-ignore
      component: () => import("@/views/pages/HealthToEarn/HealthToEarn.vue"),
      props: false,
    },
  ],

  components,

  storages: [],

  settings: [],

  permissions: [
    {
      name: "HealthToEarnStrava.getCurrentSignerAddress",
      type: "getter",
      target: "account/currentSignerAddress",
      description:
        "This permission is requested to fetch the currently active signer address.",
    }
  ],
};
/// end-region installable plugin
