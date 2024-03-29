const { bt_username, bt_pwd } = require('../../../config.json')
import axios from 'axios'
import { load } from 'cheerio'
import { redis } from '../../redis'
import { handleChapter } from '../'
const { waifu: use_waifu } = require('../../../config.json')
import puppeteer from 'puppeteer'
import fetch from 'node-fetch'
import {
  BtSession,
  EpisodeResponse,
  EpisodeStateData,
  SeriesResponse,
} from './types'

const BoomToonAPI = axios.create({
  baseURL: 'https://www.bomtoon.com/api',
  headers: {
    'X-Balcony-Id': 'BOMTOON_COM',
  },
})

export async function start() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  return browser
}

export async function logIn() {
  const bt_cookies = await redis.get('bt')
  if (bt_cookies) return

  const browser = await start()
  const page = await browser.newPage()
  await page.goto('https://www.bomtoon.com/user/login')
  await page.type('input[type="text"]', bt_username)
  await page.type('input[type="password"]', bt_pwd)
  await page.click('div[role="button"]')
  await page.waitForNavigation()
  const cookies = await page.cookies()
  await redis.set(
    'bt',
    cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
  )
  await browser.close()
}

export async function get_bt_access_token() {
  const at_cookie = await redis.get('bt_at')
  if (at_cookie) {
    BoomToonAPI.defaults.headers.common['Authorization'] = `Bearer ${at_cookie}`
    return at_cookie
  }
  const cookies = await redis.get('bt')
  const session = await axios.get<BtSession>(
    'https://www.bomtoon.com/api/auth/session',
    {
      headers: {
        cookie: cookies!,
      },
    }
  )
  await redis.set(
    'bt_at',
    session.data.user.accessToken.token,
    'EX',
    60 * 60 * 23
  )
  BoomToonAPI.defaults.headers.common[
    'Authorization'
  ] = `Bearer ${session.data.user.accessToken.token}`
  return session.data.user.accessToken.token
}

export async function get_series_info(series_slug: string) {
  const series = await BoomToonAPI.get<SeriesResponse>(
    `https://www.bomtoon.com/api/balcony-api-v2/contents/${series_slug}?isNotLoginAdult=false&isPorch=false`
  )
  return series.data.data
}

export async function get_chapter_state(
  series_slug: string,
  chapter_alias: string
) {
  const response = await BoomToonAPI.get<EpisodeStateData>(
    `https://www.bomtoon.com/api/balcony-api-v2/contents/price/${series_slug}/${chapter_alias}?isNotLoginAdult=false`
  )
  return response.data.data
}

export async function log_purchase_transaction(chapter_id: number) {}

export async function purchase_chapter(chapter_id: number) {
  await log_purchase_transaction(chapter_id)
  await BoomToonAPI.post('https://www.bomtoon.com/api/balcony-api/purchase', {
    id: chapter_id,
    isMobile: false,
    purchaseType: 'POSSESSION',
  })
}

export async function get_chapter_data(
  series_slug: string,
  chapter_alias: string
) {
  const response = await BoomToonAPI.get<EpisodeResponse>(
    `https://www.bomtoon.com/api/balcony-api-v2/contents/viewer/${series_slug}/${chapter_alias}?isNotLoginAdult=false`
  )
  return response.data.data
}

export async function getBoomToonChapter(
  series_id: string | number,
  chapter_number: string | number
) {
  try {
    await logIn()
    await get_bt_access_token()
    const series = await get_series_info(series_id.toString())
    const chapter = series.episodes.find(
      (chapter) => chapter.alias == chapter_number
    )
    if (!chapter) throw new Error()
    const chapter_state = await get_chapter_state(
      series_id.toString(),
      chapter.alias
    )
    console.log(chapter_state)
    if (!chapter_state.isAvailable) {
      await purchase_chapter(chapter.id)
    }
    const chapter_data = await get_chapter_data(
      series_id.toString(),
      chapter.alias
    )
    const images = chapter_data.images.map((image) => image.imagePath)
    const file_url = await handleChapter(
      images,
      chapter_number.toString(),
      series.alias,
      '',
      use_waifu
    )
    return file_url
  } catch (error) {
    return JSON.stringify(error)
  }
}
