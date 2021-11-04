
<p align="center"><img src="https://dhealth.network/wp-content/uploads/2021/01/dHealth-Network-Logo-color-change.png"></p>

# dHealth Wallet Plugin: Health to Earn with Strava

[![npm-badge][npm-badge]][npm-url]
[![dl-badge][dl-badge]][npm-url]
[![License](https://img.shields.io/badge/License-LGPL%203.0%20only-blue.svg)](https://opensource.org/licenses/LGPL-3.0)

Health to Earn with Strava is a showcase to earn `dhealth.dhp` on [dHealth Network][parent-url].

- [Components found here](#components-found-here)
- [Environment](#environment)
- [Development](#development)
- [Licensing](#license)

## Sequence diagram

```
                      |----------------|
                      | dHealth Wallet |
                      |----------------|
                              |
                      |----------------|
                  ____| Strava OAuth   |____
                  |   |----------------|   |
                  |                        |
            |------------|            |--------|     |------|
            | Authorized |            | Denied |---->| Done |
            |------------|            |--------|     |------|
                  |
          |-------------------|     |--------------|
          | onActivityCreated |---->| isFirst(24h) |
          |-------------------|     |--------------|
                                           |
                          |-----|          |          |-----|     |------|
                          | Yes |----------|----------| No  |---->| Done |
                          |-----|                     |-----|     |------|
                             |
                             |
                    |-------------------|
                    | Send NDAPP Reward |
                    |-------------------|
```

## Components found here

Following components are defined and exported with this library:

| Class | Description |
| --- | --- |
| `HealthToEarn` | Mixin that displays a page to initiate the OAuth authentication of supported providers. |
| `RewardsDashboard` | Mixin that displays a dashboard page that contains information about earned DHP. |

## Environment

Firebase, and other Cloud Functions providers, lets you configure environment variables. This software requires the following environment configuration:

```bash
cd firebase-app
firebase functions:config:set \
  dhealth.node="http://dual-01.dhealth.cloud:3000" \
  dhealth.account.secret="PRIVATE_KEY_HERE" \
  strava.client_id="CID_HERE" \
  strava.client_secret="SECRET_HERE" \
  strava.verify_token="TOKEN_HERE" \
  strava.oauth_url="OAUTH_URL_HERE" \
  strava.subscribe_url="SUBSCRIBE_URL_HERE" \
  strava.webhook_url="CALLBACK_URL_HERE"
```

Please, replace `PRIVATE_KEY_HERE` with the private key of the **payer** account. This account will send rewards to users when they register activities on Strava. Also, replace `CID_HERE` with your Strava App Client ID and `SECRET_HERE` with your Strava App Client Secret. You can find your Strava Client ID and Client Secret pair in your Strava Dashboard under `My API Application`. Then, *generate a random* verification token and replace `TOKEN_HERE` with the randomly generate verification token.

Finally, replace `CALLBACK_URL_HERE` with your Webhook URL, this must be the URL that handles Strava webhook events (i.e. /webhook cloud function). Then, replace `OAUTH_URL_HERE` with the redirection URL that catches successful Strava OAuth authorization callbacks (i.e. /link cloud function) and also replace `SUBSCRIBE_URL_HERE` with the URL that handles Webhook subscription creation (i.e. /subscribe cloud function).

### Service Accounts

This project requires to use a **service account** in to give the backend permissions in Firestore. A service account can be created in **Project Settings** > **Service Accounts**. After you click *Generate a new private key*, you will receive a `.json` file that contains the service account credential.

:warning: Do not share this file and do not check it in a repository of any sort.

After downloading the credential file, move it inside the firebase-app directory:

```bash
mv path/to/credential.json firebase-app/functions/.firebaseAuth.json
```

:warning: Note that the path and filename `firebase-app/functions/.firebaseAuth.json` must be respected, otherwise Firebase will not allow to read and write in Firestore.

### Strava webhook subscription

After deploying the functions *for the first time*, a subscription must be created to enable Strava webhooks, a subscription can be created with the following command:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
      -F client_id=CID_HERE \
      -F client_secret=SECRET_HERE \
      -F 'callback_url=CALLBACK_URL_HERE' \
      -F 'verify_token=TOKEN_HERE'
```

:warning: Please, replace `CID_HERE` with your Strava App Client ID and `SECRET_HERE` with your Strava App Client Secret. You can find your Strava Client ID and Client Secret pair in your Strava Dashboard under `My API Application`. Then, *generate a random* verification token and replace `TOKEN_HERE` with the randomly generate verification token. Finally, replace `CALLBACK_URL_HERE` with your Webhook URL, this must be the URL that handles Strava webhook events (i.e. /webhook cloud function).

## Development

Cloud functions can be tested using a local deployment using the `firebase-app/functions/package.json`. But we first need to configure the local emulator's configuration with the following commands:

```bash
cd firebase-app/functions
firebase functions:config:get > .runtimeconfig.json
cd ../..
```

Serving the cloud functions locally works by executing the following command from the *root directory of the project*:

```bash
npm run serve
```

This will deploy the cloud functions at the following URL: `http://localhost:5000/health-to-earn/us-central1/webhook`.

## Deployment

Cloud functions can be deployed to Firebase using the following command: 

```bash
firebase deploy --only functions
```

Alternatively, you can also deploy individual functions using - i.e. to deploy the cloud function `status`, you would execute the command: `firebase deploy --only functions:status`.

:warning: Note that after you deployed the functions, you may have to update the [environment][#environment] configuration again and replace `OAUTH_URL` with the /authorize function URL, replace `SUBSCRIBE_URL_HERE` with the /subscribe function URL and replace `CALLBACK_URL_HERE` with the /webhook function URL.

:warning: You must also update the **security rules** in Firestore such that it contains the content of `firebase-app/.rules`. This file opens reading operations to the public and writing operations are restricted to authenticated users. Deployment can be done with `firebase deploy --only firestore:rules`.

## Webhook Endpoint

Testing a newly deployed webhook event handler can be done with the below command. Please, note that this is using a test account for which the linked dHealth Account is a test account. The payout scheduler will/must never actually send funds to this address.

```bash
curl -X POST https://us-central1-health-to-earn.cloudfunctions.net/webhook \
  -H 'Content-Type: application/json' \
  -d '{
      "aspect_type": "create",
      "event_time": 1549560669,
      "object_id": 6207413503,
      "object_type": "activity",
      "owner_id": 94380856,
      "subscription_id": 204470
    }'
```

## License

Copyright 2021-present [Using Blockchain Ltd][ref-ltd], All rights reserved.

Licensed under the [LGPL v3.0](LICENSE)

[ref-ltd]: https://using-blockchain.org
[parent-url]: https://dhealth.network
[npm-url]: https://www.npmjs.com/package/@dhealth/plugin-health-to-earn-strava
[npm-badge]: https://img.shields.io/npm/v/@dhealth/plugin-health-to-earn-strava
[dl-badge]: https://img.shields.io/npm/dt/@dhealth/plugin-health-to-earn-strava
