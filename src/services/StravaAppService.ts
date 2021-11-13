/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn with Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
import Vue from 'vue';
import { Address, MosaicId, NetworkType, Order, PublicAccount, RepositoryFactoryHttp, TransactionGroup, TransactionType, TransferTransaction } from '@dhealth/sdk';
const axios = require('axios').default;

/**
 * @type {RewardDTO}
 * @description This type is used to communicate data
 *              about rewards on the network.
 */
export type RewardDTO = {
  amount: number,
  date: string,
  hash: string,
  height: number,
};

/**
 * @class {StravaAppService}
 * @description This service class provides methods to handle
 *              communication with firebase Strava integration.
 */
export class StravaAppService {
  /**
   * The firebase app base URL.
   * XXX move to plugin settings
   *
   * @var {string}
   */
  protected backendUrl: string = 'https://us-central1-health-to-earn.cloudfunctions.net';

  /**
   * The Health to Earn with Strava dapp account.
   * XXX move to plugin settings
   *
   * @link http://explorer.dhealth.cloud/accounts/NDAPPH6ZGD4D6LBWFLGFZUT2KQ5OLBLU32K3HNY
   * @link http://dual-01.dhealth.cloud:3000/accounts/NDAPPH6ZGD4D6LBWFLGFZUT2KQ5OLBLU32K3HNY
   * @var {PublicAccount}
   */
  protected dapp: PublicAccount = PublicAccount.createFromPublicKey(
    '71BC0DB348A25D163290C44EF863B031FD5251D4E3674DCE37D78FE6C5F8E0FE',
    NetworkType.MAIN_NET
  );

  /**
   * The mosaic identifier of the `dhealth.dhp` mosaic.
   * XXX move to plugin settings
   *
   * @var {MosaicId}
   */
  protected networkMosaicId: MosaicId = new MosaicId('39E0C49FA322A459');

  /// region public API
  /**
  * Constructs a service around a repository
  * \a factory and an optional \a $app Vue
  * component/parent component.
  *
  * @param {RepositoryFactoryHttp} factory
  * @param {Vue} $app
  */
  public constructor(
    protected readonly factory: RepositoryFactoryHttp,
    protected readonly $app?: Vue,
  ) {}

  /**
   * Getter for the dapp account address.
   *
   * @returns {Address}
   */
  public getAddress(): Address {
    return this.dapp.address;
  }

  /**
   * Getter for the `authorizeUrl` property. This value should
   * contain the URL to an authorization callback  redirecting
   * to the Strava /oauth/authorize route.
   *
   * @param   {Address}   account
   * @returns {string}
   */
  public getAuthorizeUrl(account: Address): string {
    const query = `?dhealth.address=${account.plain()}`;
    return `${this.backendUrl}/authorize${query}`;
  }

  /**
   * Returns whether an account is linked or not.
   *
   * An account link happens when a Strava user
   * authorizes the Health to Earn with Strava
   * app using their Strava account.
   *
   * @returns {Promise<boolean>}
   */
  public async getAccountStatus(
    account: Address,
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios
          .get(this.getStatusUrl(account))
          .catch((error) => ({ status: 'response' in error ? error.response.status : 400 }));
        return resolve(response.status === 200);
      }
      catch (err) {
        return resolve(false);
      }
    });
  }

  /**
   * Connects to a node using the factory to request
   * transactions issued by the  Health to Earn with
   * Strava dapp account.
   *
   * @param   {string}  account   The account that receives rewards.
   * @returns {Promise<RewardDTO[]>} A list of transaction contents.
   */
  public async getAccountRewards(
    account: Address,
  ): Promise<RewardDTO[]> {
    return new Promise(async (resolve) => {
      // uses factory to create transaction endpoints client
      const repository = this.factory.createTransactionRepository();

      // requests /transactions/confirmed
      const transactions = await repository.search({
        signerPublicKey: this.dapp.publicKey,
        type: [TransactionType.TRANSFER],
        recipientAddress: account,
        pageSize: 100,
        group: TransactionGroup.Confirmed,
        order: Order.Desc,
      }).toPromise();

      // maps to table fields
      return resolve(transactions.data.map((t: TransferTransaction) => ({
        date: t.message.payload,
        height: t.transactionInfo.height.compact(),
        amount: t.mosaics[0].amount.compact(),
        hash: t.transactionInfo.hash,
      })));
    });
  }

  /**
   * Connects to a node using the factory to request
   * transactions issued by the  Health to Earn with
   * Strava dapp account.
   *
   * @returns {Promise<RewardDTO>} The last reward paid out.
   */
  public async getLastReward(): Promise<RewardDTO> {
    return new Promise(async (resolve) => {
      // uses factory to create transaction endpoints client
      const repository = this.factory.createTransactionRepository();

      // requests /transactions/confirmed
      const transactions = await repository.search({
        signerPublicKey: this.dapp.publicKey,
        type: [TransactionType.TRANSFER],
        pageSize: 1,
        group: TransactionGroup.Confirmed,
        order: Order.Desc,
        transferMosaicId: this.networkMosaicId,
      }).toPromise();

      if (!transactions || !('data' in transactions) || !transactions.data.length) {
        return resolve({ amount: 0, date: 'N/A', hash: 'N/A', height: 0 });
      }

      // maps to table fields
      const transaction = transactions.data[0] as TransferTransaction;
      return resolve({
        date: transaction.message.payload,
        height: transaction.transactionInfo.height.compact(),
        amount: transaction.mosaics[0].amount.compact(),
        hash: transaction.transactionInfo.hash,
      });
    });
  }

  /**
   * Connects to a node using the factory to request
   * transaction details of the reward that was sent
   * by the Health to Earn with Strava dapp account.
   *
   * @param   {RewardDTO}   reward
   * @returns {Promise<TransferTransaction>} The transaction details.
   */
  public async getRewardTransaction(
    reward: RewardDTO,
  ): Promise<TransferTransaction> {
    return new Promise(async (resolve) => {
      // uses factory to create transaction endpoints client
      const repository = this.factory.createTransactionRepository();

      // requests /transactions/confirmed
      const transaction = await repository.getTransaction(
        reward.hash,
        TransactionGroup.Confirmed,
      ).toPromise() ;

      return resolve(transaction as TransferTransaction);
    });
  }

  /// region protected API
  /**
   * Getter for the `statusUrl` property. This value should
   * contain the URL to a status callback that gets  polled
   * to find out the status of an account link by requesting
   * the backend (deployed as Firebase Cloud Functions).
   *
   * @param   {Address}   account
   * @returns {string}
   */
  protected getStatusUrl(account: Address): string {
    const query = `?dhealth.address=${account.plain()}`;
    return `${this.backendUrl}/status${query}`;
  }
  /// end-region protected API
}
