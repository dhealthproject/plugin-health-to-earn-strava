/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
// external dependencies
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';
import axios from 'axios';
import { delay } from 'rxjs/operators';
import {
  Account,
  Address,
  AggregateTransaction,
  Crypto,
  Deadline,
  Mosaic,
  MosaicId,
  PlainMessage,
  SignedTransaction,
  TransactionHttp,
  TransferTransaction,
  UInt64,
} from '@dhealth/sdk';

// internal dependencies
import { SkewNormalDistribution } from './math';
import { ReferralBonus } from './referral';

// /!\ CAUTION /!\ 
// /!\ reads service account
// /!\ never checkin this file into a repository.
const serviceAccount = require('../.firebaseAuth.json');

// initializes firebase/firestore
admin.initializeApp({
  projectId: 'health-to-earn',
  credential: admin.credential.cert(serviceAccount),
});

// shortcuts
const NETWORK = require('../config/network.json');
const DATABASE = admin.firestore();
const NDAPP = Account.createFromPrivateKey(
  functions.config().dhealth.account.secret,
  NETWORK.networkIdentifier,
);

// database custom configuration
DATABASE.settings({ ignoreUndefinedProperties: true });

/// region cloud functions
/**
 * @function  status
 * @link      /health-to-earn/us-central1/status
 *
 * Step 0 of the dHealth <> Strava link process.
 *
 * This request handler handles status  requests
 * to find out whether an account link should be
 * done or whether the link already exists.
 *
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
export const status = functions.https.onRequest((request: any, response: any) => {
  // proxies over to correct request handler
  if (request.method !== 'GET') {
    return response.sendStatus(403);
  }

  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /status request with query: ", request.query);

  // param `dhealth.address` is obligatory
  const data = request.query;
  if (!('dhealth.address' in data)) {
    return response.sendStatus(400);
  }

  // parses address to validate content or bail out
  try { Address.createFromRawAddress(data['dhealth.address']) }
  catch (e) { return response.sendStatus(400); }

  // finds user by address
  const users = DATABASE.collection('users');
  users.where('address', '==', data['dhealth.address'])
    .get()
    .then((user: any) => {
      if (!user.empty) {
        // 200 - OK
        return response.sendStatus(200);
      }

      // 404 - Not Found
      return response.sendStatus(404);
    })
    .catch((reason: any) => {
      // traces errors for monitoring
      functions.logger.error("[ERROR] Error happened with Firestore: ", reason);
      return response.sendStatus(500);
    });
});

/**
 * @function  referral
 * @link      /health-to-earn/us-central1/referral
 *
 * Optional step to retrieve referral code.
 * 
 * This request handler handles referral requests
 * and responds with a user's referral code.
 *
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
 export const referral = functions.https.onRequest((request: any, response: any) => {
  // validate HTTP method, must be GET
  if (request.method !== 'GET') {
    return response.sendStatus(403);
  }

  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /referral request with query: ", request.query);

  // param `dhealth.address` is obligatory
  const data = request.query;
  if (!('dhealth.address' in data)) {
    return response.sendStatus(400);
  }

  // parses address to validate content or bail out
  try { Address.createFromRawAddress(data['dhealth.address']) }
  catch (e) { return response.sendStatus(400); }

  // finds user by address
  const users = DATABASE.collection('users');
  users.where('address', '==', data['dhealth.address'])
    .get()
    .then((snapshot: any) => {
      if (snapshot.empty) {
        // 404 - Not Found
        return response.sendStatus(404);
      }

      // read singular user entry
      const entry = snapshot.docs[0];

      // tries to read already existing referral code
      let referralCode = entry.data().referralCode;
      if (!referralCode || !referralCode.length) {
        // generates random 4 bytes referral code
        referralCode = Buffer.from(Crypto.randomBytes(4)).toString('hex');

        // updates firestore entry (users)
        DATABASE.collection('users').doc(entry.id).update({
          referralCode: referralCode
        });
      }

      // 200 - OK
      return response.status(200).json({ referralCode: referralCode });
    })
    .catch((reason: any) => {
      // traces errors for monitoring
      functions.logger.error("[ERROR] Error happened with Firestore: ", reason);
      return response.sendStatus(500);
    });
});

/**
 * @function  authorize
 * @link      /health-to-earn/us-central1/authorize
 *
 * Step 1 of the dHealth <> Strava link process.
 *
 * This request handler handles the authorization of
 * an app in Strava (OAuth).
 *
 * @see https://developers.strava.com/docs/authentication/#requesting-access
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
export const authorize = functions.https.onRequest((request: any, response: any) => {
  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /authorize request with query: ", request.query);

  // param `dhealth.address` is obligatory
  const data = request.query;
  if (!('dhealth.address' in data)) {
    return response.sendStatus(400);
  }

  // parses address to validate content or bail out
  try { Address.createFromRawAddress(data['dhealth.address']) }
  catch (e) { return response.sendStatus(400); }

  // verifies presence on referral code
  const referral = 'ref' in data && data['ref'].length ? `:${data['ref']}` : '';

  // reads environment configuration
  const stravaConf = functions.config().strava;

  // builds the strava OAuth query
  const stravaQuery = `?`
    + `client_id=${stravaConf.client_id}`
    + `&response_type=code`
    + `&approval_prompt=auto`
    + `&scope=activity:read`
    + `&redirect_uri=${encodeURIComponent(stravaConf.oauth_url)}` // should be /link
    + `&state=${data['dhealth.address']}${referral}`; // forwards address and refcode

  return response.redirect(301,
    'https://www.strava.com/oauth/authorize' + stravaQuery
  );
});

/**
 * @function  link
 * @link      /health-to-earn/us-central1/link
 *
 * Step 2 of the dHealth <> Strava link process.
 *
 * This request handler handles the callback of an
 * authorization of an app in Strava (Token Exchange)
 * and redirects the user to a thank you page.
 *
 * @see https://developers.strava.com/docs/authentication/#token-exchange
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
export const link = functions.https.onRequest((request: any, response: any) => {
  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /link request with query: ", request.query);

  // reads request query (GET)
  const data = request.query;

  if ('error' in data && data['error'] === 'access_denied') {
    // traces failures for monitoring
    functions.logger.warn("[WARN] User denied access to app: ", request);
    return response.sendStatus(403);
  }

  if (! ('code' in data) || ! ('scope' in data) || ! ('state' in data)) {
    // malformed link request
    return response.sendStatus(400);
  }

  // splits state param in `ADDRESS:REFERRAL` if necessary
  let stateMatch = data['state'].match(/([A-Z0-9]{39})(\:([a-z0-9]{8}))?/),
      dhpAddress = stateMatch[1],
      referredBy = !!stateMatch[3] ? stateMatch[3] : '';

  // parses address to validate content or bail out
  try { Address.createFromRawAddress(dhpAddress) }
  catch (e) { return response.sendStatus(400); }

  const stravaConf = functions.config().strava;
  const stravaCode = data['code'];
  axios.post('https://www.strava.com/oauth/token', {
    client_id: stravaConf.client_id,
    client_secret: stravaConf.client_secret,
    code: stravaCode,
    grant_type: 'authorization_code'
  })
  .then((res: any) => {
    const athlete = res.data.athlete;
    const address = dhpAddress;

    // generates random 4 bytes referral code
    const referralCode = Buffer.from(Crypto.randomBytes(4)).toString('hex');

    // saves the user in database
    DATABASE.collection('users').doc('' + athlete.id).set({
      address,
      athleteId: athlete.id,
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      accessExpiresAt: res.data.expires_at,
      referredBy: referredBy.toLowerCase(),
      referralCode: referralCode.toLowerCase(),
      countRewards: 0,
      linkedAt: new Date().valueOf(),
    }, { merge: true })
    .then((user: any) => {

      // updates aggregations
      DATABASE.doc('statistics/--counters--').set({
        countUsers: admin.firestore.FieldValue.increment(1),
      }, { merge: true });

      if (!!referredBy && referredBy.length > 0) {
        DATABASE.doc(`statistics/${referredBy}`).set({
          countReferrals: admin.firestore.FieldValue.increment(1),
        }, { merge: true });

        DATABASE.doc('statistics/--counters--').set({
          countReferrals: admin.firestore.FieldValue.increment(1),
        }, { merge: true });
      }

      // ends the link process
      return response.redirect(301,
        'https://health-to-earn.web.app/link.html'
      );
    })
    .catch((reason: any) => {
      // traces errors for monitoring
      functions.logger.error("[ERROR] Error happened with Firestore saving users entry: ", reason);
      return response.sendStatus(500);
    });
  })
  .catch((reason: any) => {
    // traces errors for monitoring
    functions.logger.error("[ERROR] Error calling Strava /oauth/token: ", reason);
    return response.sendStatus(400);
  })
});

/**
 * @function  webhook
 * @link      /health-to-earn/us-central1/webhook
 *
 * Step 3 of the dHealth <> Strava link process.
 *
 * This request handler handles the creation of a
 * webhook subscription for Strava and the follow
 * -up steps whenever an activity is created in a
 * Strava account linked to this app.
 *
 * @see {webhookSubscriptionHandler}
 * @see {webhookEventHandler}
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
export const webhook = functions.https.onRequest(async (request: any, response: any) => {
  // proxies over to correct request handler
  if (request.method === 'GET') {
    return webhookSubscriptionHandler(request, response);
  }
  else if (request.method === 'POST') {
    // @async event handler
    return await webhookEventHandler(request, response);
  }

  // bails out on invalid requests
  return response.sendStatus(403);
});
/// end-region cloud functions

/// region cloud scheduler functions
/**
 * @function  payout
 * @link      /health-to-earn/us-central1/payout
 *
 * This request handler **schedules** a job to run
 * every 20 seconds.  The job checks whether there
 * are  any rewards to be paid out  and marks them 
 * as processed.
 *
 * Caution: This method **must not** be  run using
 * a different system than the cloud scheduler, ie.
 * do not allow the execution of this function with
 * HTTP endpoint calls.
 *
 * @async
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {null|number}         Integer return marks error.
 */
