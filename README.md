APNS2
=====

[![wercker status](https://app.wercker.com/status/0e705662e5c35d51a971764fe3e27814/s/master "wercker status")](https://app.wercker.com/project/byKey/0e705662e5c35d51a971764fe3e27814)
[![npm version](https://badge.fury.io/js/apns2.svg)](https://badge.fury.io/js/apns2)
[![Twitter](https://img.shields.io/badge/twitter-@andrew_barba-blue.svg?style=flat)](http://twitter.com/andrew_barba)

Node client for connecting to Apple's Push Notification Service using the new HTTP/2 protocol with JSON web tokens.

> Now uses the native `http2` module in Node.js v8.10 or later

---

## Create Client

Create an APNS client using a signing key and environment flag:

```javascript
const { APNS } = require('apns2')

let client = new APNS ({
    team: teamId,
    keyId: keyId,
    key: keyText,
    production: true
})
```

## Sending Notifications

Send a basic notification with message:

```javascript
let headers = {
    'apns-priority': 10,
    'apns-topic': topic
}

let payload = {
        aps: {
            alert: 'Testing node',
            badge: 1,
            sound: 'default'
        }
}

// array of tokens
let tokens = [goodDeviceToken, invalidToken]

//client sends the same payload with same headers to multiple tokens
//authorisation is the only thing done internally
client.connect().then(() => {
    client.push({
        deviceTokens: tokens,
        payload: payload,
        headers: headers
    }).then(results => console.log('done', results)).catch(err => console.log('can not push', err))
}).catch(err => {
    console.log('can not connect', err)
})

```

Available options can be found at [APNS Payload Options](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1)

## Error Handling

Just iterate trough results (token is added to the actual server result)


## Requirements

`apns2` requires Node.js v8.10 or later
