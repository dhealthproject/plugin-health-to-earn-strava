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
      props: false,
      // no-component
    },
  ],

  components,

  storages: [],

  settings: [],

  permissions: [
    {
      name: "HealthToEarnStrava.getRepositoryFactory",
      type: "getter",
      target: "network/repositoryFactory",
      description:
        "This permission is requested to fetch the blockchain network data.",
    },
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