export const payout = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  // finds unprocessed rewards
  const snapshot: any = await DATABASE.collection('rewards')
    .where('isProcessed', '==', false)
    .get();

  // bails out on empty rewards list
  if (snapshot.empty) {
    return null;
  }

  // traces unprocessed rewards found
  functions.logger.log("[DEBUG] Found non-zero unprocessed rewards count: ", snapshot.size);

  // proceeds to payout for each unprocessed reward with delay of 1000ms
  snapshot.forEach((r: any) => getBonusesForReward(r).then(
    b => broadcastRewardPayout(r, b.multiplier, b.referrerBonus).pipe(delay(1000)).subscribe(
      (res: any) => functions.logger.log(
        `[DEBUG] Successfully broadcast transaction for ${r.id}`
      ),
      (err: any) => functions.logger.error(
        `[ERROR] Could not broadcast transaction for ${r.id}, reason: ${err}`
      ),
    )).catch(reason => functions.logger.error(
      `[ERROR] Could not get bonuses for ${r.id}, reason: ${reason}`
    ))
  );
  return null;
});
/// end-region cloud scheduler functions

/// region private API
/**
 * Request handler for GET requests to the cloud function.
 *
 * This method verifies the format of the request payload
 * and returns a 200 success response with the challenge.
 *
 * You can call this handler to verify the availability of 
 * your webhook handler.   Strava calls this endpoint upon
 * creation of a new webhook subscription (once per app).
 *
 * @param   {Request}   request 
 * @param   {Response}  response 
 * @returns {Response}
 */
