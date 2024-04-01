import { Queue } from 'bullmq'
import { Worker } from 'bullmq'
import path from 'path'
export const rawsQueue = new Queue<RawsPayload>('bot_raws')
const processorFile = path.join(__dirname, 'processor.js')
export const worker = new Worker('bot_raws', processorFile)
export type RawsPayload = {
  kakaoId: string
  chapter_number?: string
  series_title?: string
  channel_id: string
  role_id?: string
  command: 'getchapter' | 'weekly'
  type: 'kakao' | 'lezhin' | 'pyccoma' | 'ridi' | 'boomtoon'
}
