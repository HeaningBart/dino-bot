import {
  buyChapter,
  getBoughtChapters,
  getEpisodeContent,
  getSeriesInfo,
} from "./api";
import { startup } from "./browser";
import { handleChapter } from "..";
const { waifu: use_waifu } = require("../../../config.json");

export async function getLezhinSpecificChapter(
  seriesSlug: string,
  chapter_number: string | number
) {
  await startup();
  const series = await getSeriesInfo(seriesSlug);
  const chapters_list = series.episodes;
  console.log(chapters_list);
  const chapter = chapters_list.find(
    (chapter) => chapter.seq == chapter_number
  );
  const bought_chapters = await getBoughtChapters(series.id);
  if (chapter && !bought_chapters.includes(chapter.id)) {
    await buyChapter(chapter);
  }
  console.log(bought_chapters);
  if (chapter) {
    const content = await getEpisodeContent("farm", chapter?.name);
    const chapter_url = await handleChapter(
      content,
      chapter_number.toString(),
      seriesSlug,
      "",
      use_waifu
    );
    return chapter_url;
  } else {
    ("Chapter wasnt found.");
  }
}

export async function getLezhinLatestChapter(
  seriesId: string,
  chapter_number: string | number
) {
  await startup();
  const series = await getSeriesInfo(seriesId);
  const chapters_list = series.episodes;
  const chapter = chapters_list.find(
    (chapter) => chapter.id == series.lastEpisodeId
  );
  const bought_chapters = await getBoughtChapters(series.id);
  if (chapter && !bought_chapters.includes(chapter.id)) {
    await buyChapter(chapter);
  }
  console.log(bought_chapters);
  if (chapter) {
    const content = await getEpisodeContent("farm", chapter?.name);
    const chapter_url = await handleChapter(
      content,
      chapter_number.toString(),
      seriesId,
      "",
      use_waifu
    );
    return chapter_url;
  } else {
    ("Chapter wasnt found.");
  }
}

export * from "./api";
export * from "./browser";
