import { Browser } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'
import { redis } from '../../redis/index.js'

puppeteer.use(StealthPlugin())
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: '2captcha', token: '0f072094b870ccff32282446d3a3cc5e' },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

const email = process.env.lezhin_email!
const password = process.env.lezhin_password!

export async function start() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  return browser
}

export async function logIn(browser: Browser) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  console.log('Connecting to Lezhin...')

  await page.goto('https://www.lezhin.com/ko/login?redirect=%2Fko#email')

  console.log('Inserting login data...')

  await page.type('input#login-email', email)
  await page.type('input#login-password', password)
  await page.click('input[name="remember_me"]')

  setTimeout(async () => await page.click("button[type='submit']"), 1000)

  console.log('Logging in...')

  await page.waitForNavigation()
  console.log(page.url())
  await page.goto('https://www.lezhin.com/ko')

  const cookies = await page.cookies()
  const new_cookies = cookies.map((item) => `${item.name}=${item.value};`)
  const filtered_cookies = new_cookies.join(' ')

  await redis.set('lezhin_cookies', filtered_cookies, 'EX', 60 * 60 * 24)

  console.log(filtered_cookies)

  console.log('Cookies are set.')
}

export async function startup() {
  const cookies = await redis.get('lezhin_cookies')
  if (cookies !== null) return
  const browser = await start()
  await logIn(browser)
  await browser.close()
}
