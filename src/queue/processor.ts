import { SandboxedJob } from 'bullmq'
import { RawsPayload } from './raws.js'
import { getLatestChapter, getSpecificChapter } from '../rawhandler/index.js'
import { getLezhinSpecificChapter } from '../rawhandler/lezhin/index.js'
import { getRidiChapter } from '../rawhandler/ridibooks/index.js'
import { getBoomToonChapter } from '../rawhandler/boomtoon/index.js'

export default async function (job: SandboxedJob<RawsPayload>) {
  try {
    const { kakaoId, series_title, command, chapter_number, type } = job.data
    if (type === 'kakao') {
      const chapter =
        command === 'weekly'
          ? await getLatestChapter(kakaoId, series_title!)
          : await getSpecificChapter(kakaoId, chapter_number!, kakaoId)
      if (chapter) {
        return chapter
      }
    }
    if (type === 'lezhin') {
      const chapter = await getLezhinSpecificChapter(kakaoId, chapter_number!)
      return chapter
    }
    if (type === 'ridi') {
      const chapter = await getRidiChapter(kakaoId, chapter_number!)
      return chapter
    }
    if (type === 'boomtoon') {
      const chapter = await getBoomToonChapter(kakaoId, chapter_number!)
      return chapter
    }
  } catch (error) {
    console.log(error)
  }
}
