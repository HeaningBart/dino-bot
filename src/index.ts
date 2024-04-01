import { client } from './client/index.js'
import { rawsQueue, worker } from './queue/raws.js'

rawsQueue.on('progress', async (job) => {
  client.user &&
    client.user.setActivity(
      `Processing ${job.data.command} for ${job.data.kakaoId} - ${job.data.chapter_number} (${job.progress}%)`
    )
})

worker.on('completed', async () => {
  client.user && client.user.setActivity(`I'm Heaning's creation.`)
})

export { client }
