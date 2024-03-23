const { username, pwd } = require('../../../config.json')
import axios from 'axios'
import { load } from 'cheerio'
import { redis } from '../../redis'
import { handleChapter } from '../'
const { waifu: use_waifu } = require('../../../config.json')
import puppeteer from 'puppeteer'

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
  const cookies = await redis.get('ridi_cookies')
  if (cookies) return

  const auth_tokens = await axios.post(
    'https://account.ridibooks.com/oauth2/token',
    {
      auto_login: true,
      grant_type: 'password',
      password: pwd,
      username: username,
      client_id: 'ePgbKKRyPvdAFzTvFg2DvrS7GenfstHdkQ2uvFNd',
    }
  )

  console.log(auth_tokens)

  const data = auth_tokens.data as RidiAuth

  await redis.set(
    'ridi_cookies',
    `user_device_type=PC; ridi_auth=; ridibooks.connect.sid=s%3Aicxqe0oklZvvM-u4vZnDHuY4jkG3KFwn.As%2FC7Et%2B8eGgmHHjSz4zWouP2g5jlzE73MgnKq%2BGI4Y; fingerprint=17e1d6abdc37b9d9d22226422959f24f; _fwb=221AhaGTDQrT4nYy0k7xprq.1711141962082; _tt_enable_cookie=1; _ttp=J1cm90mVRwbCL2NywEsMUjSvmu9; _fbp=fb.1.1711141963127.1751385652; ab.storage.deviceId.1440c75a-6f4b-48d9-8e69-8d6fd78a9fbc=%7B%22g%22%3A%221b89026e-2903-4256-c86b-6df53353f5a4%22%2C%22c%22%3A1711141963160%2C%22l%22%3A1711141963160%7D; PHPSESSID=5364f845-b71d-4ffc-ae8c-90108f08acab; ridi-al=1;PHPSESSID=00f1a4cf-18ea-4588-bbcc-5a7fa3924535;ridi-at=${data.access_token}; ridi-rt=${data.refresh_token};`,
    'EX',
    data.refresh_token_expires_in
  )

  return data as RidiAuth
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

  const first_request = await axios.post(
    `https://ridibooks.com/api/payment/route/book`,
    new URLSearchParams({
      'b_ids[]': chapter_id,
      is_prefer_return_api_endpoint: 'false',
      pay_object: 'rent',
      return_url_at_fail:
        'https://ridibooks.com/books/1746021079?type=rent#formSeriesList',
      return_url: '',
      is_v2: 'true',
    }),
    {
      headers: {
        cookie: cookies!,
      },
    }
  )

  const first_request_data = first_request.data as BuyChapterAuthRequest

  await axios.post(
    first_request_data.payment_book_cash_and_point.link,
    new URLSearchParams(
      first_request_data.payment_book_cash_and_point.parameters
    ),
    {
      headers: {
        cookie: cookies!,
      },
    }
  )
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

  const unparsed = (
    await axios.post(
      `https://ridibooks.com/api/web-viewer/generate`,
      { book_id: chapter_id },
      {
        headers: {
          cookie: cookies!,
        },
      }
    )
  ).data as RidiUnparsedContent

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
    await buyChapter(chapter.chapter_id)
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
