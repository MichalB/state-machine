const isFunction = require('lodash/isFunction')
const isUndefined = require('lodash/isUndefined')
const isString = require('lodash/isString')

module.exports = {
  buildTransitionsMap (transitions) {
    let map = {}
    transitions.forEach(transition => {
      let { input, from, to, condition, onTransition } = transition

      if (isUndefined(input)) {
        throw new Error('transition.input is expected')
      }
      if (!isString(from)) {
        throw new Error('It is expected string in transition.from')
      }
      if (!isString(to)) {
        throw new Error('It is expected string in transition.to')
      }
      if (condition && !isFunction(condition)) {
        throw new Error('It is expected function in transition.condition if it`s used')
      }
      if (onTransition && !isFunction(onTransition)) {
        throw new Error('It is expected function in transition.onTransition if it`s used')
      }

      map[ from ] = map[ from ] || {}
      map[ from ][ input ] = transition
    })
    return map
  },

  buildStatesMap (states) {
    let map = {}
    states.forEach(name => {
      map[ name ] = {}
    })
    return map
  }

}
