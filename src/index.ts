import { Job } from 'bullmq'
import { client } from './client/index.js'
import { rawsQueue, worker, RawsPayload } from './queue/raws.js'

client.once('ready', async () => {
  client.user &&
    client.user.setActivity(`Chapters on the queue: ${await rawsQueue.count()}`)
})

rawsQueue.on('waiting', async () => {
  client.user &&
    client.user.setActivity(`Chapters on the queue: ${await rawsQueue.count()}`)
})

worker.on('drained', async () => {
  client.user && client.user.setActivity(`I'm Heaning's creation.`)
})

worker.on('completed', async (job: Job<RawsPayload>) => {
  client.user &&
    client.user.setActivity(
      `I finished chapter ${job.data.chapter_number} of ${job.data.kakaoId}!`
    )
})

worker.on('progress', async (job: Job<RawsPayload>) => {
  client.user &&
    client.user.setActivity(
      `I'm working on chapter ${job.data.chapter_number} of ${job.data.kakaoId}!`
    )
})

export { client }
