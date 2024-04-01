import {
  buyChapter,
  getBoughtChapters,
  getEpisodeContent,
  getSeriesInfo,
} from './api.js'
import { startup } from './browser.js'
import { handleChapter } from '../index.js'
const use_waifu = JSON.parse(process.env.waifu!)

export async function getLezhinSpecificChapter(
  seriesSlug: string,
  chapter_number: string | number,
  updateProgress: (number: number) => Promise<void>
) {
  await startup()
  console.log('Indo pegar as informações da série...')
  const series = await getSeriesInfo(seriesSlug)
  console.log('Informações obtidas!')
  const chapters_list = series.episodes
  const chapter = chapters_list.find((chapter) => chapter.seq == chapter_number)
  const bought_chapters = await getBoughtChapters(series.id)
  if (chapter && !bought_chapters.includes(chapter.id)) {
    await buyChapter(chapter)
  }
  console.log(bought_chapters)
  if (chapter) {
    const content = await getEpisodeContent(seriesSlug, chapter?.name)
    const chapter_url = await handleChapter(
      content,
      chapter_number.toString(),
      seriesSlug,
      '',
      use_waifu
    )
    return chapter_url
  } else {
    ;('Chapter wasnt found.')
  }
}

export async function getLezhinLatestChapter(
  seriesId: string,
  chapter_number: string | number
) {
  await startup()
  const series = await getSeriesInfo(seriesId)
  const chapters_list = series.episodes
  const chapter = chapters_list.find(
    (chapter) => chapter.id == series.lastEpisodeId
  )
  const bought_chapters = await getBoughtChapters(series.id)
  if (chapter && !bought_chapters.includes(chapter.id)) {
    await buyChapter(chapter)
  }
  console.log(bought_chapters)
  if (chapter) {
    const content = await getEpisodeContent(seriesId, chapter?.name)
    const chapter_url = await handleChapter(
      content,
      chapter_number.toString(),
      seriesId,
      '',
      use_waifu
    )
    return chapter_url
  } else {
    ;('Chapter wasnt found.')
  }
}

export * from './api.js'
export * from './browser.js'
