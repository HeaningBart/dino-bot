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

  try {
    setTimeout(async () => await page.click("button[type='submit']"), 1000)
    console.log('Logging in...')
    await page.waitForNavigation()
  } catch (error) {
    console.log(error)
  }

  const bearer_token = await page.evaluate((): string => {
    //@ts-ignore
    const { token } = __LZ_CONFIG__
    return token
  })

  console.log(bearer_token)

  const user_id = await page.evaluate((): string => {
    //@ts-ignore
    const { userId } = __LZ_ME__
    return userId
  })

  await redis.set('lezhin_id', user_id)

  await redis.set('lezhin_bearer', bearer_token)

  try {
    await page.goto('https://www.lezhin.com/ko/adult')
    await page.click('button#btn-yes')
    await page.waitForNavigation()
  } catch (error) {}

  const cookies = await page.cookies()
  const new_cookies = cookies.map((item) => `${item.name}=${item.value};`)
  const filtered_cookies = new_cookies.join(' ')

  await redis.set('lezhin_cookies', filtered_cookies)

  console.log('Cookies are set.')

  return bearer_token
}

export async function startup() {
  const bearer_token = await redis.get('lezhin_bearer')

  const user_id = await redis.get('lezhin_id')

  const cookies = await redis.get('lezhin_cookies')

  if (!bearer_token || !user_id || !cookies) {
    const browser = await start()
    await logIn(browser)
    await browser.close()
  }
}
