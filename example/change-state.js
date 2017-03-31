/* eslint-disable no-console */

const StateMachine = require('..')

const sm = new StateMachine({
  getEvent: input => input.value,
  getTimestamp: input => input.timestamp,
  initial: 'off',
  transitions: [
    {
      input: 0,
      from: 'on',
      to: 'off',
      onTransition: (from, to, stateMachine) => console.log('switch off', to)
    },
    {
      input: 1,
      from: 'off',
      to: 'on',
      onTransition: (from, to, stateMachine) => console.log('switch on', to)
    },
    {
      input: 2,
      from: 'on',
      to: 'off',
      onTransition: (from, to, stateMachine) => console.log('switch off', to)
    }
  ]
})

let now = Date.now()

let tasks = [
  { value: 0, timestamp: now },
  { value: 0, timestamp: now + 10 },
  { value: 1, timestamp: now + 20 },
  { value: 1, timestamp: now + 30 },
  { value: 1, timestamp: now + 40 },
  { value: 1, timestamp: now + 50 },
  { value: 1, timestamp: now + 60 },
  { value: 2, timestamp: now + 70 },
  { value: 2, timestamp: now + 80 },
  { value: 1, timestamp: now + 90 },
  { value: 1, timestamp: now + 100 }
]

let sequence = Promise.resolve()
tasks.forEach(function (task) {
  sequence = sequence.then(() => sm.handle(task))
})
