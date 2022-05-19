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
import * as admin from "firebase-admin";
const db = admin.firestore();

/**
 * Firestore utility class.
 */
export class FirestoreUtil {
  /**
   * Get a document from collection.
   *
   * @access public
   * @static
   * @async
   * @param {string} collectionName
   * @param {string} documentId
   * @return {Promise<DocumentSnapshot<DocumentData>>}
   */
  public static async getDocumentInCollection(
      collectionName: string, documentId: string
  ): Promise<admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>> {
    const collectionRef = db.collection(collectionName).doc(documentId);
    const doc = await collectionRef.get();
    return doc;
  }

  /**
   * Get some/all documents from collection.
   *
   * @access public
   * @static
   * @async
   * @param {string} collectionName
   * @param {string | FieldPath} orderBy
   * @param {"asc" | "desc"} sortOrder
   * @param {number} limit
   * @return {Promise<QuerySnapshot<DocumentData>>} result snapshot
   */
  public static async getDocumentsInCollection(
      collectionName: string,
      orderBy?: string | admin.firestore.FieldPath,
      sortOrder?: "asc" | "desc",
      limit?: number
  ): Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>> {
    const collectionRef = db.collection(collectionName);
    let snapshot;
    if (orderBy && sortOrder && limit) {
      snapshot = await collectionRef
          .orderBy(orderBy, sortOrder).limit(limit).get();
    } else if (orderBy && limit) {
      snapshot = await collectionRef.orderBy(orderBy).limit(limit).get();
    } else if (orderBy) {
      snapshot = await collectionRef.orderBy(orderBy).get();
    } else if (limit) {
      snapshot = await collectionRef.limit(limit).get();
    } else {
      snapshot = await collectionRef.get();
    }
    return snapshot;
  }
}
