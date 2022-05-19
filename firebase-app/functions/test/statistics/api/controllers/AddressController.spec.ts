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
import * as functions from 'firebase-functions';
import { Router } from "express";

// internal depenedencies
import * as index from '../../../../src/index';
import { AddressController } from '../../../../src/statistics/api/controllers';
import { FirestoreUtil } from '../../../../src/statistics/api/utils';

describe('AddressController -->', () => {
  let addressController: AddressController = new AddressController();
  sinon.stub(console, 'log')  // disable console.log
  sinon.stub(functions.logger, 'log');
  sinon.stub(functions.logger, 'error');
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

  afterEach(() => {
    sandbox.restore();
  });

  describe('test on getRouter()', () => {
    it('should return correct instance', () => {
      const router = sandbox.mock(Router);
      (addressController as any).router = router;
      const result = addressController.getRouter();
      expect(result).to.equals(router);
    });
  });

  describe('test on getTopPaidAddressesRoute()', () => {
    it('should have correct success result', async () => {
      const getTopPaidAddressesStub = sandbox
        .stub((addressController as any), 'getTopPaidAddresses')
        .resolves([]);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (addressController as any).getTopPaidAddressesRoute(reqMock, resMock);
      expect(getTopPaidAddressesStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(200)).to.be.true;
      expect(sendStub.calledOnceWith({success: true, result: []})).to.be.true;
    });

    it('should have correct failure with Error result', async () => {
      const expectedError = new Error('test error');
      const getTopPaidAddressesStub = sandbox
        .stub((addressController as any), 'getTopPaidAddresses')
        .rejects(expectedError);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (addressController as any).getTopPaidAddressesRoute(reqMock, resMock);
      expect(getTopPaidAddressesStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(400)).to.be.true;
      expect(
        sendStub.calledOnceWith({success: false, error: expectedError.message})
      ).to.be.true;
    });

    it('should have correct failure with rejection result', async () => {
      const expectedException = {value: 'test exception'};
      const getTopPaidAddressesStub = sandbox
        .stub((addressController as any), 'getTopPaidAddresses')
        .rejects(expectedException);
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      await (addressController as any).getTopPaidAddressesRoute(reqMock, resMock);
      expect(getTopPaidAddressesStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWith(400)).to.be.true;
      expect(
        sendStub.calledOnceWith({success: false, error: expectedException})
      ).to.be.true;
    });
  });

  describe('test on getTopPaidAddresses()', async () => {
    it('should have correct flow', async () => {
      const data = { amount: 1 };
      const getDocumentsInCollectionStub = sandbox
        .stub(FirestoreUtil, 'getDocumentsInCollection')
        .resolves([{ id: 'test-id', data: () => data }] as any);
      await (addressController as any).getTopPaidAddresses();
      expect(getDocumentsInCollectionStub.calledOnce).to.be.true;
    });

    it('should have correct result', async () => {
      const expectedResult = [
        { address: 'test-id', totalReward: 1 }
      ];
      const data = { amount: 1 };
      const getDocumentsInCollectionStub = sandbox
        .stub(FirestoreUtil, 'getDocumentsInCollection')
        .resolves([{ id: 'test-id', data: () => data }] as any);
      const result = await (addressController as any).getTopPaidAddresses();
      expect(getDocumentsInCollectionStub.calledOnce).to.be.true;
      expect(result).to.deep.equals(expectedResult);
    });
  });
});