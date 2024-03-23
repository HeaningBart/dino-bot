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
  const browser = await start()
  const page = await browser.newPage()
  await page.goto('https://ridibooks.com/account/login')
  await page.waitForSelector('input[placeholder="아이디"]')
  await page.type('input[placeholder="아이디"]', username)
  await page.type('input[placeholder="비밀번호"]', pwd)
  await page.click('button[type="submit"]')
  await page.waitForNavigation()
  const cookies = await page.cookies()
  await redis.set(
    'ridi',
    cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
  )
  await browser.close()
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
}

type RidiChapter = {
  chapter_id: string
  price: string
  chapter_number: string
  service_type: string
}

export async function getChaptersList(series_id: string | number) {
  const cookies = await redis.get('ridi')

  const html = await axios.get(`https://ridibooks.com/books/${series_id}`, {
    headers: {
      cookie: cookies!,
    },
  })

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
    var cookies = await redis.get('ridi')
    if (!cookies) {
      cookies = await logIn()
      await redis.set('ridi', cookies, 'EX', 259200)
    }
    console.log(cookies)
    const chapters = await getChaptersList(series_id)
    const chapter = chapters.find(
      (chapter) => chapter.chapter_number == chapter_number
    )
    if (!chapter) throw new Error()

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
    if (error && (error as any).data && (error as any).data.error)
      console.log((error as any).data.error)
    return 'error'
  }
}
