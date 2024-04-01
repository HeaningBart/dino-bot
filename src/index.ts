import { Job } from 'bullmq'
import { client } from './client/index.js'
import { rawsQueue, worker, RawsPayload } from './queue/raws.js'

worker.on('drained', async () => {
  client.user && client.user.setActivity(`I'm Heaning's creation.`)
})

worker.on('completed', async (job: Job<RawsPayload>) => {
  client.user &&
    client.user.setActivity(
      `I finished chapter ${job.data.chapter_number} of ${job.data.kakaoId}!`
    )
})

export { client }
