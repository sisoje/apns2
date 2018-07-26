const { APNS } = require('../lib/apns')
const fs = require('fs')

const keyText = fs.readFileSync(`/Users/lotasevic/AuthKey_3B3YUNMR33.p8`, 'utf8')
const keyId = '3B3YUNMR33'
const teamId = 'Q28A9MLQ38'
const deviceToken = 'ad0c511d15b4cd48ef9b7f5b610de8c1d38612fdc6677bda752e108555607f4a'
const topic = 'com.redhotbits.goldprice'
const colapseandthread = 'test'
const epochinseconds = ~~(Date.now() / 1000)

let client = new APNS ({
    team: teamId,
    keyId: keyId,
    key: keyText,
    production: false
})

let headers = {
    'apns-priority': 10,
    'apns-topic': topic,
    'apns-collapse-id': colapseandthread,
    'apns-expiration': epochinseconds + 3600
}


let payload = {
        aps: {
            alert: `Testing node ${epochinseconds}`,
            badge: 1,
            sound: 'default',
            'thread-id': colapseandthread,
            'mutable-content': 1
        }
}

client.connect().then(() => {
    client.push({
        deviceTokens: [deviceToken],
        payload: payload,
        headers: headers
    }).then(results => console.log('done', results)).catch(err => console.log('can not push', err))
}).catch(err => {
    console.log('can not connect', err)
})
