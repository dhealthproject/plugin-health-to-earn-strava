import * as admin from "firebase-admin";

const serviceAccount = require('../../../../.firebaseAuth.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Firestore utility class.
 */
export class FirestoreUtil {
  /**
   * Firestore Util constructor.
   * @return {void}
   */
  constructor() {
    return;
  }

  /**
   * Get a document from collection.
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
