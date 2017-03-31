/* eslint-disable no-console */

const StateMachine = require('..')

const sm = new StateMachine({
  namespace: 'borderCrossing',
  getEvent (input, clientMeta) {
    let lastCountry = clientMeta.lastCountry
    clientMeta.lastCountry = input.country

    return lastCountry && lastCountry !== input.country ? 'borderCrossing' : 'going'
  },
  getTimestamp (input) {
    return input.timestamp
  },
  initialState: 'inCountry',
  states: {
    inCountry: {
      onEnter (client, state) {},
      onExit (client, state) {}
    }
  },
  transitions: [
    {
      input: 'borderCrossing',
      from: 'inCountry',
      to: 'waitingForConfirmation'
    },
    {
      input: 'borderCrossing',
      from: 'waitingForConfirmation',
      to: 'inCountry'
    },
    {
      input: 'onTime',
      from: 'waitingForConfirmation',
      to: 'inCountry',
      condition: (client, state) => state.duration > 30,
      onTransition: (client, from, to) => console.log('Border crossed.', from)
    }
  ]
})

let vehicle = { id: 1234 }
let id = 0
let now = Date.now()
let tasks = [
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'DE', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 },
  { id: id++, country: 'CZ', timestamp: now += 10 }
]

tasks.forEach(function (task) {
  sm.handle(vehicle, task)
})

// setTimeout(() => {
//   console.log(JSON.stringify(vehicle))
// }, 1000)
