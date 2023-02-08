const { username, pwd } = require("../../../config.json");
import axios from "axios";
import { load } from "cheerio";
import { redis } from "../../redis";
import { handleChapter } from "../";
const { waifu: use_waifu } = require("../../../config.json");

type RidiAuth = {
  access_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  user: {
    idx: number;
  };
};

export async function logIn() {
  const cookies = await redis.get("ridi_cookies");
  if (cookies) return;

  const auth_tokens = await axios.post(
    "https://account.ridibooks.com/oauth2/token",
    {
      auto_login: true,
      grant_type: "password",
      password: pwd,
      username: username,
      client_id: "ePgbKKRyPvdAFzTvFg2DvrS7GenfstHdkQ2uvFNd",
    }
  );

  const data = auth_tokens.data as RidiAuth;

  await redis.set(
    "ridi_cookies",
    `PHPSESSID=00f1a4cf-18ea-4588-bbcc-5a7fa3924535;ridi-at=${data.access_token}; ridi-rt=${data.refresh_token};`,
    "EX",
    data.refresh_token_expires_in
  );

  return data as RidiAuth;
}

type RidiChapter = {
  chapter_id: string;
  price: string;
  chapter_number: string;
  service_type: string;
};

export async function getChaptersList(series_id: string | number) {
  const cookies = await redis.get("ridi_cookies");

  const html = await axios.get(`https://ridibooks.com/books/${series_id}`, {
    headers: {
      cookie: cookies!,
    },
  });

  const $ = load(html.data);

  const chapters: RidiChapter[] = [];

  $(".js_series_book_list.detail_scalable_thumbnail").map((__, el) => {
    chapters.push({
      chapter_id: el.attribs["data-id"],
      price: el.attribs["data-price"],
      chapter_number: el.attribs["data-volume"],
      service_type: el.attribs["data-service_type"],
    });
  });

  return chapters;
}

type BuyChapterAuthRequest = {
  payment_book_cash_and_point: {
    method: string;
    link: string;
    parameters: string;
    is_api: boolean;
  };
};

export async function buyChapter(chapter_id: string) {
  const cookies = await redis.get("ridi_cookies");

  const auth_request = (
    await axios.get(
      `https://ridibooks.com/api/payment/route/book?is_prefer_return_api_endpoint=true&pay_object=buy&b_ids%5B%5D=${chapter_id}&return_url=&return_url_at_fail=https%3A%2F%2Fridibooks.com%2Fbooks%2F3885010321&is_v2=true`,
      {
        headers: {
          cookie: cookies!,
        },
      }
    )
  ).data as BuyChapterAuthRequest;

  await axios.post(
    auth_request.payment_book_cash_and_point.link,
    auth_request.payment_book_cash_and_point.parameters,
    {
      headers: {
        cookie: cookies!,
        "content-type": "application/x-www-form-urlencoded",
      },
    }
  );
}

type RidiUnparsedContent = {
  book_id: string;
  pages: Array<{ src: string }>;
  success: boolean;
  type: string;
};

export async function getChapterContent(chapter_id: string) {
  const cookies = await redis.get("ridi_cookies");

  const unparsed = (
    await axios.get(`https://view.ridibooks.com/generate/${chapter_id}`, {
      headers: {
        cookie: cookies!,
      },
    })
  ).data as RidiUnparsedContent;

  const images = unparsed.pages.map((value) => {
    return value.src;
  });

  return images;
}

export async function getRidiChapter(
  series_id: string | number,
  chapter_number: string | number
): Promise<string> {
  try {
    await logIn();
    const chapters = await getChaptersList(series_id);
    const chapter = chapters.find(
      (chapter) => chapter.chapter_number == chapter_number
    );
    if (!chapter) throw new Error();
    if (chapter.service_type == "rent") {
      await buyChapter(chapter.chapter_id);
    }
    const images = await getChapterContent(chapter.chapter_id);
    const file_url = (await handleChapter(
      images,
      chapter_number.toString(),
      series_id.toString(),
      "",
      use_waifu
    ))!;
    return file_url;
  } catch (error) {
    console.log(error);
    return "error";
  }
}
