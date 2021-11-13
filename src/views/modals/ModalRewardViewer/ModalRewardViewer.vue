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
  <div class="modal-reward-viewer-wrapper">
    <Modal v-model="show" :title="title" :transfer="false" :footer-hide="true">
      <div class="container">

        <p class="dapp-console">
          This reward was sent to you on dHealth Network by the dapp 
          <span class="colored-sec">{{ dappAddress }}</span>.<br /><br />
          The transaction was included in block <span class="colored-sec">#{{ reward.height }}</span>
          which was harvested on <span class="colored-sec">{{ rewardDate }} at {{ rewardTime }}</span>.
        </p>

        <div class="body-text">
          <FormRow class-name="block-height-container mt0 mb0">
            <template v-slot:label>Included in block:</template>
            <template v-slot:inputs>
              <div class="inputs-container with-button">
                <div>
                  <a
                    :href="getExplorerUrl('blocks', reward.height)"
                    target="_blank"
                    title="Open in explorer">#{{ reward.height }}</a>
                </div>
              </div>
            </template>
          </FormRow>

          <FormRow class-name="block-height-container mt0 mb0">
            <template v-slot:label>Transaction details:</template>
            <template v-slot:inputs>
              <div class="inputs-container with-button">
                <div>
                  <a
                    :href="getExplorerUrl('transactions', reward.hash)"
                    target="_blank"
                    title="Open in explorer">{{ shortHash }}</a>
                  <ButtonCopy v-model="reward.hash" />
                </div>
              </div>
            </template>
          </FormRow>

          <FormRow class-name="block-height-container mt0 mb0">
            <template v-slot:label>Rewards earned:</template>
            <template v-slot:inputs>
              <div class="inputs-container with-button">
                <div>
                  <input
                    v-model="rewardAmount"
                    class="input-size input-style"
                    placeholder="Waiting for block information"
                    type="text"
                    disabled="disabled"
                  />
                </div>
              </div>
            </template>
          </FormRow>

          <FormRow class-name="block-height-container mt0 mb0">
            <template v-slot:label>Signature:</template>
            <template v-slot:inputs>
              <div class="inputs-container with-button">
                <IconLoading v-if="isLoadingTransactionInfo" />
                <div v-else>
                  <input
                    v-model="transaction.signature"
                    class="input-size input-style"
                    placeholder="Waiting for block information"
                    type="text"
                    disabled="disabled"
                  />
                  <ButtonCopy v-model="transaction.signature" />
                </div>
              </div>
            </template>
          </FormRow>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
// external dependencies
const BigNumber = require('bignumber.js');
const moment = require('moment');
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChainService, getAccountAddress, getNodeNetwork } from '@dhealth/wallet-api-bridge';
import { ButtonCopy, FormRow, IconLoading } from '@dhealth/wallet-components';
import { BlockInfo, RepositoryFactoryHttp, TransferTransaction } from '@dhealth/sdk';

// internal dependencies
import { RewardDTO, StravaAppService } from '../../../services/StravaAppService';
import { HashShortener } from '../../../Helpers';

@Component({
  components: {
    ButtonCopy,
    FormRow,
    IconLoading,
  }
})
export default class ModalRewardViewer extends Vue {
  /**
   * Modal title
   * @type {string}
   */
  @Prop({ default: '' }) title: string;

  /**
   * Modal visibility state from parent
   * @type {string}
   */
  @Prop({ default: false }) visible: boolean;

  /**
   * Reward received
   * @type {RewardDTO}
   */
  @Prop({ default: undefined }) reward: RewardDTO;

  /**
   * The blockchain network repository factory.
   * @required
   * @var {RepositoryFactoryHttp}
   */
  @Prop({ default: undefined })
  public factory: RepositoryFactoryHttp;

  /**
   * The service handling communication with our
   * firebase cloud functions and rewards.
   * @var {StravaAppService}
   */
  protected stravaApp: StravaAppService;

  /**
   * The loaded transaction information.
   * @var {TransferTransaction}
   */
  protected transaction: TransferTransaction;

  /**
   * The loaded block information.
   * @var {BlockInfo}
   */
  protected block: BlockInfo;

