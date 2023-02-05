import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: "2captcha", token: "0f072094b870ccff32282446d3a3cc5e" },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);
const { email, password } = require("../../../config.json");

export async function start() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
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
  } catch (error) {}
  await page.setCookie({
    name: "_kpdid",
    value: "a6f58d9219f044d4985f131c72b0085e",
    domain: ".kakao.com",
    httpOnly: true,
    path: "/",
  });
  await page.click("div.pr-16pxr", {
    clickCount: 2000,
  });

  await page.waitForNavigation();

  // const newTarget = await browser.waitForTarget(
  //   (target) => target.opener() === pageTarget
  // );

  const newPage = page;

  if (newPage) {
    await newPage.waitForTimeout(5000);
    console.log("estou aqui");
    console.log(newPage.url());
    await newPage.setViewport({ width: 1080, height: 1080 });
    await newPage.screenshot({ path: "./beforelogin.png" });
    await newPage.type('input[type="text"]', email);
    await newPage.type('input[name="password"]', password);
    await newPage.click('input[type="checkbox"]');
    try {
      try {
        await newPage.solveRecaptchas();
      } catch (error) {}
      await newPage.keyboard.press("Enter");
      await newPage.waitForTimeout(5000);
      try {
        await newPage.solveRecaptchas();
      } catch (error) {}
      await newPage.keyboard.press("Enter");
    } catch (e) {}
  }

  try {
    await page.waitForNavigation({ timeout: 10000 });
  } catch (error) {
    console.log(error);
  }

  const cookies = await page.cookies();
  const new_cookies = cookies.map((item) => `${item.name}=${item.value};`);
  const filtered_cookies = new_cookies.join(" ");

  console.log(filtered_cookies);

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