const webhookSubscriptionHandler = (request: any, response: any) => {
  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /webhook GET request with query: ", request.query);

  // reads request query (GET)
  const data = request.query;

  // params `hub.mode` and `hub.verify_token` are obligatory
  if (!('hub.mode' in data) || !('hub.verify_token' in data)) {
    return response.sendStatus(400);
  }

  // GET handles only subscriptions with correct verify token
  const verify_token = functions.config().strava.verify_token;
  if (data['hub.mode'] !== 'subscribe' || data['hub.verify_token'] !== verify_token) {
    // traces failures for monitoring (malicious request attempts)
    functions.logger.warn("[WARN] Identified malicious request attempt: ", request);
    return response.sendStatus(401);
  }

  // SUCCESS, returns challenge
  return response
    .status(200)
    .json({'hub.challenge': data['hub.challenge']});
};

/**
 * Request handler for POST requests to the cloud function.
 *
 * This method handles incoming Strava activities and other
 * events pushed by Strava on the webhook subscription. The
 * handler stores an entry in `rewards` in case the account
 * created an activity for the first time  on the exact day
 * of the execution.
 *
 * The HTTP response being sent **always** has a 200 status
 * code, this is to avoid being banned by Strava for errors
 * on the callback_url.
 *
 * A message of `EVENT_RECEIVED` will be added as  response
 * in case the event generates a reward. In all other cases
 * a message of `EVENT_IGNORED` wil be added as a response.
 *
 * @async
 * @param   {Request}   request 
 * @param   {Response}  response 
 * @returns {Response}
 */
