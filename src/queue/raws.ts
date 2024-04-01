import { Queue } from 'bullmq'

export const rawsQueue = new Queue<RawsPayload>('bot_raws')

export type RawsPayload = {
  kakaoId: string
  chapter_number?: string
  series_title?: string
  channel_id: string
  role_id?: string
  command: 'getchapter' | 'weekly'
  type: 'kakao' | 'lezhin' | 'pyccoma' | 'ridi' | 'boomtoon'
}
