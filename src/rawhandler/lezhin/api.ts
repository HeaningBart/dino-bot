import axios from "axios";
import { redis } from "../../redis";
import { startup } from "./browser";
import { handleChapter } from "..";

const LezhingCDN = "https://rcdn.lezhin.com/v2";

type LezhinSeries = {
  alias: string;
  episodes: LezhingEpisode[];
  id: number;
  lastEpisodeId: number;
  updatedAt: number;
};

type LezhingEpisode = {
  id: number;
  name: string;
  display: {
    title: string;
    type: string;
    displayName: string;
  };
  coin: number;
  publishedAt: number;
  updatedAt: number;
  seq: number;
  freedAt: number;
};

type ScrollInfo = {
  width: number;
  height: number;
  mediaType: string;
  path: string;
};

type LezhingEpisodeContent = {
  contentId: number;
  id: number;
  idComic: number;
  name: string;
  point: number;
  scroll: number;
  scrollsInfo: ScrollInfo[];
  updatedAt: number;
};

type AuthObject = {
  "Key-Pair-Id": string;
  Policy: string;
  Signature: string;
  expiredAt: number;
  now: number;
};

export const Lezhin_API = axios.create({
  baseURL: "https://www.lezhin.com/lz-api/v2",
});

export async function getSeriesInfo(comic_slug: string): Promise<LezhinSeries> {
  const cookie = (await redis.get("lezhin_cookies"))!;
  const html = await axios.get(
    `https://www.lezhin.com/ko/comic/${comic_slug}`,
    {
      headers: {
        cookie,
      },
    }
  );
  const first_index = html.data.indexOf("product: ");
  const last_index = html.data.indexOf("departure: '',");
  const parsed = html.data
    .slice(first_index, last_index)
    .replaceAll("\n", "")
    .replace("product: ", "");
  const last_dot = parsed.lastIndexOf(",");
  const parsed_html = JSON.parse(parsed.slice(0, last_dot));
  return parsed_html;
}

async function getRequestHeaders() {
  const bearer = (await redis.get("lezhin_bearer"))!;
  const cookie = (await redis.get("lezhin_cookies"))!;

  return {
    Authorization: `Bearer ${bearer}`,
    cookie,
  };
}

export async function getAuthKeys(episode: LezhingEpisodeContent) {
  const headers = await getRequestHeaders();

  const auth = (
    await Lezhin_API.get(
      `cloudfront/signed-url/generate?contentId=${episode.contentId}&episodeId=${episode.id}&purchased=false&q=30&firstCheckType=P`,
      {
        headers,
      }
    )
  ).data.data as AuthObject;

  return auth;
}

export async function getEpisodeContent(
  comic_slug: string,
  episode_name: string | number
) {
  const bearer = (await redis.get("lezhin_bearer"))!;
  const cookie = (await redis.get("lezhin_cookies"))!;

  const unparsed = await axios.get(
    `https://www.lezhin.com/lz-api/v2/inventory_groups/comic_viewer?platform=web&store=web&alias=${comic_slug}&name=${episode_name}&preload=false&type=comic_episode`,
    {
      headers: {
        cookie,
        Authorization: `Bearer ${bearer}`,
        "x-lz-adult": 2,
        "x-lz-allowadult": true,
        "x-lz-country": "br",
        "x-lz-locale": "ko-KR",
      },
    }
  );

  const unparsed_content = unparsed.data.data.extra
    .episode as LezhingEpisodeContent;

  const {
    "Key-Pair-Id": KPI,
    Policy,
    Signature,
  } = await getAuthKeys(unparsed_content);

  const images = unparsed_content.scrollsInfo.map((scroll) => {
    return `${LezhingCDN}${scroll.path}.webp?purchased=false&q=30&updated=${unparsed_content.updatedAt}&Policy=${Policy}&Signature=${Signature}&Key-Pair-Id=${KPI}`;
  });

  return images;
}

export async function getBoughtChapters(series_id: number | string) {
  const headers = await getRequestHeaders();
  const user_id = (await redis.get("lezhin_id"))!;

  const unparsed = (
    await axios.get(
      `https://www.lezhin.com/lz-api/v2/users/${user_id}/contents/${series_id}`,
      {
        headers,
      }
    )
  ).data.data.purchased as Array<number>;
  return unparsed;
}

export async function buyChapter(episode: LezhingEpisode) {
  const user_id = (await redis.get("lezhin_id"))!;
  const bearer = (await redis.get("lezhin_bearer"))!;
  const cookie = (await redis.get("lezhin_cookies"))!;

  await axios.get("https://www.lezhin.com/internal/isLogin", {
    headers: {
      Authorization: `Bearer ${bearer}`,
      cookie,
    },
  });

  await axios.post(
    `https://www.lezhin.com/lz-api/v2/users/${user_id}/purchases`,
    {
      coin: episode.coin,
      items: [episode.id],
      platform: "web",
      point: 0,
      type: "P",
    },

    {
      headers: {
        Authorization: `Bearer ${bearer}`,
        cookie,
        "x-lz-adult": 2,
        "x-lz-allowadult": true,
        "x-lz_country": "br",
        "x-lz-locale": "ko-KR",
      },
    }
  );
}
