const Promise = require('bluebird')
const { EventEmitter } = require('events')
const { Pool } = require('tarn')
const jwt = require('jsonwebtoken')
const Http2Client = require('./http2-client')
const Errors = require('./errors')
const Notification = require('./notifications/notification')
const BasicNotification = require('./notifications/basic-notification')
const SilentNotification = require('./notifications/silent-notification')

/**
 * @const
 * @desc APNS version
 */
const API_VERSION = 3

/**
 * @const
 * @desc Number of connections to open up with apns API
 */
const MAX_CONNECTIONS = 4

/**
 * @const
 * @desc Max notifications to send concurrently
 */
const CONCURRENCY = 16

/**
 * @const
 * @desc Default host to send request
 */
const HOST = `api.push.apple.com`
const HOSTDEV = `api.sandbox.push.apple.com`

/**
 * @const
 * @desc Signing algorithm for JSON web token
 */
const SIGNING_ALGORITHM = `ES256`

/**
 * @const
 * @desc Reset our signing token every 59 minutes as reccomended by Apple
 */
const RESET_TOKEN_INTERVAL = 59 * 60 * 1000

/**
 * @class APNS
 */
class APNS extends EventEmitter {

  /**
   * @constructor
   * @param {Object} options
   * @param {String} [options.team]
   * @param {String} [options.signingKey]
   * @param {String} [options.key]
   * @param {String} [options.host]
   * @param {Int} [options.port]
   * @param {Int} [options.concurrency]
   */
  constructor({ team, keyId, signingKey, defaultHeaders, production=true, concurrency=CONCURRENCY, connections=MAX_CONNECTIONS }) {
    if (!team) throw new Error(`team is required`)
    if (!keyId) throw new Error(`keyId is required`)
    if (!signingKey) throw new Error(`signingKey is required`)
    if (!defaultHeaders) throw new Error(`defaultHeaders is required`)
    super()
    this._team = team
    this._keyId = keyId
    this._signingKey = signingKey
    this._defaultHeaders = defaultHeaders
    this._concurrency = concurrency
    let host = production ? HOST : HOSTDEV
    this._clients = this._createClientPool({ host, connections })
    this._interval = setInterval(() => this._resetSigningToken(), RESET_TOKEN_INTERVAL).unref()
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  /**
   * @method sendMany
   * @param {Array<Notification>} notifications
   * @return {Promise}
   */
  async sendMany(notifications) {
    let sender = async notification => {
      try {
        return await this._sendOne(notification)
      } catch (error) {
        return { error }
      }
    }
    let options = {
      concurrency: this._concurrency
    }
    return Promise.map(notifications, sender, options)
  }

  /**
   * @private
   * @method _sendOne
   * @param {Notification} notification
   * @return {Promise}
   */
  async _sendOne(notification) {
    let authHeader = {'authorization': `bearer ${this._getSigningToken()}`}
    let headers = Object.assign(authHeader, this._defaultHeaders)
    let options = {
      path: `/${API_VERSION}/device/${encodeURIComponent(notification.deviceToken)}`,
      headers: headers
    }

    let client = await this._acquireClient()

    try {
      let body = JSON.stringify(notification.APNSOptions())
      let res = await client.post(options, body)
      this._releaseClient(client)
      return this._handleServerResponse(res, notification)
    } catch(err) {
      this._releaseClient(client)
      throw err
    }
  }

  /**
   * @private
   * @method _createClientPool
   * @param {String} host
   * @param {Number} port
   * @return {Pool}
   */
  _createClientPool({ host, connections }) {
    return new Pool({
      create: () => new Http2Client(host, 443).connect(),
      validate: client => client.ready,
      destroy: client => client.destroy(),
      min: 0,
      max: connections
    })
  }

  /**
   * @private
   * @method _acquireClient
   * @return {Promise}
   */
  async _acquireClient() {
    return this._clients.acquire().promise
  }

  /**
   * @private
   * @method _acquireClient
   * @return {Promise}
   */
  _releaseClient(client) {
    return this._clients.release(client)
  }

  /**
   * @private
   * @method _handleServerResponse
   * @param {ServerResponse} res
   * @return {Promise}
   */
  async _handleServerResponse(res, notification) {
    if (res.statusCode === 200) {
      return notification
    }

    let json

    try {
      json = JSON.parse(res.body)
    } catch(err) {
      json = { reason: Errors.unknownError }
    }

    json.statusCode = res.statusCode
    json.notification = notification

    this.emit(json.reason, json)
    this.emit(Errors.error, json)

    throw json
  }

  /**
   * @private
   * @method _getSigningToken
   * @return {String}
   */
  _getSigningToken() {
    if (this._token) {
      return this._token
    }

    let claims = {
      iss: this._team,
      iat: parseInt(Date.now() / 1000)
    }

    let key = this._signingKey

    let options = {
      algorithm: SIGNING_ALGORITHM,
      header: {
        alg: SIGNING_ALGORITHM,
        kid: this._keyId
      }
    }

    let token

    try {
      token = jwt.sign(claims, key, options)
    } catch(err) {
      token = null
      this.emit(Errors.invalidSigningKey)
    }

    this._token = token

    return token
  }

  /**
   * @private
   * @method _resetSigningToken
   */
  _resetSigningToken() {
    this._token = null
    return this._getSigningToken()
  }
}

module.exports = {
  APNS,
  Errors,
  Notification,
  BasicNotification,
  SilentNotification
}
