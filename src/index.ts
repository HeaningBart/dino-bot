import { client } from './client/index.js'
import { rawsQueue } from './queue/raws.js'
;(async function () {
  console.log(await rawsQueue.getWorkers())
})()

export { client }
