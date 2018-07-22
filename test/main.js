const { APNS } = require('../lib/apns')

const keyText = '-----BEGIN PRIVATE KEY-----\nBLA.BLA.BLA\n-----END PRIVATE KEY-----'
const keyId = 'BLA'
const teamId = 'Q28A9MLQ38'


let deviceToken = '722cd307306e368e30d1823fa0d55d0c0bc0ed8c90eaf480633b2a62816352bb'
let topic = 'com.redhotbits.goldprice-lite'

let client = new APNS ({
    team: teamId,
    keyId: keyId,
    key: keyText,
    production: true
})

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

let tokens = [deviceToken, '1']

client.connect().then(() => {
    client.push({
        deviceTokens: tokens,
        payload: payload,
        headers: headers
    }).then(results => console.log('done', results)).catch(err => console.log('can not push', err))
}).catch(err => {
    console.log('can not connect', err)
})
