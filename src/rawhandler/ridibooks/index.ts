const username = process.env.username!
const pwd = process.env.pwd!
import axios from 'axios'
import { load } from 'cheerio'
import { redis } from '../../redis/index.js'
import { handleChapter } from '../index.js'
const use_waifu = JSON.parse(process.env.waifu!)

import puppeteer from 'puppeteer'
import fetch from 'node-fetch'

type RidiAuth = {
  access_token: string
  expires_in: number
  refresh_token_expires_in: number
  refresh_token: string
  scope: string
  token_type: string
  user: {
    idx: number
  }
}

export async function start() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  return browser
}

export async function logIn() {
  const auth = await axios.post<RidiAuth>(
    'https://account.ridibooks.com/oauth2/token',
    {
      auto_login: true,
      client_id: 'ePgbKKRyPvdAFzTvFg2DvrS7GenfstHdkQ2uvFNd',
      grant_type: 'password',
      password: pwd,
      username: username,
    }
  )

  console.log(auth.data)

  await redis.set(
    'ridi',
    `ridi-at=${auth.data.access_token}; ridi-rt=${auth.data.refresh_token}; ruid=df9ac9f6-ruid-4e7a-bd44-c056c0e2340a; pvid=f4aa1232-pvid-4150-900e-f13caac03c94`
  )
}

type RidiChapter = {
  chapter_id: string
  price: string
  chapter_number: string
  service_type: string
}

export async function getChaptersList(series_id: string | number) {
  const cookies = await redis.get('ridi')

  const html = await axios.get(
    `https://ridibooks.com/books/${series_id}?type=rent#formSeriesList`,
    {
      headers: {
        cookie: cookies!,
      },
    }
  )

  const $ = load(html.data)

  const chapters: RidiChapter[] = []

  const html_chapters = $(
    'li.js_series_book_list.detail_scalable_thumbnail'
  ).toArray()

  console.log(html_chapters)

  for (const chapter of html_chapters) {
    const chapter_id = $(chapter).attr('data-id')!
    const price = $(chapter).attr('data-price')!
    const chapter_number = $(chapter).attr('data-volume')!
    const service_type = $(chapter).attr('data-service_type')!

    chapters.push({
      chapter_id,
      price,
      chapter_number,
      service_type,
    })
  }

  console.log(chapters)

  return chapters
}

type BuyChapterAuthRequest = {
  payment_book_cash_and_point: {
    method: string
    link: string
    parameters: string
    is_api: boolean
  }
}

export async function buyChapter(chapter_id: string) {
  const cookies = await redis.get('ridi')
  console.log(cookies)

  const request = await (
    await fetch(
      `https://ridibooks.com/api/payment/route/book?${new URLSearchParams({
        'b_ids[]': chapter_id,
        is_prefer_return_api_endpoint: 'false',
        pay_object: 'rent',
        return_url_at_fail:
          'https://ridibooks.com/books/1746021079?type=rent#formSeriesList',
        return_url: '',
        is_v2: 'true',
      }).toString()}`,
      {
        headers: {
          cookie: cookies!,
          Origin: `https://ridibooks.com`,
          referer: `https://ridibooks.com/books/1746021079?type=rent`,
        },
      }
    )
  ).json()

  const first_request = await (
    await fetch(
      `https://ridibooks.com/api/payment/route/book?${new URLSearchParams({
        'b_ids[]': chapter_id,
        is_prefer_return_api_endpoint: 'true',
        pay_object: 'rent',
        return_url_at_fail:
          'https://ridibooks.com/books/1746021079?type=rent#formSeriesList',
        return_url: '',
        is_v2: 'true',
      }).toString()}`,
      {
        headers: {
          cookie: cookies!,
          Origin: `https://ridibooks.com`,
          referer: `https://ridibooks.com/books/1746021079?type=rent`,
        },
      }
    )
  ).json()

  const first_request_data = first_request as BuyChapterAuthRequest

  console.log(first_request_data)

  const response2 = await axios.post(
    `${first_request_data.payment_book_cash_and_point.link}`,
    new URLSearchParams(
      first_request_data.payment_book_cash_and_point.parameters
    ),

    {
      headers: {
        cookie: cookies!,
        Origin: `https://ridibooks.com`,
        referer: `https://ridibooks.com/books/1746021079?type=rent`,
      },
    }
  )

  console.log(response2)
}

type RidiUnparsedContent = {
  book_id: string
  data: {
    pages: Array<{ src: string }>
  }
  success: boolean
  type: string
}

export async function getChapterContent(chapter_id: string) {
  const cookies = await redis.get('ridi')
  console.log(cookies)

  const unparsed = (await (
    await fetch(`https://ridibooks.com/api/web-viewer/generate`, {
      method: 'POST',
      headers: {
        cookie: cookies!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book_id: chapter_id }),
    })
  ).json()) as RidiUnparsedContent

  console.log(unparsed)

  const images = unparsed.data.pages.map((value) => {
    return value.src
  })

  return images
}

export async function getRidiChapter(
  series_id: string | number,
  chapter_number: string | number
): Promise<string> {
  try {
    await logIn()
    const chapters = await getChaptersList(series_id)
    const chapter = chapters.find(
      (chapter) => chapter.chapter_number == chapter_number
    )
    if (!chapter) throw new Error()
    try {
      await buyChapter(chapter.chapter_id)
    } catch (error) {
      console.log(error)
    }
    console.log(chapter)
    const images = await getChapterContent(chapter.chapter_id)
    const file_url = (await handleChapter(
      images,
      chapter_number.toString(),
      series_id.toString(),
      '',
      use_waifu
    ))!
    return file_url
  } catch (error) {
    console.log(error)
    return 'error'
  }
}