  /**
   * Timestamp of the last rendering event.
   * @var {number}
   */
  protected lastRenderTime: number = new Date().valueOf();

  /**
   * Whether the widget is currently loading
   * the transaction information.
   * @var {boolean}
   */
  protected isLoadingTransactionInfo: boolean = true;

  /**
   * Whether the widget is currently loading
   * the block information.
   * @var {boolean}
   */
  protected isLoadingBlockInfo: boolean = false;

  /**
   * The blockchain network identifier.
   * @var {string}
   */
  protected generationHash: string;

  /**
   * The blockchain epoch adjustment (UTC).
   * @var {string}
   */
  protected epochAdjustment: number;

  /// region computed properties
  /**
   * Internal visibility state
   * @type {boolean}
   */
  public get show(): boolean {
    return this.visible;
  }

  /**
   * Display or hide the modal box.
   *
   * @emits close
   * @param   {boolean}   val
   * @returns {void}
   */
  public set show(val) {
    if (!val) {
      this.$emit('close');
    }
  }

  /**
   * Getter for the reward amount formatted.
   * @returns {string}
   */
  public get rewardAmount(): string {
    return new BigNumber(
      this.reward.amount
    ) + ' DHP';
  }

  /**
   * Getter for a short format of transaction hash.
   * @returns {string}
   */
  public get shortHash(): string {
    return HashShortener(this.reward.hash);
  }

  /**
   * Get UTC timestamp of block.
   * @returns {number}
   */
  public get blockUtcTimestamp(): number {
    return (this.epochAdjustment*1000) + this.block.timestamp.compact();
  }

  /**
   * Getter for the reward date formatted.
   * @returns {string}
   */
  public get rewardDate(): string {
    if (this.isLoadingBlockInfo || !this.block) {
      return 'N/A';
    }

    return moment(this.blockUtcTimestamp).format('Do MMMM YYYY');
  }

  /**
   * Getter for the reward time formatted.
   * @returns {string}
   */
  public get rewardTime(): string {
    if (this.isLoadingBlockInfo || !this.block) {
      return 'N/A';
    }

    return moment(this.blockUtcTimestamp).format('HH:mm');
  }

  /**
   * Getter for the dapp account address.
   * @returns {string}
   */
  public get dappAddress(): string {
    if (! this.stravaApp) {
      return 'N/A';
    }

    return this.stravaApp.getAddress().pretty();
  }
  /// end-region computed properties

  /// region component methods
  /**
   * Hook called on creation of the Component (render).
   * @async
   */
  public async created() {
    this.lastRenderTime = new Date().valueOf();
    this.stravaApp = new StravaAppService(this.factory)

    // uses factory to retrieve a network transaction
    this.transaction = await this.stravaApp.getRewardTransaction(this.reward);
    this.isLoadingTransactionInfo = false;
    this.isLoadingBlockInfo = true;

    // uses factory to retrieve currently connected network
    this.generationHash = await this.factory.getGenerationHash().toPromise();
    this.epochAdjustment = await this.factory.getEpochAdjustment().toPromise();

    // uses factory to retrieve block information
    const repo = this.factory.createBlockRepository();
    this.block = await repo.getBlockByHeight(this.transaction.transactionInfo.height).toPromise();
    this.isLoadingBlockInfo = false;
  }

  /**
   * Builds a explorer URL.
   *
   * @param   {string}  submodule
   * @param   {string}  param
   * @returns {string}
   */
  protected getExplorerUrl(
    submodule: string,
    param: string,
  ): string {
    switch (getNodeNetwork(this.generationHash)) {
      case 'mainnet:dhealth.dhp':
        return `http://explorer.dhealth.cloud/${submodule}/${param}`;

      case 'testnet:dhealth.dhp':
        return `https://explorer-01.dhealth.dev:82/${submodule}/${param}`;

      case 'mainnet:symbol.xym':
        return `http://explorer.symbolblockchain.io/${submodule}/${param}`;
    }

    return `http://explorer.dhealth.cloud/${submodule}/${param}`;
  }
  /// end-region component methods
}
</script>

<style lang="less" scoped>
@import './ModalRewardViewer.less';
</style>
