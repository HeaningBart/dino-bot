import { Queue } from 'bullmq'
import { Worker } from 'bullmq'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const rawsQueue = new Queue<RawsPayload>('bot_raws', {
  connection: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
  },
})
const processorFile = pathToFileURL(__dirname + '/processor.js')
export const worker = new Worker('bot_raws', processorFile, {
  connection: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
  },
  autorun: true,
  concurrency: 1,
})
export type RawsPayload = {
  kakaoId: string
  chapter_number?: string
  series_title?: string
  channel_id: string
  role_id?: string
  command: 'getchapter' | 'weekly'
  type: 'kakao' | 'lezhin' | 'pyccoma' | 'ridi' | 'boomtoon'
}
