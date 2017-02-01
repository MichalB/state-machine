const promiseQueue = require('../lib/promise-queue')

const queue = promiseQueue(task => new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log(task)
    resolve()
  }, 1000)
}))

queue.push(1)
queue.push(2)
queue.push(3)
queue.push(4)
queue.push(5)

console.log(6)
