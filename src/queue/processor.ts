import { SandboxedJob } from 'bullmq'
import { RawsPayload } from './raws'
import { getLatestChapter, getSpecificChapter } from '../rawhandler'
import { getLezhinSpecificChapter } from '../rawhandler/lezhin'
import { client } from '../client'
import { getRidiChapter, logIn } from '../rawhandler/ridibooks'
import { getBoomToonChapter } from '../rawhandler/boomtoon'

export default async function (job: SandboxedJob<RawsPayload>) {
  const {
    channel_id,
    kakaoId,
    role_id,
    series_title,
    command,
    chapter_number,
    type,
  } = job.data
  console.log(job.data)
  if (type === 'kakao') {
    const chapter =
      command === 'weekly'
        ? await getLatestChapter(kakaoId, series_title!)
        : await getSpecificChapter(kakaoId, chapter_number!, kakaoId)
    if (chapter) {
      const channel = client.channels.cache.get(channel_id)
      if (channel?.isText()) {
        command === 'weekly'
          ? await channel.send(
              `Weekly chapter of ${series_title}, <@&${role_id}>, <@&946250134042329158>: ${chapter}`
            )
          : await channel.send(`Chapter: ${chapter}`)

        await channel.send(
          `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
        )
      }
    }
  }
  if (type === 'lezhin') {
    const chapter = await getLezhinSpecificChapter(kakaoId, chapter_number!)
    const channel = client.channels.cache.get(channel_id)
    if (channel?.isText()) {
      command === 'weekly'
        ? await channel.send(
            `Chapter of ${series_title}, <@&${role_id}>, <@&946250134042329158>: ${chapter}`
          )
        : await channel.send(`Chapter: ${chapter}`)

      await channel.send(
        `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
      )
    }
  }
  if (type === 'ridi') {
    const chapter = await getRidiChapter(kakaoId, chapter_number!)
    const channel = client.channels.cache.get(channel_id)
    if (channel?.isText()) {
      command === 'weekly'
        ? await channel.send(
            `Chapter of ${series_title}, <@&${role_id}>, <@&946250134042329158>: ${chapter}`
          )
        : await channel.send(`Chapter: ${chapter}`)

      await channel.send(
        `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
      )
    }
  }
  if (type === 'boomtoon') {
    const chapter = await getBoomToonChapter(kakaoId, chapter_number!)
    const channel = client.channels.cache.get(channel_id)
    if (channel?.isText()) {
      command === 'weekly'
        ? await channel.send(
            `Chapter of ${series_title}, <@&${role_id}>, <@&946250134042329158>: ${chapter}`
          )
        : await channel.send(`Chapter: ${chapter}`)

      await channel.send(
        `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
      )
    }
  }
}
