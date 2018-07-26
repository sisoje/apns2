const jwt = require('jsonwebtoken')
const Http2Client = require('./http2-client')

const HOST = `api.push.apple.com`
const HOSTDEV = `api.sandbox.push.apple.com`

/**
 * @class APNS
 */
class APNS {

    constructor({ team, keyId, key, production=true }) {
        if (!team) throw new Error(`team is required`)
        if (!keyId) throw new Error(`keyId is required`)
        if (!key) throw new Error(`signingKey is required`)

        let host = production ? HOST : HOSTDEV
        this._client = new Http2Client(host)

        let bearerToken = APNS.getBearerToken(keyId, key, team)
        this._authHeader = {
            'authorization': `bearer ${bearerToken}`
        }
    }

    async _pushOne(deviceToken, body, headers) {
        let options = {
            path: `/3/device/${deviceToken}`,
            headers: headers
        }
        return new Promise((resolve, reject) => {
            this._client.post(options, body).then(res => {
                resolve(Object.assign(res, {deviceToken: deviceToken}))
            }).catch(err => reject(err))
        })
    }

    async connect() {
        return this._client.connect()
    }

    async push({deviceTokens, payload, headers}) {
        let authHeaders = Object.assign(headers, this._authHeader)
        let body = JSON.stringify(payload)
        let promises = deviceTokens.map(token => this._pushOne(token, body, authHeaders))
        return Promise.all(promises)
    }

    static getBearerToken(keyId, key, team) {
        const SIGNING_ALGORITHM = `ES256`
        let claims = {
            iss: team,
            iat: ~~(Date.now() / 1000)
        }
        let options = {
            algorithm: SIGNING_ALGORITHM,
            header: {
                alg: SIGNING_ALGORITHM,
                kid: keyId
            }
        }
        return jwt.sign(claims, key, options)
    }

    static hexFromString64(str64) {
        return Buffer.from(str64, 'base64').toString('hex')
    }

    static string64FromHex(hex) {
        return Buffer.from(hex, 'hex').toString('base64')
    }

    static splitTokens(joinedTokens) {
        const chunks = new Array(joinedTokens.length / 64)
        for (let i = 0; i < chunks.length; ++i) {
            chunks[i] = joinedTokens.substr(i*64, 64)
        }
        return chunks
    }

    static tokensFromString64(str64) {
        return this.splitTokens(this.hexFromString64(str64))
    }
}

module.exports = {
    APNS
}
