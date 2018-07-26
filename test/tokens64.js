const { APNS } = require('../lib/apns')

let lettera = 'QQ=='

let token64 = 'RFl6UmphM256SFN0WkplOHNiWnVadkJ2UXNmbkJSZUg='
let deviceToken = '722cd307306e368e30d1823fa0d55d0c0bc0ed8c90eaf480633b2a62816352bb'

let deviceToken64 = APNS.string64FromHex(deviceToken)
let deviceTokenBack = APNS.hexFromString64(deviceToken64)


console.log('deviceToken', deviceToken)
console.log('deviceTokenBack', deviceTokenBack)
console.log('len', token64.length)

let tokens = APNS.tokensFromString64(token64)

console.log('tokens', tokens)