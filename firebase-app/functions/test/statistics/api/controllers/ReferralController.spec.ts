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
import { ReferralController } from '../../../../src/statistics/api/controllers';
import { FirestoreUtil } from '../../../../src/statistics/api/utils';

describe('AddressController -->', () => {
  let referralController: ReferralController = new ReferralController();
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
  };

  afterEach(() => {
    sandbox.restore();
  });

  describe('test on getRouter()', () => {
    it('should return correct instance', () => {
      const router = sandbox.mock(Router);
      (referralController as any).router = router;
      const result = referralController.getRouter();
      expect(result).to.equals(router);
    });
  });

  describe('test on getReferrals()', async () => {
    it('should have correct success result', async () => {
      const getReferralsFromFirestoreStub = sandbox
        .stub((referralController as any), 'getReferralsFromFirestore')
        .resolves([]);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (referralController as any).getReferrals(reqMock, resMock);
      expect(getReferralsFromFirestoreStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(200)).to.be.true;
      expect(sendStub.calledOnceWith({success: true, result: []})).to.be.true;
    });

    it('should have correct failure with Error result', async () => {
      const expectedError = new Error('test error');
      const getReferralsFromFirestoreStub = sandbox
        .stub((referralController as any), 'getReferralsFromFirestore')
        .rejects(expectedError);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (referralController as any).getReferrals(reqMock, resMock);
      expect(getReferralsFromFirestoreStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(400)).to.be.true;
      expect(
        sendStub.calledOnceWith({success: false, error: expectedError.message})
      ).to.be.true;
    });

    it('should have correct failure with rejection result', async () => {
      const expectedException = {value: 'test exception'};
      const getReferralsFromFirestoreStub = sandbox
        .stub((referralController as any), 'getReferralsFromFirestore')
        .rejects(expectedException);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (referralController as any).getReferrals(reqMock, resMock);
      expect(getReferralsFromFirestoreStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(400)).to.be.true;
      expect(
        sendStub.calledOnceWith({success: false, error: expectedException})
      ).to.be.true;
    });
  });

  describe('getReferralsFromFirestore', () => {
    it('should have correct flow', async () => {
      const returnDocuments = [
        { data: () => { return { referrer: '1', referral: '2'} } },
        { data: () => { return { referrer: '3', referral: '7'} } }
      ];
      const getDocumentsInCollectionStub = sandbox
        .stub(FirestoreUtil, 'getDocumentsInCollection')
        .resolves(returnDocuments as any);
      await (referralController as any).getReferralsFromFirestore();
      expect(getDocumentsInCollectionStub.calledOnce).to.be.true;
    });

    it('should have correct result', async () => {
      const returnDocuments = [
        { data: () => { return { referrer: '1', referral: '2'} } },
        { data: () => { return { referrer: '1', referral: '3'} } },
        { data: () => { return { referrer: '2', referral: '5'} } },
        { data: () => { return { referrer: '5', referral: '6'} } },
        { data: () => { return { referrer: '6', referral: '8'} } },
        { data: () => { return { referrer: '3', referral: '7'} } }
      ];
      const expectedResult = {
        '1': [
          { referrer: '1', referral: '2'},
          { referrer: '1', referral: '3'}
        ],
        '2': [ { referrer: '2', referral: '5'} ],
        '5': [ { referrer: '5', referral: '6'} ],
        '6': [ { referrer: '6', referral: '8'} ],
        '3': [ { referrer: '3', referral: '7'} ]
      }
      sandbox
        .stub(FirestoreUtil, 'getDocumentsInCollection')
        .resolves(returnDocuments as any);
      const result = await (referralController as any).getReferralsFromFirestore();
      expect(result).to.deep.equals(expectedResult);
    });
  });
});