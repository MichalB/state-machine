module.exports = function queue (worker) {
  const tasks = []
  let paused = false
  let isProcessing = false

  function insert (task, resolve, reject) {
    tasks.push({ task, resolve, reject })
    setImmediate(process)
  }

  function process () {
    if (isProcessing) { return }
    if (!paused && tasks.length) {
      isProcessing = true
      let { task, resolve, reject } = tasks.shift()
      Promise.resolve(worker(task))
        .then(resolve)
        .catch(reject)
        .then(() => {
          isProcessing = false
        })
        .then(process)
    }
  }

  return {
    push (task) {
      return new Promise((resolve, reject) => insert(task, resolve, reject))
    },
    length () {
      return tasks.length
    },
    pause () {
      paused = true
    },
    resume () {
      if (paused === false) { return }
      paused = false
      setImmediate(process)
    },
    toJSON () {
      return undefined
    }
  }
}
