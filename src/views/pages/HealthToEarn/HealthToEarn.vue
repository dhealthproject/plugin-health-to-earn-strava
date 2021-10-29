<!--
/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn with Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
-->
<template>
  <div class="dhealth-plugin-health-to-earn-container">
    <div class="dashboard-left-container">
      <p>
        <a :href="authorizeUrl" target="_blank">Authorize now</a>
      </p>
    </div>
    <div class="dashboard-right-container">
      <div class="title">
        <span class="title_txt">{{ 'Plugin details' }}</span>
      </div>
      <p>This plugin lets you connect to your Strava account and be rewarded in DHP for daily activities on Strava!</p>

      <a
        class="github-fork-ribbon right-bottom"
        :href="forkUrl"
        target="_blank"
        data-ribbon="Fork me on GitHub"
        title="Fork me on GitHub">Fork me on GitHub</a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Address } from '@dhealth/sdk';

// internal dependencies
import { WalletService } from '../../../services/WalletService';

@Component({
  components: {}
})
export default class HealthToEarn extends Vue {
  /**
   * The plugin fork URL (Github repository).
   * @var {string}
   */
  protected forkUrl: string = 'https://github.com/dhealthproject/plugin-health-to-earn-strava';

  /**
   * The current signer address.
   * @var {Address}
   */
  protected currentSigner: Address;

  /// region computed properties
  /**
   * Getter for the `authorizeUrl` property. This value should
   * contain the URL to an authorization callback  redirecting
   * to the Strava /oauth/authorize route.
   *
   * @returns {string}
   */
  get authorizeUrl(): string {
    if (!this.currentSigner) {
      return '#';
    }

    const baseUrl = 'https://health-to-earn.web.app/health-to-earn/us-central1/authorize';
    return baseUrl + `?dhealth.address=${this.currentSigner.plain()}`;
  }
  /// end-region computed properties

  /// region component methods
  /**
   * Hook called on creation of the Component (render).
   *
   * @async
   * @returns {void}
   */
  async created() {
    const service = new WalletService();

    // Uses IPC to get current signer address from app store (Vuex)
    this.currentSigner = await service.getCurrentSigner();

    //XXX should poll for status
  }
  /// end-region component methods
}
</script>

<style lang="less" scoped>
@import "./HealthToEarn.less";
@import "./ForkMe.less";
</style>