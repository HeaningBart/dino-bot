import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'
puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: '2captcha', token: '0f072094b870ccff32282446d3a3cc5e' },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
    throwOnError: true

  })
)
const { email, password } = require("../../../config.json");

export async function start() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  return browser;
}

export async function logIn(browser: Browser) {
  const page = await browser.newPage();
  const pageTarget = page.target();
  await page.setViewport({ width: 1920, height: 1080 });
  console.log("eu estou aqui");
  try {
    await page.goto("https://page.kakao.com/", { timeout: 15000 });
  } catch (error) { }
  await page.setCookie({ name: '_kpdid', value: "a6f58d9219f044d4985f131c72b0085e", domain: ".kakao.com", httpOnly: true, path: '/' })
  await page.click('img[src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMi4wMDA5IDJDOS4yMzg5OSAyIDcgNC4yMzg5OCA3IDcuMDAwOTFDNyA5Ljc2Mjg1IDkuMjM4OTkgMTIuMDAxOCAxMi4wMDA5IDEyLjAwMThDMTQuNzYyOSAxMi4wMDE4IDE3LjAwMTggOS43NjI4NSAxNy4wMDE4IDcuMDAwOTFDMTcuMDAxOCA0LjIzODk4IDE0Ljc2MjkgMiAxMi4wMDA5IDJaTTguNSA3LjAwMDkxQzguNSA1LjA2NzQxIDEwLjA2NzQgMy41IDEyLjAwMDkgMy41QzEzLjkzNDQgMy41IDE1LjUwMTggNS4wNjc0MSAxNS41MDE4IDcuMDAwOTFDMTUuNTAxOCA4LjkzNDQxIDEzLjkzNDQgMTAuNTAxOCAxMi4wMDA5IDEwLjUwMThDMTAuMDY3NCAxMC41MDE4IDguNSA4LjkzNDQxIDguNSA3LjAwMDkxWiIgZmlsbD0iIzIyMjIyMiIvPgo8cGF0aCBkPSJNOC43NSAxNEM1LjAyMjA4IDE0IDIgMTcuMDIyMSAyIDIwLjc1VjIxLjk5NTNIMy41VjIwLjc1QzMuNSAxNy44NTA1IDUuODUwNTEgMTUuNSA4Ljc1IDE1LjVIMTUuMjUyN0MxOC4xNTIyIDE1LjUgMjAuNTAyNyAxNy44NTA1IDIwLjUwMjcgMjAuNzVWMjEuOTk1M0gyMi4wMDI3VjIwLjc1QzIyLjAwMjcgMTcuMDIyMSAxOC45ODA3IDE0IDE1LjI1MjcgMTRIOC43NVoiIGZpbGw9IiMyMjIyMjIiLz4KPC9zdmc+Cg=="',
    {
      clickCount: 2000,
    });
  const newTarget = await browser.waitForTarget(
    (target) => target.opener() === pageTarget
  );
  const newPage = await newTarget.page()

  if (newPage) {
    await newPage.waitForTimeout(5000);
    console.log("estou aqui");
    console.log(newPage.url());
    await newPage.setViewport({ width: 1080, height: 1080 });
    await newPage.screenshot({ path: "./beforelogin.png" });
    await newPage.type('input[type="text"]', email);
    await newPage.type('input[name="password"]', password);
    await newPage.click('input[type="checkbox"]');
    await newPage.solveRecaptchas();
    await newPage.keyboard.press("Enter");
    await newPage.waitForTimeout(5000);
    await newPage.solveRecaptchas();
    await newPage.keyboard.press("Enter");
  }

  await page.waitForNavigation({ timeout: 300000 })

  const cookies = await page.cookies();
  const new_cookies = cookies.map((item) => `${item.name}=${item.value};`);
  const filtered_cookies = new_cookies.join(" ");

  console.log(filtered_cookies)

  return filtered_cookies;


}

export async function buyTicket(browser: Browser, series_id: string) {
  let buy_url = "https://page.kakao.com/buy/ticket?seriesId=" + series_id;
  const new_page = await browser.newPage();
  await new_page.setViewport({ width: 1080, height: 1080 });
  await new_page.goto(buy_url);
  await new_page.waitForNetworkIdle();
  await new_page.click('button[type="submit"]');
  await new_page.click('button[type="button"].btnBuy');
  await new_page.waitForTimeout(2000);
  await new_page.click("span.btnBox");
  await new_page.waitForNetworkIdle();
  await new_page.close();
}
