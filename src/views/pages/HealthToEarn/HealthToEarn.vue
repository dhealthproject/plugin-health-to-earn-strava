<!--
/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
-->
<template>
  <div class="dhealth-plugin-health-to-earn-container">
    <div class="dashboard-left-container">

      <div class="health-to-earn-container">
        <NavigationLinks
          :direction="'horizontal'"
          :items="['Health to Earn']"
          :current-item-index="activeSubpage"
          @selected="(i) => (activeSubpage = i)"
        />

        <div v-if="activeSubpage === subpageIndexes['healthToEarn']" class="subpage-field">
          <RewardsDashboard
            v-if="!isLoadingWallet"
            :account="currentSigner"
            :factory="repositoryFactory"
          />
        </div>
      </div>
      <div class="health-to-earn-footer">
        <p class="text-miniature">
          <i>Disclaimer: This showcase is presented by dHealth Network and <b>does not</b> make the object of any partnership or cooperation between dHealth and Strava&trade;.</i>
        </p>
      </div>
    </div>
    <div class="dashboard-right-container">
      <div class="title">
        <span class="title_txt">{{ 'Plugin details' }}</span>
      </div>
      <p>
        This plugin illustrates a Health-to-Earn showcase on dHealth Network powered by Strava. 
      </p>
      <p>
        This dapp distributes rewards directly to your dHealth Wallet for activities completed on Strava. 
      </p>
      <p>
        Authorize our Strava App and start earning DHP for your daily activities.
      </p>

      <hr class="separator" />

      <p>
        As this showcase is open source, don't hesitate to make your own social integrations with dHealth Network!
      </p>
      <p class="mt40" style="text-align: center;"><a href="https://health-to-earn.web.app" target="_blank">Website</a></p>

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
import { Address, RepositoryFactoryHttp } from '@dhealth/sdk';
import { NavigationLinks } from '@dhealth/wallet-components';

// internal dependencies
import { WalletService } from '../../../services/WalletService';

// internal child components
import RewardsDashboard from '../RewardsDashboard/RewardsDashboard.vue';

@Component({
  components: {
    NavigationLinks,
    RewardsDashboard,
  }
})
export default class HealthToEarn extends Vue {
  /**
   * The plugin fork URL (Github repository).
   * @var {string}
   */
  protected forkUrl: string = 'https://github.com/dhealthproject/plugin-health-to-earn-strava';

  /**
   * The blockchain network repository factory.
   * @var {RepositoryFactoryHttp}
   */
  protected repositoryFactory: RepositoryFactoryHttp;

  /**
   * The current signer address.
   * @var {Address}
   */
  protected currentSigner: Address;

  /**
   * List of available subpages.
   * @var {{[k: string]: number}}
   */
  protected subpageIndexes: { [k: string]: number } = {
    healthToEarn: 0,
  };

  /**
   * The currently selected subpage.
   * @var {number}
   */
  protected selectedSubpage: number = 0;

  /**
   * Whether the component is currently loading
   * the wallet information.
   * @var {boolean}
   */
  protected isLoadingWallet: boolean = true;

  /// region computed properties
  /**
   * Getter for the currently active subpage.
   * @returns {number}
   */
  public get activeSubpage() {
    return this.selectedSubpage;
  }

  /**
   * Setter for the currently active subpage.
   *
   * @param   {number}  index
   * @returns {void}
   */
  public set activeSubpage(index) {
    const numSubpages = Object.keys(this.subpageIndexes).length;
    if (index < 0 || index >= numSubpages) {
      index = 0;
    }

    this.selectedSubpage = index;
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

    // Uses IPC to get repository factory from app store (Vuex)
    this.repositoryFactory = await service.getRepositoryFactory();

    // Uses IPC to get current signer address from app store (Vuex)
    this.currentSigner = await service.getCurrentSigner();
    this.isLoadingWallet = false;
  }
  /// end-region component methods
}
</script>

<style lang="less" scoped>
@import "./HealthToEarn.less";
</style>