const webhookEventHandler = async (request: any, response: any) => {
  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /webhook POST request with body: ", request.body);

  // reads request body (POST - should be JSON)
  const data = request.body;

  // validates presence of obligatory parameters
  if (! ('object_type' in data) || ! ('object_id' in data)
   || ! ('aspect_type' in data) || ! ('owner_id' in data)) {
    return response.sendStatus(400);
  }

  // webhook should handle only NEW ACTIVITIES
  if (data['object_type'] !== 'activity' || data['aspect_type'] !== 'create') {
    return response.status(200).send('EVENT_IGNORED');
  }

  // ------
  // Step 0: The webhook handler is **tried**
  try {

    // ------
    // Step 1: searches the user by it's Strava id
    const user: any = await DATABASE.doc(`users/${data['owner_id']}`).get();

    let referrer: any = undefined;
    if ('referredBy' in user.data() && user.data().referredBy.length) {
      referrer = await DATABASE.collection('users')
        .where('referralCode', '==', user.data().referredBy.toLowerCase())
        .get();
    }

    // bails out for unknown ATHLETE
    if (! user.exists) {
      return response.status(200).send('EVENT_IGNORED');
    }

    // prepares rewards entry
    const rewardedDate = new Date();
    const formattedDate = moment(rewardedDate).format('YYYYMMDD');
    const address = user.data().address;
    const athleteId = user.data().athleteId;
    const activityId = data['object_id']; // from Strava

    // index uses date-only and athlete id (one per day).
    // e.g. "20211103-94380856"
    const rewardsId = `${formattedDate}-${athleteId}`;

    // ------
    // Step 2: checks if there is already a rewards entry for today
    const reward: any = await DATABASE.doc(`rewards/${rewardsId}`).get();

    // bails out given existing rewards entry
    if (reward.exists) {
      return response.status(200).send('EVENT_IGNORED');
    }

    // ------
    // Step 3: saves `rewards` entry (unprocessed / incomplete)
    await DATABASE.collection('rewards').doc(rewardsId).set({
      address,
      athleteId,
      activityId,
      isProcessed: false,
      isConfirmed: false,
      rewardDay: formattedDate,
      referrerAddress: !!referrer && !referrer.empty ? referrer.docs[0].data().address : null,
      activityAt: moment(rewardedDate).format('YYYY-MM-DD HH:mm:ss Z'),
    }, { merge: true });

    // ------
    // Step 4: Updates statistics / aggregations
    await DATABASE.doc('statistics/--counters--').set({
      countRewards: admin.firestore.FieldValue.increment(1),
    }, { merge: true });

    await DATABASE.doc(`users/${athleteId}`).set({
      countRewards: admin.firestore.FieldValue.increment(1),
    }, { merge: true });

    // Job Successful
    return response.status(200).send('EVENT_RECEIVED');
  }
  catch (reason) {
    functions.logger.error("[ERROR] Error happened with /POST webhook handler: ", ('' + reason));

    // Webhook response **must be** 200 (risk of ban @Strava)
    return response.status(200).send('EVENT_IGNORED');
  }
};

/**
 * Loop handler which executes a calculation of the rewards
 * multiplier.  The multiplier is affected by referrals and
 * the number of rewards received by the user(s).
 *
 * @see {ReferralBonus}
 * @param   {any}   reward 
 * @returns {Promise<number>}
 */
const getBonusesForReward = async (reward: any): Promise<{multiplier: number, referrerBonus: number}> => {
  // aggregations done by address
  const address = reward.data().address;

  // calculates multiplier for payout
  const multiplier = await ReferralBonus.getPayoutMultiplier(
    DATABASE,
    Address.createFromRawAddress(address),
  );

  // calculates bonus for REFERRER
  const referrerBonus = await ReferralBonus.getReferrerBonus(
    DATABASE,
    Address.createFromRawAddress(address),
  );

  return {
    multiplier,
    referrerBonus,
  };
};

