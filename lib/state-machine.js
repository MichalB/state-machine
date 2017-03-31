const EventEmitter = require('events')
const assign = require('lodash/assign')
const defaults = require('lodash/defaults')
const isPlainObject = require('lodash/isPlainObject')
const isUndefined = require('lodash/isUndefined')
const isString = require('lodash/isString')

const utils = require('./utils')
const queue = require('./promise-queue')

const MACHINE_PROP = '__fsm__'

/**
 * @class StateMachine
 * @extends EventEmitter
 */
class StateMachine extends EventEmitter {
  /**
   * Create new instance of StateMachine
   *
   * @param {Object} config
   * @param {String} config.namespace
   * @param {Function} [config.getEvent]
   * @param {Function} [config.getTimestamp]
   * @param {String} config.initialState
   * @param {Object} [config.states]
   * @param {Object[]} config.transitions
   */
  constructor (config) {
    super()
    assign(this, config)
    defaults(this, {
      namespace: 'fsm',
      initialState: 'uninitialized',
      states: {}
    })

    this.transitionsMap = utils.buildTransitionsMap(config.transitions)
    defaults(this.states, utils.buildStatesMap(Object.keys(this.transitionsMap)))

    let initialState = this.initialState
    if (!initialState) {
      throw new Error('You must specify an initial state for this FSM')
    }
    if (!this.states[ initialState ]) {
      throw new Error('The initial state specified does not exist in the states object.')
    }

    this.initialize.apply(this, arguments)
  }

  // TODO: What's it good for?
  initialize () {}

  buildClientMeta (client) {
    let clientMeta = {
      queue: queue(this.execute.bind(this, client)),
      state: null,
      lastInput: null,
      currentTime: null,
      inExitHandler: false
    }
    clientMeta.state = this.buildState(this.initialState, clientMeta)
    return clientMeta
  }

  buildState (name, clientMeta) {
    return {
      name: name,
      startedBy: clientMeta.lastInput,
      startedAt: clientMeta.currentTime,
      duration: clientMeta.currentTime ? 0 : null
    }
  }

  ensureClientMeta (client) {
    if (!isPlainObject(client)) {
      throw new Error('An FSM client must be an object.')
    }
    client[ MACHINE_PROP ] = client[ MACHINE_PROP ] || {}
    // New client state
    if (!client[ MACHINE_PROP ][ this.namespace ]) {
      client[ MACHINE_PROP ][ this.namespace ] = this.buildClientMeta(client)
    }
    // Loaded client state
    if (!client[ MACHINE_PROP ][ this.namespace ][ 'queue' ]) {
      defaults(client[ MACHINE_PROP ][ this.namespace ], this.buildClientMeta(client))
    }
    return client[ MACHINE_PROP ][ this.namespace ]
  }

  /**
   *
   * @param {Object} client
   * @param input
   * @returns {Promise.<Object>} returns client object
   */
  handle (client, input) {
    if (isUndefined(input)) {
      throw new Error('The input argument passed to the FSM\'s handle method is undefined. Did you forget to pass the input name?')
    }
    let clientMeta = this.ensureClientMeta(client)
    return clientMeta.queue.push(input)
  }

  execute (client, input) {
    let clientMeta = this.ensureClientMeta(client)
    if (clientMeta.inExitHandler) {
      throw new Error('It\'s no allowed to call handle in onExit callback.')
    }

    let eventName = this.getEvent ? this.getEvent(input, clientMeta) : input
    let timestamp = this.getTimestamp ? this.getTimestamp(input) : Date.now()

    clientMeta.lastInput = input
    clientMeta.currentTime = timestamp
    if (clientMeta.state.startedAt) {
      // set duration only for state with known start
      clientMeta.state.duration = timestamp - clientMeta.state.startedAt
    }

    return Promise.resolve(eventName)
      .then((eventName) => this.resolve(client, eventName))
      .then(() => this.resolve(client, 'onTime'))
      .then(() => client)
  }

  /**
   *
   * @param {Object} client
   * @param {String} eventName
   * @returns {Promise}
   */
  resolve (client, eventName) {
    let clientMeta = this.ensureClientMeta(client)
    let transition = this.transitionsMap[ clientMeta.state.name ][ eventName ]

    if (!transition) {
      return Promise.resolve(null)
    }

    let condition = transition.condition ? transition.condition(client, clientMeta.state) : true

    return Promise.resolve(condition).then(fulfilled => {
      if (fulfilled) return this.transition(client, transition)
    })
  }

  /**
   *
   * @param client
   * @param transition
   * @return {Promise}
   */
  transition (client, transition) {
    // Theoretically it is possible to call transition from state.onEnter
    // this.transition(client, 'newState')
    // TODO: Is it a good idea?
    if (isString(transition)) {
      transition = { to: transition }
    }
    let clientMeta = this.ensureClientMeta(client)
    let curStateName = clientMeta.state && clientMeta.state.name
    let newStateName = transition.to
    let curStateObj = this.states[ curStateName ]
    let newStateObj = this.states[ newStateName ]

    if (clientMeta.inExitHandler) {
      throw new Error('It\'s no allowed to call transition in onExit callback.')
    }

    // TODO: This can happen only if it will be called from state.onEnter
    if (!newStateObj) {
      throw new Error(`An unknown state (${newStateName}) is required.`)
    }

    let result = Promise.resolve(null)

    // 1. Call onExit
    if (curStateObj.onExit) {
      result = result.then(() => {
        clientMeta.inExitHandler = true
      })
      result = result.then(() => {
        return curStateObj.onExit.call(this, client, clientMeta.state)
      })
      result = result.then(() => {
        clientMeta.inExitHandler = false
      })
    }

    // 2. Prepare new state
    let newState = this.buildState(newStateName, clientMeta)

    // 3. Call onTransition
    if (transition.onTransition) {
      result = result.then(() => {
        return transition.onTransition.call(this, client, clientMeta.state, newState)
      })
    }

    // 4. Use new state
    result = result.then(() => {
      clientMeta.state = newState
    })

    // 5. Call onEnter
    if (newStateObj.onEnter) {
      result = result.then(() => {
        return newStateObj.onEnter.call(this, client, clientMeta.state)
      })
    }

    return result
  }
}

module.exports = StateMachine
