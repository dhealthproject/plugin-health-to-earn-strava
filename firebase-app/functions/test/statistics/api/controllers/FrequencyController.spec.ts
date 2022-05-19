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

import { Router } from "express";

// internal depenedencies
import * as index from '../../../../src/index';
import { FrequencyController } from '../../../../src/statistics/api/controllers';
import { FirestoreUtil } from '../../../../src/statistics/api/utils';

describe('FrequencyController -->', () => {
  let frequencyController: FrequencyController = new FrequencyController();
  const indexConst = index;
  console.log(indexConst);
  const sandbox = sinon.createSandbox();

  const mockResponse = () => {
    const res: any = {};
    res.status = () => res;
    res.json = () => res;
    res.send = () => res;
    return res;
  };

  const mockRequest = () => {
    const req: any = {};
    return req;
  }

  const mockNow = new Date(Date.UTC(2022, 4, 6, 0, 0, 0, 0));
  beforeEach(() => {
    sandbox.useFakeTimers(mockNow.getTime());
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('test on getRouter()', () => {
    it('should return correct instance', () => {
      const router = sandbox.mock(Router);
      (frequencyController as any).router = router;
      const result = frequencyController.getRouter();
      expect(result).to.equals(router);
    });
  });

  describe('test on getTotalRewards7Days()', async () => {
    it('should have correct success result', async () => {
      const get7DaysTransactionsStub = sandbox
        .stub((frequencyController as any), 'get7DaysTransactions')
        .resolves([]);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (frequencyController as any).getTotalRewards7Days(reqMock, resMock);
      expect(get7DaysTransactionsStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(200)).to.be.true;
      expect(sendStub.calledOnceWith({success: true, result: []})).to.be.true;
    });

    it('should have correct failure with Error result', async () => {
      const expectedError = new Error('test error');
      const get7DaysTransactionsStub = sandbox
        .stub((frequencyController as any), 'get7DaysTransactions')
        .rejects(expectedError);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (frequencyController as any).getTotalRewards7Days(reqMock, resMock);
      expect(get7DaysTransactionsStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(400)).to.be.true;
      expect(
        sendStub.calledOnceWith({success: false, error: expectedError.message})
      ).to.be.true;
    });

    it('should have correct failure with rejection result', async () => {
      const expectedException = {value: 'test exception'};
      const get7DaysTransactionsStub = sandbox
        .stub((frequencyController as any), 'get7DaysTransactions')
        .rejects(expectedException);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (frequencyController as any).getTotalRewards7Days(reqMock, resMock);
      expect(get7DaysTransactionsStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(400)).to.be.true;
      expect(
        sendStub.calledOnceWith({success: false, error: expectedException})
      ).to.be.true;
    });
  });

  describe('test on get7DaysTransactions()', () => {
    it('should have correct flow and result', async () => {
      const formatDateStub = sandbox
        .stub((frequencyController as any), 'formatDate')
        .onCall(0).returns('1')
        .onCall(1).returns('2')
        .onCall(2).returns('3')
        .onCall(3).returns('4')
        .onCall(4).returns('5')
        .onCall(5).returns('6')
        .returns('7');
      const expectedResult: any = {};
      const getDocumentInCollectionStub = sandbox
        .stub(FirestoreUtil, 'getDocumentInCollection');
      for (let i = 0; i < 7; i++) {
        const returnDocument = { amount: i + 1, count: i + 1 };
        getDocumentInCollectionStub.onCall(i).resolves({ data: () => returnDocument } as any);
        expectedResult[i + 1] = {
          averageReward: 1,
          totalRewards: i + 1,
          totalTransactions: i + 1
        };
      }
      const result = await (frequencyController as any).get7DaysTransactions();
      expect(formatDateStub.callCount).to.equals(7);
      const myCurrentDate = new Date();
      for (let i = 1; i <= 7; i++) {
        const myPastDate=new Date(myCurrentDate);
        myPastDate.setDate(myPastDate.getDate() - i);
        expect(formatDateStub.calledOnceWith(myPastDate));
        expect(getDocumentInCollectionStub.calledOnceWith("transactions-async-by-date", String(i)));
      }
      expect(result).to.deep.equals(expectedResult);
    });
  });

  describe('test on formatDate()', () => {
    it('should have correct flow', () => {
      const date = new Date();
      const getUTCMonthStub = sandbox.stub(date, 'getUTCMonth').returns(0);
      const getUTCDateStub = sandbox.stub(date, 'getUTCDate').returns(1);
      const getUTCFullYearStub = sandbox.stub(date, 'getUTCFullYear').returns(2022);
      (frequencyController as any).formatDate(date);
      expect(getUTCMonthStub.calledOnce).to.be.true;
      expect(getUTCDateStub.calledOnce).to.be.true;
      expect(getUTCFullYearStub.calledOnce).to.be.true;
    });

    it('should have correct result with 2-digits month and day', () => {
      sandbox.restore();
      const mockTime = new Date(Date.UTC(2022, 10, 19, 0, 0, 0, 0));
      sandbox.useFakeTimers(mockTime.getTime());
      const date = new Date();
      const expectedResult = '20221119';
      const result = (frequencyController as any).formatDate(date);
      expect(result).to.equals(expectedResult);
    });

    it('should have correct result with 1-digit month and day', () => {
      const date = new Date();
      const expectedResult = '20220506';
      const result = (frequencyController as any).formatDate(date);
      expect(result).to.equals(expectedResult);
    });
  });
});