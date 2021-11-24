
<p align="center"><img src="https://dhealth.network/wp-content/uploads/2021/01/dHealth-Network-Logo-color-change.png"></p>

# Health to Earn powered by Strava: Firebase Cloud Functions

[![License](https://img.shields.io/badge/License-LGPL%203.0%20only-blue.svg)](https://opensource.org/licenses/LGPL-3.0)

Health to Earn powered by Strava is a showcase to earn `dhealth.dhp` on [dHealth Network][parent-url].

This directory contains the implementation of **Typescript Cloud Functions** using [**Firebase**](https://firebase.google.com/docs/functions).

- [Functions found here](#functions-found-here)
- [Environment config](#environment)
- [Licensing](#license)

## Functions found here

Following components are defined and exported with this library:

| Class | Description |
| --- | --- |
| `authorize` | Authorization handler that takes `dhealth.address` to start Strava OAuth process. |
| `link` | Token exchange handler that requests a `authorization_code` from Strava and redirects to `subscribe`. |
| `unlink` | Cancellation handler that unlinks an address from a Strava account. |
| `webhook` | Webhook callback handler. GET to verify a subscription ; POST to submit events. |
| `status` | Status callback handler that produces a GET response depending on if an account is linked or not. |
| `payout` | Cloud scheduler function that executes outstanding (unprocessed) payouts one at a time. |

## License

Copyright 2021-present [Using Blockchain Ltd][ref-ltd], All rights reserved.

Licensed under the [LGPL v3.0](LICENSE)

[ref-ltd]: https://using-blockchain.org
[parent-url]: https://dhealth.network
