import { TransactionGroup, Transaction, NetworkType, Order, RepositoryFactoryHttp, TransferTransaction, TransactionType, AggregateTransactionInfo, TransactionHttp, AggregateTransaction } from '@dhealth/sdk';
import { NetworkUtil, TransactionUtil } from 'dhealth-utils';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const serviceAccount = require('../../../.firebaseAuth.json');

//==========================================================
// Initialize Firebase
//==========================================================
admin.initializeApp({
  // projectId: 'health-to-earn',
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

export class TransactionSaverCronJob {
  readonly nodes = [
    new RepositoryFactoryHttp('http://dhealth-01.symbol.ninja:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dhealth.vistiel-arch.jp:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dhealth.roche.com:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://api-01.dhealth.cloud:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://api-02.dhealth.cloud:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dhealth.shizuilab.com:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dual-01.dhealth.jp:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dual-01.dhealth.cloud:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dual-02.dhealth.cloud:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dual-03.dhealth.cloud:3000').createBlockRepository(),

    new RepositoryFactoryHttp('http://02.dhp.symbolist.jp:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://occamnauts.kindstakepool.com:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dhealth-gateway.ubc.digital:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dhp.domai-max.com:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://kawaii-dhp-harvest.tokyo:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://0-0-0-1.natterer.tech:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dhealth01.harvestasya.com:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://01.dhp.symsym.info:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://dh.newecosym.com:3000').createBlockRepository(),
    new RepositoryFactoryHttp('http://marichi-featuring-essan.ml:3000').createBlockRepository(),
  ];

  private readonly DAPP_PUBKEY = '71BC0DB348A25D163290C44EF863B031FD5251D4E3674DCE37D78FE6C5F8E0FE';
  // private readonly DAPP_WALLET = 'NDAPPH6ZGD4D6LBWFLGFZUT2KQ5OLBLU32K3HNY';
  private readonly DONATION_RECEIVER_WALLET = 'NDON2AI5X6PRXYDRUB6HPFCGOBZIDYS2R4MSSHY';
  private readonly pageSize = 60;
  private readonly noOfPagesToCheckInOneGo = this.nodes.length;

  private state = {
    page: 1,
    latestProccessedTxHashDB: '',
    latestProccessedTxHash: '',
    blockIndex: new Map<string, number>(),
    nodeCursor: 0,

    clear: () => {
      this.state.page = 1;
      this.state.latestProccessedTxHashDB = '';
      this.state.latestProccessedTxHash = '';
      this.state.blockIndex = new Map<string, number>();
      this.state.nodeCursor = 0;
    }
  }

  async run() {
    await this.getAndSaveTransactions();
    this.state.clear();
  }

  async getAndSaveTransactions() {
    const start = new Date().getTime();
    this.state.latestProccessedTxHashDB = (await this.getLatestProccessedTxHash())?.value;
    // if (!latestProccessedTxHashDB) noOfPagesToCheckInOneGo = nodes.length;
    while(true) {
      const finished = await this.processTxsFromBlockchain(this.state.page, this.pageSize);
      if (finished) break;
      this.state.page += this.noOfPagesToCheckInOneGo;
    }
    await db.collection('transactions-async').doc('--latestHash--').set({ value: this.state.latestProccessedTxHash });
    const end = new Date().getTime();
    const runtime = end - start;
    functions.logger.log(`[DEBUG] Runtime: ${runtime / 1000}s`);
  }

  async processTxsFromBlockchain(page: number, pageSize: number): Promise<boolean> {
    let outgoingTxs: Promise<Transaction[]>[] = [];
    for(let i = page; i < page + this.noOfPagesToCheckInOneGo; i++) {
      outgoingTxs.push(TransactionUtil.getTransactions(NetworkType.MAIN_NET, {
          signerPublicKey: this.DAPP_PUBKEY,
          group: TransactionGroup.Confirmed,
          pageNumber: i,
          pageSize: pageSize,
          order: Order.Desc,
          embedded: true
      }));
    }
    return await this.processTxs(pageSize, outgoingTxs);
  }

  async processTxs(pageSize: number, outgoingTxs: Promise<any[]>[]) {
    let finished = false;
    const results: Transaction[][] = await Promise.all(outgoingTxs);
    if (!this.state.latestProccessedTxHash)
      this.state.latestProccessedTxHash = results[0][0].transactionInfo?.hash ?
        results[0][0].transactionInfo.hash : (results[0][0].transactionInfo as AggregateTransactionInfo).aggregateHash;
    const firestoreBatches: Promise<any>[] = [];
    results.some((txList: any[]) => {
      const hash =
        txList[0].transactionInfo.hash ? txList[0].transactionInfo.hash : txList[0].transactionInfo.aggregateHash;
      console.log('proccessing:', hash);
      // stops when txList's length is less than pageSize
      const txHashes = txList.map((tx: any) => {
        if (tx.transactionInfo.hash)
          return tx.transactionInfo.hash
        else if (tx.transactionInfo.aggregateHash)
          return tx.transactionInfo.aggregateHash
      });
      const latestHashIndex = txHashes.indexOf(this.state.latestProccessedTxHashDB);
      finished =
        txList.length < pageSize || latestHashIndex > -1;
      if (latestHashIndex > -1) {
        txList.splice(latestHashIndex, txList.length - latestHashIndex);
      }
      firestoreBatches.push(this.writeToFirestore(txList));
      return finished;
    });
    await Promise.all(firestoreBatches);
    console.log('finished promises');
    return finished;
  }

  async writeToFirestore(items: any[]) {
    // Get a new write batch
    const batch = db.batch();
    const txByDateCountMap = new Map<string, any>();
    await Promise.all(
      items.map(async (item: any) => {
        if (item.type === TransactionType.TRANSFER) {
          // Set the TX value
          let txHash: string = '';
          if (item.transactionInfo.hash) {
            txHash = item.transactionInfo.hash;
          } else if (item.transactionInfo.aggregateHash) {
            txHash = item.transactionInfo.aggregateHash;
            if (item.transactionInfo.index > 0) {
              const activities = this.getActivities(Number(item.mosaics[0].amount));
              const referrer = item.recipientAddress?.address;
              if (activities && referrer !== this.DONATION_RECEIVER_WALLET) {
                const txHttp = new TransactionHttp(
                  'http://dual-01.dhealth.cloud:3000',
                );
                const aggregateTx = await txHttp.getTransaction(
                  item.transactionInfo.aggregateHash, TransactionGroup.Confirmed
                ).toPromise();
                const innerTx: any = (aggregateTx as AggregateTransaction).innerTransactions[0] as TransferTransaction;
                const referral = innerTx.recipientAddress.address;
                console.log('referral: ', referral);
                const docRef = db.collection('referrals-async').doc(referral);
                const docSnap = await docRef.get();
                if (docSnap.exists && activities <= docSnap.data()?.activities) {
                  return;
                }
                batch.set(
                  docRef,
                  {referrer: referrer, referral: referral, activities: activities},
                  { merge: true }
                );
              }
              return;
            }
          }
          // console.log('TX index: ', item.transactionInfo.index);
          let timestamp: number;
          try {
            timestamp = await this.getBlockTimestamp(item);
          } catch(err) {
            console.log('err:', err);
            return;
          }
          const dateStr = this.formatDate(new Date(timestamp * 1000));
            txByDateCountMap.set(dateStr, {
            count: txByDateCountMap.get(dateStr) ? txByDateCountMap.get(dateStr).count + 1 : 1,
            amount: txByDateCountMap.get(dateStr) ?
              txByDateCountMap.get(dateStr).amount += Number((item as TransferTransaction).mosaics[0].amount) :
              Number((item as TransferTransaction).mosaics[0].amount)
          });
          const txRefTransactions = db.collection('transactions-async').doc(txHash);
          const itemObj = JSON.parse(TransactionUtil.transactionToJSON(item));
          batch.set(txRefTransactions, itemObj);
          batch.set(
            db.collection('addresses-async').doc((item as TransferTransaction).recipientAddress.plain()),
            {
              transactions: admin.firestore.FieldValue.increment(1),
              amount: admin.firestore.FieldValue.increment(Number((item as TransferTransaction).mosaics[0].amount))
            },
            { merge: true }
          )
        }
      })
    );
    txByDateCountMap.forEach((value, key) => {
      batch.set(
        db.collection('transactions-async-by-date').doc(key),
        {
          count: admin.firestore.FieldValue.increment(value.count),
          amount: admin.firestore.FieldValue.increment(value.amount)
        },
        { merge: true }
      );
    });
    const increment = admin.firestore.FieldValue.increment(items.length);
    batch.set(db.collection('transactions-async').doc('--counter--'), { value: increment }, { merge: true });

    // Commit the batch
    await batch.commit();
  }

  /**
   * Return date formatted in 'yyyyMMdd'.
   * @param {Date} date
   * @return {string} result in string
   */
   formatDate(date: Date): string {
    let month = "" + (date.getUTCMonth() + 1);
    let day = "" + date.getUTCDate();
    const year = date.getUTCFullYear();
    if (month.length < 2) {
        month = "0" + month;
    }
    if (day.length < 2) {
        day = "0" + day;
    }
    return `${year}${month}${day}`;
  }

  async getLatestProccessedTxHash() {
    const docRef = db.collection('transactions-async').doc('--latestHash--');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    } else {
      // doc.data() will be undefined in this case
      functions.logger.error('Cannot find latest hash!');
      return {value: ''};
    }
  }

  async getBlockTimestamp(transaction: Transaction): Promise<number> {
    if (!transaction.transactionInfo) {
      throw new Error("Transaction object doesn't have transactionInfo value");
    }
    const height = transaction.transactionInfo.height;
    const timestampFromIndex = this.state.blockIndex.get(height.toHex());
    if (timestampFromIndex) {
      console.log('return timestamp from index:', timestampFromIndex);
      return timestampFromIndex;
    }
    // const node = nodes[cursor++];
    if (this.state.nodeCursor == this.noOfPagesToCheckInOneGo) this.state.nodeCursor = 0;
    // const repositoryFactory = new RepositoryFactoryHttp(node.url);
    // const blockHttp = repositoryFactory.createBlockRepository();
    const block = await this.nodes[this.state.nodeCursor++].getBlockByHeight(height).toPromise();
    const timestamp = NetworkUtil.getNetworkTimestampFromUInt64(NetworkType.MAIN_NET, block.timestamp);
    this.state.blockIndex.set(height.toHex(), timestamp);
    return timestamp;
  }

  getActivities(bonusAmount: number) {
    let result;
    switch(bonusAmount) {
      case 100000:
        result = 1;
        break;
      case 200000:
        result = 3;
        break;
      case 300000:
        result = 5;
        break;
      case 500000:
        result = 10;
        break;
      default:
        break;
    }
    return result;
  }
}