/**
 * Loop handler which executes reward payouts using dHealth
 * Network for a `rewards`  entry as provided in \a reward.
 *
 * This method uses a {@link SkewNormalDistribution}  class
 * to generate the amount that will be sent to the rewarded
 * user.  Additionally, a payout multiplier will be applied
 * to rewards from referred users, the multiplier should be
 * passed as the second argument to this function.
 *
 * The third and last argument of this function defines the
 * referrer bonus amount. This amount, if non-zero, will be
 * sent to the referrer. Amounts are defined in the helpers
 * of {@link ReferralBonus}.
 *
 * The signed transaction is broadcast using a node of  the
 * list in `NETWORK.nodes`. The signed transaction can be a
 * TRANSFER, or an AGGREGATE COMPLETE with 2 inner TRANSFER
 * transactions.
 *
 * @see {SkewNormalDistribution}
 * @param     {any}       reward        The rewards entry (Firestore).
 * @param     {number}    multiplier    The payout multiplier.
 * @param     {number}    referrerBonus The referrer bonus amount (can be 0).
 * @returns   {void}
 */
const broadcastRewardPayout = (
  reward: any,
  multiplier: number,
  referrerBonus: number,
) => {
  // uses the user's dHealth address
  const recipient = reward.data().address;
  const referrer  = reward.data().referrerAddress;

  // uses skew-normal distribution to get amount
  const skewer = new SkewNormalDistribution(0.8);
  const amountDHP = skewer.value * multiplier;

  // prepares a dHealth network transaction
  let signedTransaction: SignedTransaction;

  // transfers from NDAPP to recipient
  const transferToAthlete = TransferTransaction.create(
    Deadline.create(NETWORK.epochAdjustment),
    Address.createFromRawAddress(recipient),
    [
      new Mosaic(
        new MosaicId(NETWORK.currencyMosaicId),
        UInt64.fromUint(amountDHP),
      )
    ],
    PlainMessage.create(reward.data().rewardDay),
    NETWORK.networkIdentifier,
    UInt64.fromUint(0), // 0 DHP
  );

  // CASE 1: Aggregate complete transfers (with referrer bonus)
  if (referrerBonus > 0 && !!referrer && referrer.length === 39) {
    // transfers from NDAPP to referrer
    const transferToReferrer = TransferTransaction.create(
      Deadline.create(NETWORK.epochAdjustment),
      Address.createFromRawAddress(referrer),
      [
        new Mosaic(
          new MosaicId(NETWORK.currencyMosaicId),
          UInt64.fromUint(referrerBonus),
        )
      ],
      PlainMessage.create(reward.data().rewardDay),
      NETWORK.networkIdentifier,
      UInt64.fromUint(0), // 0 DHP
    );

    const aggregateTransfers = AggregateTransaction.createComplete(
      Deadline.create(NETWORK.epochAdjustment),
      [
        transferToAthlete.toAggregate(NDAPP.publicAccount),
        transferToReferrer.toAggregate(NDAPP.publicAccount),
      ],
      NETWORK.networkIdentifier,
      [],
      UInt64.fromUint(30000), // 0.030000 DHP
    );

    // signs the aggregate transaction
    signedTransaction = NDAPP.sign(
      aggregateTransfers,
      NETWORK.generationHash,
    );
  }

  // CASE 2: Simple transfer (no referrer bonus)
  else {
    // signs the simple transfer transaction
    signedTransaction = NDAPP.sign(
      transferToAthlete,
      NETWORK.generationHash,
    );
  }

  // picks a *random* node of the list
  const N = NETWORK.nodes.length;
  const i = Math.floor(Math.random() * (N - 1 + 1)) + 1;
  const nodeUrl = !!NETWORK.nodes[i] ? NETWORK.nodes[i] : NETWORK.nodes[0];

  // traces scheduler configuration
  functions.logger.log(`[DEBUG] Signed transaction for ${reward.id} with hash: ${signedTransaction.hash}`);
  functions.logger.log(`[DEBUG] Using node ${nodeUrl} for broadcasting reward of ${reward.id}`);

  // updates firestore entry
  DATABASE.collection('rewards').doc(reward.id).update({
    isProcessed: true,
    rewardAmount: amountDHP,
    rewardMultiplier: multiplier,
    referrerBonus: referrerBonus,
    transactionHash: signedTransaction.hash,
    transactionNode: nodeUrl,
  });

  // uses transaction repository to broadcast
  return (new TransactionHttp(nodeUrl)).announce(signedTransaction);
}
/// end-region private API
