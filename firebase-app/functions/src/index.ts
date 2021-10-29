/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn with Strava
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     LGPL-3.0
 */
import * as functions from 'firebase-functions';
const { getFirestore } = require('firebase-admin/firestore');
import axios from 'axios';

// initializes firebase/firestore
const DATABASE = getFirestore();

/// region cloud functions
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
    response.sendStatus(400);
    return ;
  }

  // reads environment configuration
  const stravaConf = functions.config().strava;

  // builds the strava OAuth query
  const stravaQuery = `?`
    + `client_id=${stravaConf.client_id}`
    + `&response_type=code`
    + `&approval_prompt=auto`
    + `&scope=activity:read`
    + `&redirect_uri=${stravaConf.oauth_url}` // should be /link
    + `&state=${data['dhealth.address']}`;

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
 * authorization of an app in Strava (Token Exchange).
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
    const address = res.data.state;

    // saves the user in database
    DATABASE.collection('users').doc(athlete.id).set({
      address,
      athleteId: athlete.id,
      linkedAt: new Date().valueOf(),
    }, { merge: true })
    .then((user: any) => {
      // should link to /subscribe
      const subscribeURL = stravaConf.subscribe_url;

      // redirects the user to create a webhook subscription
      response.redirect(301, subscribeURL);
    })
    .catch(() => response.sendStatus(500));
  })
  .catch((reason) => {
    // traces errors for monitoring
    functions.logger.error("[ERROR] Error happened in /link: ", reason);
    return response.sendStatus(400);
  })
});

/**
 * @function  subscribe
 * @link      /health-to-earn/us-central1/subscribe
 *
 * Step 3 of the dHealth <> Strava link process.
 *
 * This request handler handles the creation of a
 * webhook subscription for Strava. Afterwards, a
 * request from Strava will be issued using a GET
 * request to the /webhook cloud function.
 *
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
export const subscribe = functions.https.onRequest((request, response) => {
  // traces calls for monitoring
  functions.logger.log("[DEBUG] Now handling /subscribe request with query: ", request.query);

  const stravaConf = functions.config().strava;
  axios.post('https://www.strava.com/api/v3/push_subscriptions', {
    client_id: stravaConf.client_id,
    client_secret: stravaConf.client_secret,
    callback_url: stravaConf.webhook_url,
    verify_token: stravaConf.verify_token,
  })
  .then((res) => {
    return response
      .status(200)
      .send(res.data);
  })
  .catch((reason) => {
    // traces errors for monitoring
    functions.logger.error("[ERROR] Subscription error happened: ", reason);
    return response.sendStatus(400);
  });
});

/**
 * @function  webhook
 * @link      /health-to-earn/us-central1/webhook
 *
 * Step 4 of the dHealth <> Strava link process.
 *
 * This request handler handles the creation of a
 * webhook subscription for Strava and the follow
 * -up steps whenever an activity is created in a
 * Strava account linked to this app.
 *
 * @params    {Request}   request
 * @params    {Response}  response
 * @returns   {void}
 */
export const webhook = functions.https.onRequest((request: any, response: any) => {
  // proxies over to correct request handler
  if (request.method === 'GET') {
    return webhookSubscriptionHandler(request, response);
  }
  else if (request.method === 'POST') {
    return webhookEventHandler(request, response);
  }

  // bails out on invalid requests
  return response.sendStatus(403);
});
/// end-region cloud functions

/// region private API
/**
 * Request handler for GET requests to the cloud function.
 *
 * This method verifies the format of the request payload
 * and returns a 200 success response with the challenge.
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
    .send({'hub.challenge': data['hub.challenge']});
};

/**
 * Request handler for POST requests to the cloud function.
 *
 * This method handles incoming Strava activities and other
 * events pushed by Strava on the webhook subscription.
 *
 * @param   {Request}   request 
 * @param   {Response}  response 
 * @returns {Response}
 */
 const webhookEventHandler = (request: any, response: any) => {
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

  // traces valid webhook events
  functions.logger.log("[DEBUG] Identified activity: ", data);

  // searches the user by it's Strava id
  DATABASE.doc(`users/${data['owner_id']}`)
    .get()
    .then((doc: any) => {

      functions.logger.log("[DEBUG] Found user: ", doc);
      //XXX extract address and send DHP

      return response
        .status(200)
        .send('EVENT_RECEIVED');
    })
    .catch(() => response.status(200).send('EVENT_IGNORED'));
};
/// end-region private API
