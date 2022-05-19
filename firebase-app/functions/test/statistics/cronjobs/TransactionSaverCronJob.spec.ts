/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      dHealth Network <devs@dhealth.foundation>
 * @license     LGPL-3.0
 */
// external dependencies
import { describe } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as admin from "firebase-admin";
import { NetworkUtil, TransactionUtil } from 'dhealth-utils';

// internal depenedencies
import * as index from '../../../src/index';
import { TransactionSaverCronJob } from '../../../src/statistics/cronjobs/TransactionSaverCronJob';
import { of } from 'rxjs';
import { RepositoryFactoryHttp, UInt64 } from '@dhealth/sdk';

describe('TransactionSaverCronJob -->', () => {
  let transactionSaverCronJob: TransactionSaverCronJob
    = new TransactionSaverCronJob();
  const indexConst = index;
  console.log(indexConst);
  const sandbox = sinon.createSandbox();

  const db = admin.firestore();

  const collectionRef = {
    doc: (id: string) => {id},
    limit: (limit: number) => {limit},
    orderBy: (orderBy: string, sortOrder?: 'asc' | 'desc') => {orderBy},
    get: () => { return { exists: true, data: () => { return { activities: 2 } } } },
    set: () => { return; }
  };

  let mockTransaction: any;
  beforeEach(() => {
    (transactionSaverCronJob as any).clearState();
    mockTransaction = {
      deadline: "26188264150",
      maxFee: "0",
      message: "003230323230313236",
      mosaics: [{
        amount: "903825",
        id: "39E0C49FA322A459"
      }],
      network: 104,
      recipientAddress: {
        address: "NAHNWOZU4456WJEIS2FRILODLSEALAHCRPDFNRA",
        networkType: 104
      },
      signature: "7D69851BB7F269C965D2252F29E919AB709DE8EC3ADD370B5402158A3896A597F1FD6948DE108114B1D447E16A4320EC8D79798DD2719D61455B3A925EE6F409",
      signerPublicKey: "71BC0DB348A25D163290C44EF863B031FD5251D4E3674DCE37D78FE6C5F8E0FE",
      type: 16724,
      version: 1,
      transactionInfo: {
        hash:'',
        aggregateHash: "0000C39A62F04D497C38E2143BAF144A8959B4878492FD71B937B8E4EC5DEBF3",
        height: UInt64.fromUint(871887),
        id: "623A1F9E305F1C493859BD7E",
        index: 1,
        merkleComponentHash: "0000C39A62F04D497C38E2143BAF144A8959B4878492FD71B937B8E4EC5DEBF3"
      }
    }
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('test on run()', () => {
    it('should have correct flow', async () => {
      const getAndSaveTransactionsStub = sandbox
        .stub(transactionSaverCronJob, 'getAndSaveTransactions')
        .resolves();
      const clearStateStub = sandbox
        .stub((transactionSaverCronJob as any), 'clearState')
        .returns(null);
      await transactionSaverCronJob.run();
      expect(getAndSaveTransactionsStub.calledOnce).to.be.true;
      expect(clearStateStub.calledOnce).to.be.true;
    });
  });

  describe('test on getAndSaveTransactions()', async () => {
    it('should have correct flow', async () => {
      const getLatestProccessedTxHashStub = sandbox
        .stub(transactionSaverCronJob, 'getLatestProccessedTxHash')
        .resolves({ value: 'some_hash' });
      const processTxsFromBlockchainStub = sandbox
        .stub(transactionSaverCronJob, 'processTxsFromBlockchain')
        .onCall(0).resolves(false)
        .onCall(1).resolves(true);
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      await transactionSaverCronJob.getAndSaveTransactions();
      expect(getLatestProccessedTxHashStub.calledOnce).to.be.true;
      expect(processTxsFromBlockchainStub.callCount).to.equals(2);
      expect(collectionStub.calledOnce).to.be.true;
      expect(docStub.calledOnce).to.be.true;
      expect(setStub.calledOnce).to.be.true;
      expect(
        (transactionSaverCronJob as any).state.page
      ).to.equals(1 + (transactionSaverCronJob as any).nodes.length);
    });

    it('should have correct flow with no latest hash', async () => {
      const getLatestProccessedTxHashStub = sandbox
        .stub(transactionSaverCronJob, 'getLatestProccessedTxHash')
        .resolves(undefined);
      const processTxsFromBlockchainStub = sandbox
        .stub(transactionSaverCronJob, 'processTxsFromBlockchain')
        .resolves(true);
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      await transactionSaverCronJob.getAndSaveTransactions();
      expect(getLatestProccessedTxHashStub.calledOnce).to.be.true;
      expect(processTxsFromBlockchainStub.calledOnce).to.be.true;
      expect(collectionStub.calledOnce).to.be.true;
      expect(docStub.calledOnce).to.be.true;
      expect(setStub.calledOnce).to.be.true;
    });
  });

  describe('test on processTxsFromBlockchain()', () => {
    it('should have correct flow and result', async () => {
      sandbox
        .stub(TransactionUtil, 'getTransactions')
        .resolves([]);
      const processTxsStub = sandbox
        .stub(transactionSaverCronJob, 'processTxs')
        .resolves(true);
      const result =
        await (transactionSaverCronJob as any).processTxsFromBlockchain(1, 1);
      expect(processTxsStub.calledOnce).to.be.true;
      expect(result).to.equals(true);
    });
  });

  describe('test on processTxs()', () => {
    it('should have correct flow', async () => {
      const returnedResult = [
        [{ transactionInfo: { hash: 'hash' } }]
      ];
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves(returnedResult);
      const writeToFirestoreStub = sandbox
        .stub(transactionSaverCronJob, 'writeToFirestore')
        .resolves();
      const result = await transactionSaverCronJob.processTxs(
        60, []
      );
      expect(promiseAllStub.callCount).to.equals(2);
      expect(writeToFirestoreStub.calledOnce).to.be.true;
      expect(result).to.be.true;
    });

    it('should have correct flow when latestProccessedTxHash is available', async () => {
      const returnedResult = [
        [
          { transactionInfo: { aggregateHash: 'hash' } },
          { transactionInfo: { hash: 'latest-hash' } }
        ]
      ];
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves(returnedResult);
      const writeToFirestoreStub = sandbox
        .stub(transactionSaverCronJob, 'writeToFirestore')
        .resolves();
      (transactionSaverCronJob as any)
        .state.latestProccessedTxHash = 'some-hash';
      const result = await transactionSaverCronJob.processTxs(
        2, []
      );
      expect(promiseAllStub.callCount).to.equals(2);
      expect(writeToFirestoreStub.calledOnce).to.be.true;
      expect(result).to.be.false;
    });

    it('should have correct flow when latestProccessedTxHashDB is available', async () => {
      const returnedResult = [
        [
          { transactionInfo: { aggregateHash: 'hash' } },
          { transactionInfo: { hash: 'latest-hash' } }
        ]
      ];
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves(returnedResult);
      const writeToFirestoreStub = sandbox
        .stub(transactionSaverCronJob, 'writeToFirestore')
        .resolves();
      (transactionSaverCronJob as any)
        .state.latestProccessedTxHashDB = 'latest-hash';
      const result = await transactionSaverCronJob.processTxs(
        2, []
      );
      expect(promiseAllStub.callCount).to.equals(2);
      expect(writeToFirestoreStub.calledOnce).to.be.true;
      expect(result).to.be.true;
    });

    it('should have correct flow when aggregateHash is available', async () => {
      const returnedResult = [
        [{ transactionInfo: { aggregateHash: 'hash' } }]
      ];
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves(returnedResult);
      const writeToFirestoreStub = sandbox
        .stub(transactionSaverCronJob, 'writeToFirestore')
        .resolves();
      const result = await transactionSaverCronJob.processTxs(
        60, []
      );
      expect(promiseAllStub.callCount).to.equals(2);
      expect(writeToFirestoreStub.calledOnce).to.be.true;
      expect(result).to.be.true;
    });

    it('should have correct flow when no hash is available', async () => {
      const returnedResult = [
        [{ transactionInfo: {} }]
      ];
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves(returnedResult);
      const writeToFirestoreStub = sandbox
        .stub(transactionSaverCronJob, 'writeToFirestore')
        .resolves();
      const result = await transactionSaverCronJob.processTxs(
        60, []
      );
      expect(promiseAllStub.callCount).to.equals(2);
      expect(writeToFirestoreStub.calledOnce).to.be.true;
      expect(result).to.be.true;
    });

    it('should have correct flow when no transactionInfo', async () => {
      const cronSpied = sandbox.spy(transactionSaverCronJob);
      const returnedResult = [
        [{ transactionInfo: null }]
      ];
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves(returnedResult);
      await cronSpied.processTxs(
        60, []
      ).catch(() => {
        expect(promiseAllStub.calledOnce).to.be.true;
      });
    });
  });

  describe('test on writeToFirestore()', () => {
    it('should have correct flow on empty list', async () => {
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      }
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(undefined);
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .resolves({} as any);
      const formatDateStub = sandbox
        .stub(transactionSaverCronJob, 'formatDate')
        .returns('20221217');
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      sandbox.stub(TransactionUtil, 'transactionToJSON')
        .returns('');
      const batchSetStub = sandbox
        .stub(batchMock, 'set').returns();
      const incrementStub = sandbox
        .stub(admin.firestore.FieldValue, 'increment')
        .returns(batchMock as any);
      const commitStub = sandbox.stub(batchMock, 'commit').resolves();
      await transactionSaverCronJob.writeToFirestore([]);
      expect(batchStub.called).to.be.true;
      expect(promiseAllStub.called).to.be.true;
      expect(getActivitiesStub.called).to.be.false;
      expect(getBlockTimestampStub.called).to.be.false;
      expect(formatDateStub.called).to.be.false;
      expect(collectionStub.called).to.be.true;
      expect(docStub.called).to.be.true;
      expect(setStub.called).to.be.false;
      expect(batchSetStub.called).to.be.true;
      expect(incrementStub.called).to.be.true;
      expect(commitStub.called).to.be.true;
    });

    it('should have correct flow on non-empty, transfer tx list', async () => {
      mockTransaction.transactionInfo.hash = mockTransaction.transactionInfo.aggregateHash;
      mockTransaction.transactionInfo.aggregateHash = '';
      const inputList = [ mockTransaction ];
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      }
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(1);
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .resolves({} as any);
      const formatDateStub = sandbox
        .stub(transactionSaverCronJob, 'formatDate')
        .returns('20221217');
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      sandbox.stub(TransactionUtil, 'transactionToJSON')
        .returns('{"id": "id"}');
      const batchSetStub = sandbox
        .stub(batchMock, 'set').returns();
      const incrementStub = sandbox
        .stub(admin.firestore.FieldValue, 'increment')
        .returns(batchMock as any);
      const commitStub = sandbox.stub(batchMock, 'commit').resolves();
      await transactionSaverCronJob.writeToFirestore(inputList);
      expect(batchStub.called).to.be.true;
      expect(promiseAllStub.called).to.be.true;
      expect(getActivitiesStub.called).to.be.false;
      expect(getBlockTimestampStub.called).to.be.true;
      expect(formatDateStub.called).to.be.true;
      expect(collectionStub.called).to.be.true;
      expect(docStub.called).to.be.true;
      expect(setStub.called).to.be.false;
      expect(batchSetStub.called).to.be.true;
      expect(incrementStub.called).to.be.true;
      expect(commitStub.called).to.be.true;
    });

    it('should have correct flow on non-empty, aggregate tx index 0 list', async () => {
      mockTransaction.transactionInfo.index = 0;
      const inputList = [ mockTransaction, mockTransaction ];
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      };
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(1);
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .resolves({} as any);
      const formatDateStub = sandbox
        .stub(transactionSaverCronJob, 'formatDate')
        .returns('20221217');
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      sandbox.stub(TransactionUtil, 'transactionToJSON')
        .returns('');
      const batchSetStub = sandbox
        .stub(batchMock, 'set').returns();
      const incrementStub = sandbox
        .stub(admin.firestore.FieldValue, 'increment')
        .returns(batchMock as any);
      const commitStub = sandbox.stub(batchMock, 'commit').resolves();
      await transactionSaverCronJob.writeToFirestore(inputList);
      expect(batchStub.called).to.be.true;
      expect(promiseAllStub.called).to.be.true;
      expect(getActivitiesStub.called).to.be.false;
      expect(getBlockTimestampStub.called).to.be.true;
      expect(formatDateStub.called).to.be.true;
      expect(collectionStub.called).to.be.true;
      expect(docStub.called).to.be.true;
      expect(setStub.called).to.be.false;
      expect(batchSetStub.called).to.be.true;
      expect(incrementStub.called).to.be.true;
      expect(commitStub.called).to.be.true;
    });

    it('should have correct flow on non-empty, aggregate tx index 1 list', async () => {
      const inputList = [ mockTransaction, mockTransaction, mockTransaction ];
      const txHttpMock = {
        getTransaction: () => {
          return of();
        }
      };
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      }
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(1);
      (transactionSaverCronJob as any).txHttp = txHttpMock;
      const getTransactionStub = sandbox
          .stub(txHttpMock, 'getTransaction')
          .returns(of({
            innerTransactions: [ mockTransaction, mockTransaction ]
          }));
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .resolves({} as any);
      const formatDateStub = sandbox
        .stub(transactionSaverCronJob, 'formatDate')
        .returns('20221217');
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      const getResult = { exists: true, data: () => { return {} }};
      sandbox.stub(getResult, 'data').returns({ activities: 2 });
      sandbox
        .stub(collectionRef, 'get')
        .onCall(0).resolves({exists: false})
        .onCall(1).resolves({exists: true, data: () => {return null}})
        .resolves(getResult);
      sandbox.stub(TransactionUtil, 'transactionToJSON')
        .returns('');
      const batchSetStub = sandbox
        .stub(batchMock, 'set').returns();
      const incrementStub = sandbox
        .stub(admin.firestore.FieldValue, 'increment')
        .returns(batchMock as any);
      const commitStub = sandbox.stub(batchMock, 'commit').resolves();
      await transactionSaverCronJob.writeToFirestore(inputList);
      expect(batchStub.called).to.be.true;
      expect(promiseAllStub.called).to.be.true;
      expect(getActivitiesStub.called).to.be.true;
      expect(getTransactionStub.called).to.be.true;
      expect(getBlockTimestampStub.called).to.be.false;
      expect(formatDateStub.called).to.be.false;
      expect(collectionStub.called).to.be.true;
      expect(docStub.called).to.be.true;
      expect(setStub.called).to.be.false;
      expect(batchSetStub.called).to.be.true;
      expect(incrementStub.called).to.be.true;
      expect(commitStub.called).to.be.true;
    });

    it('should have correct flow on non-empty, non transfer tx list', async () => {
      mockTransaction.type = 123;
      const inputList = [ mockTransaction ];
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      }
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(1);
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .resolves({} as any);
      const formatDateStub = sandbox
        .stub(transactionSaverCronJob, 'formatDate')
        .returns('20221217');
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      sandbox.stub(TransactionUtil, 'transactionToJSON')
        .returns('');
      const batchSetStub = sandbox
        .stub(batchMock, 'set').returns();
      const incrementStub = sandbox
        .stub(admin.firestore.FieldValue, 'increment')
        .returns(batchMock as any);
      const commitStub = sandbox.stub(batchMock, 'commit').resolves();
      await transactionSaverCronJob.writeToFirestore(inputList);
      expect(batchStub.called).to.be.true;
      expect(promiseAllStub.called).to.be.true;
      expect(getActivitiesStub.called).to.be.false;
      expect(getBlockTimestampStub.called).to.be.false;
      expect(formatDateStub.called).to.be.false;
      expect(collectionStub.called).to.be.true;
      expect(docStub.called).to.be.true;
      expect(setStub.called).to.be.false;
      expect(batchSetStub.called).to.be.true;
      expect(incrementStub.called).to.be.true;
      expect(commitStub.called).to.be.true;
    });

    it('should have correct flow on non-empty, donation tx list', async () => {
      mockTransaction.recipientAddress.address =
        (transactionSaverCronJob as any).DONATION_RECEIVER_WALLET;
      const inputList = [ mockTransaction ];
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      }
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(1);
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .resolves({} as any);
      const formatDateStub = sandbox
        .stub(transactionSaverCronJob, 'formatDate')
        .returns('20221217');
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const setStub = sandbox
        .stub(collectionRef, 'set').resolves();
      sandbox.stub(TransactionUtil, 'transactionToJSON')
        .returns('');
      const batchSetStub = sandbox
        .stub(batchMock, 'set').returns();
      const incrementStub = sandbox
        .stub(admin.firestore.FieldValue, 'increment')
        .returns(batchMock as any);
      const commitStub = sandbox.stub(batchMock, 'commit').resolves();
      await transactionSaverCronJob.writeToFirestore(inputList);
      expect(batchStub.called).to.be.true;
      expect(promiseAllStub.called).to.be.true;
      expect(getActivitiesStub.called).to.be.true;
      expect(getBlockTimestampStub.called).to.be.false;
      expect(formatDateStub.called).to.be.false;
      expect(collectionStub.called).to.be.true;
      expect(docStub.called).to.be.true;
      expect(setStub.called).to.be.false;
      expect(batchSetStub.called).to.be.true;
      expect(incrementStub.called).to.be.true;
      expect(commitStub.called).to.be.true;
    });

    it('should have correct flow on non-empty, non transfer non hash tx list', async () => {
      mockTransaction.transactionInfo.aggregateHash = '';
      const inputList = [ mockTransaction ];
      await transactionSaverCronJob.writeToFirestore(inputList)
    });

    it('should have correct flow on error in getBlockTimestamp()', async () => {
      mockTransaction.transactionInfo.index = 0;
      const inputList = [ mockTransaction ];
      const batchMock = {
        set: (txRef: any, data: any, options: any) => { return },
        commit: () => { return }
      }
      const batchStub = sandbox
        .stub(db, 'batch').returns(batchMock as any);
      const promiseAllStub = sandbox
        .stub(Promise, 'all').resolves();
      const getActivitiesStub = sandbox
        .stub(transactionSaverCronJob, 'getActivities')
        .returns(1);
      const getBlockTimestampStub = sandbox
        .stub(transactionSaverCronJob, 'getBlockTimestamp')
        .rejects(new Error('test error'));
      await transactionSaverCronJob.writeToFirestore(inputList)
      .catch((err: Error) => {
        expect(err.message).to.equals('test error');
        expect(batchStub.called).to.be.true;
        expect(promiseAllStub.called).to.be.true;
        expect(getActivitiesStub.called).to.be.false;
        expect(getBlockTimestampStub.called).to.be.false;
      })
    });
  });

  describe('test on formatDate()', () => {
    it('should have correct flow with 1 digit month & date', () => {
      const dateInput = new Date();
      const getUTCMonthStub = sandbox
        .stub(dateInput, 'getUTCMonth').returns(0);
      const getUTCDateStub = sandbox
        .stub(dateInput, 'getUTCDate').returns(1);
      const getUTCFullYearStub = sandbox
        .stub(dateInput, 'getUTCFullYear').returns(2322);
      transactionSaverCronJob.formatDate(dateInput);
      expect(getUTCMonthStub.calledOnce).to.be.true;
      expect(getUTCDateStub.calledOnce).to.be.true;
      expect(getUTCFullYearStub.calledOnce).to.be.true;
    });

    it('should have correct flow with 2 digits month & date', () => {
      const dateInput = new Date();
      const getUTCMonthStub = sandbox
        .stub(dateInput, 'getUTCMonth').returns(11);
      const getUTCDateStub = sandbox
        .stub(dateInput, 'getUTCDate').returns(10);
      const getUTCFullYearStub = sandbox
        .stub(dateInput, 'getUTCFullYear').returns(2322);
      transactionSaverCronJob.formatDate(dateInput);
      expect(getUTCMonthStub.calledOnce).to.be.true;
      expect(getUTCDateStub.calledOnce).to.be.true;
      expect(getUTCFullYearStub.calledOnce).to.be.true;
    });

    it('should have correct result', () => {
      const dateInput = new Date(Date.UTC(2022, 0, 1, 0, 0, 0));
      const result = transactionSaverCronJob.formatDate(dateInput);
      expect(result).equals('20220101');
    });
  });

  describe('test on getLatestProccessedTxHash()', () => {
    it('should have correct flow and result when exits', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').resolves(
          { exists: true, data: () => {return {value: 'val'}}}
        );
        const result = await transactionSaverCronJob.getLatestProccessedTxHash();
        expect(collectionStub.calledOnceWith('transactions-async')).to.be.true;
        expect(docStub.calledOnceWith('--latestHash--')).to.be.true;
        expect(getStub.calledOnce).to.be.true;

        expect(result).to.deep.equals({value: 'val'});
    });

    it('should have correct flow and result when not exits', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').resolves({ exists: false });
      const result = await transactionSaverCronJob.getLatestProccessedTxHash();
      expect(collectionStub.calledOnceWith('transactions-async')).to.be.true;
      expect(docStub.calledOnceWith('--latestHash--')).to.be.true;
      expect(getStub.calledOnce).to.be.true;

      expect(result).to.deep.equals({value: ''});
    });
  });

  describe('test on getBlockTimestamp()', async () => {
    it('should have correct flow and result', async () => {
      (transactionSaverCronJob as any).nodes = [
        new RepositoryFactoryHttp('').createBlockRepository(),
        new RepositoryFactoryHttp('').createBlockRepository()
      ];
      const nodes = (transactionSaverCronJob as any).nodes;
      (transactionSaverCronJob as any).state.nodeCursor = 1;
      (transactionSaverCronJob as any).noOfPagesToCheckInOneGo = 2;
      const getBlockByHeightStub = sandbox
        .stub(nodes[0], 'getBlockByHeight')
        .returns(of(1));
      const getBlockByHeightStub2 = sandbox
        .stub(nodes[1], 'getBlockByHeight')
        .returns(of(2));
      const getNetworkTimestampFromUInt64Stub = sandbox
        .stub(NetworkUtil, 'getNetworkTimestampFromUInt64')
        .onCall(0).returns(122)
        .returns(123);
      const result = await transactionSaverCronJob.getBlockTimestamp(mockTransaction);
      mockTransaction.transactionInfo.height = UInt64.fromUint(1000);
      const result2 = await transactionSaverCronJob.getBlockTimestamp(mockTransaction);
      expect(getBlockByHeightStub.calledOnce).to.be.true;
      expect(getBlockByHeightStub2.calledOnce).to.be.true;
      expect(getNetworkTimestampFromUInt64Stub.callCount).to.equals(2);
      expect(result).to.equals(122);
      expect(result2).to.equals(123);
    });

    it('should have correct flow and result from cache', async () => {
      const blockIndexMock = new Map();
      blockIndexMock.set(
        '00000000000D4DCF', 123
      );
      (transactionSaverCronJob as any).state.blockIndex = blockIndexMock;
      (transactionSaverCronJob as any).nodes = [
        new RepositoryFactoryHttp('').createBlockRepository()
      ];
      const nodes = (transactionSaverCronJob as any).nodes;
      const getBlockByHeightStub = sandbox
        .stub(nodes[0], 'getBlockByHeight')
        .returns(of(1));
      const getNetworkTimestampFromUInt64Stub = sandbox
        .stub(NetworkUtil, 'getNetworkTimestampFromUInt64')
        .returns(123);
      const result = await transactionSaverCronJob.getBlockTimestamp(mockTransaction);
      expect(getBlockByHeightStub.calledOnce).to.be.false;
      expect(getNetworkTimestampFromUInt64Stub.calledOnce).to.be.false;
      expect(result).to.equals(123);
    });

    it('should have correct flow and error when tx doesn\'t have transactionInfo', async () => {
      mockTransaction.transactionInfo = null;
      await transactionSaverCronJob.getBlockTimestamp(mockTransaction)
      .catch((err: Error) => {
        expect(err.message).to.equals("Transaction object doesn't have transactionInfo value");
      });
      await transactionSaverCronJob.getBlockTimestamp(null as any)
      .catch((err: Error) => {
        expect(err.message).to.equals("Transaction object doesn't have transactionInfo value");
      });
    });
  });

  describe('test on getActivities()', () => {
    it('should have correct result', () => {
      const inputs = [
        100000,
        200000,
        300000,
        500000,
        0,
        300001,
        600000
      ];
      const expectedResult = [
        1, 3, 5, 10
      ];
      for(const input of inputs) {
        const result = transactionSaverCronJob.getActivities(input);
        if (input === 0 || input === 600000) {
          expect(result).to.be.undefined;
        } else {
          expect(result).to.equals(expectedResult[inputs.indexOf(input)]);
        }
      }
    });
  });

  describe('test on clearState()', () => {
    it('should have correct result', () => {
      const expectedResult = {
        page: 1,
        latestProccessedTxHashDB: '',
        latestProccessedTxHash: '',
        blockIndex: new Map<string, number>(),
        nodeCursor: 0
      };
      (transactionSaverCronJob as any).state = {
        test: 'test'
      };
      (transactionSaverCronJob as any).clearState();
      expect(
        (transactionSaverCronJob as any).state
      ).to.deep.equals(expectedResult);
    });
  });
});