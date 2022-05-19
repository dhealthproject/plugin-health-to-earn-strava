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

// internal depenedencies
import * as index from '../../../../src/index';
import { FirestoreUtil } from '../../../../src/statistics/api/utils';

describe('FirestoreUtil -->', () => {
  const indexConst = index;
  console.log(indexConst);
  const sandbox = sinon.createSandbox();

  const db = admin.firestore();

  const collectionRef = {
    doc: (id: string) => {id},
    limit: (limit: number) => {limit},
    orderBy: (orderBy: string, sortOrder?: 'asc' | 'desc') => {orderBy},
    get: () => {},
  };

  afterEach(() => {
    sandbox.restore();
  });

  describe('test on getDocumentInCollection()', () => {
    it('should have correct flow', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const docStub = sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').returns(collectionRef as any);
      await FirestoreUtil.getDocumentInCollection('test colName', 'test docID');
      expect(collectionStub.calledOnceWith('test colName')).to.be.true;
      expect(docStub.calledOnceWith('test docID')).to.be.true;
      expect(getStub.calledOnce).to.be.true;
    });

    it('should have correct result', async () => {
      sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      sandbox
        .stub(collectionRef, 'doc').returns(collectionRef as any);
      sandbox
        .stub(collectionRef, 'get').returns([] as any);
      const result = await FirestoreUtil.getDocumentInCollection('test colName', 'test docID');
      expect(result).to.deep.equals([]);
    });
  });

  describe('test on getDocumentsInCollection()', () => {
    it('should have correct flow with no orderBy, sortOrder, limit', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').returns(collectionRef as any);
      await FirestoreUtil.getDocumentsInCollection('test collection');
      expect(collectionStub.calledOnceWith('test collection')).to.be.true;
      expect(getStub.calledOnce).to.be.true;
    });

    it('should have correct flow with limit', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const limitStub = sandbox
        .stub(collectionRef, 'limit').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').returns(collectionRef as any);
      await FirestoreUtil
        .getDocumentsInCollection('test collection', undefined, undefined, 1);
      expect(collectionStub.calledOnceWith('test collection')).to.be.true;
      expect(limitStub.calledOnceWith(1)).to.be.true;
      expect(getStub.calledOnce).to.be.true;
    });

    it('should have correct flow with orderBy', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const orderByStub = sandbox
        .stub(collectionRef, 'orderBy').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').returns(collectionRef as any);
      await FirestoreUtil
        .getDocumentsInCollection('test collection', 'test orderBy', undefined, undefined);
      expect(collectionStub.calledOnceWith('test collection')).to.be.true;
      expect(orderByStub.calledOnceWith('test orderBy')).to.be.true;
      expect(getStub.calledOnce).to.be.true;
    });

    it('should have correct flow with orderBy and limit', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const orderByStub = sandbox
        .stub(collectionRef, 'orderBy').returns(collectionRef as any);
      const limitStub = sandbox
        .stub(collectionRef, 'limit').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').returns(collectionRef as any);
      await FirestoreUtil
        .getDocumentsInCollection('test collection', 'test orderBy', undefined, 1);
      expect(collectionStub.calledOnceWith('test collection')).to.be.true;
      expect(orderByStub.calledOnceWith('test orderBy')).to.be.true;
      expect(limitStub.calledOnceWith(1)).to.be.true;
      expect(getStub.calledOnce).to.be.true;
    });

    it('should have correct flow with orderBy, sortOrder and limit', async () => {
      const collectionStub = sandbox
        .stub(db, 'collection').returns(collectionRef as any);
      const orderByStub = sandbox
        .stub(collectionRef, 'orderBy').returns(collectionRef as any);
      const limitStub = sandbox
        .stub(collectionRef, 'limit').returns(collectionRef as any);
      const getStub = sandbox
        .stub(collectionRef, 'get').returns(collectionRef as any);
      await FirestoreUtil
        .getDocumentsInCollection('test collection', 'test orderBy', 'asc', 1);
      expect(collectionStub.calledOnceWith('test collection')).to.be.true;
      expect(orderByStub.calledOnceWith('test orderBy', 'asc')).to.be.true;
      expect(limitStub.calledOnceWith(1)).to.be.true;
      expect(getStub.calledOnce).to.be.true;
    });
  });
});