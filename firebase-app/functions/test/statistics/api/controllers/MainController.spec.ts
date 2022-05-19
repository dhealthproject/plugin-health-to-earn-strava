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
import { MainController } from '../../../../src/statistics/api/controllers';

describe('AddressController -->', () => {
  let mainController: MainController = new MainController();
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
      (mainController as any).router = router;
      const result = mainController.getRouter();
      expect(result).to.equals(router);
    });
  });

  describe('test on getAppInformation()', () => {
    it('should have correct flow', () => {
      const packageJsonMock = { test: 'test' };
      const reqMock = mockRequest();
      const resMock = mockResponse();
      const statusStub = sandbox.stub(resMock, 'status').returns(resMock);
      const sendStub = sandbox.stub(resMock, 'send').returns(resMock);
      (mainController as any).packageJson = packageJsonMock;
      (mainController as any).getAppInformation(reqMock, resMock);
      expect(statusStub.calledOnceWith(200)).to.be.true;
      expect(sendStub.calledOnceWith(packageJsonMock)).to.be.true;
    });
  });
});