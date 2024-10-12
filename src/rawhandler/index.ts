import puppeteer from 'puppeteer-extra'
import download from 'download'
import util from 'util'
const exec = util.promisify((await import('child_process')).exec)
import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const waifu = path.resolve(__dirname)
import { logIn, start } from './kakao/index.js'
import randomstring from 'randomstring'
import { redis } from '../redis/index.js'
import downloader from 'nodejs-file-downloader'
import { getUrl, uploadFile } from '../b2/index.js'
const use_waifu = JSON.parse(process.env.waifu!)
import { rawsQueue } from '../queue/raws.js'

async function handleChapter(
  images_array: string[],
  number: string,
  title: string,
  cookies: string,
  use_waifu: boolean = true
) {
  try {
    const random = title
    const directory = `dist-${number}-${random}`
    const waifu_directory = `waifu-${number}-${random}`
    const chaptername = `chapter-${number}-${random}`

    await fs.mkdir(waifu_directory, { recursive: true })

    console.log(images_array)

    try {
      const img_array = images_array.map(
        (item: any, index: number) =>
          new downloader({
            url: item,
            directory: `./${directory}`,
            fileName: `${index}.jpg`,
            timeout: 15000,
            maxAttempts: 5,
            headers: {
              Cookie: cookies,
            },
          })
      )

      await Promise.all(img_array.map((item: any) => item.download()))

      console.log('All images have been downloaded.')
    } catch (error) {
      console.log('There was an error downloading images: ' + error)
    }

    await exec(
      `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    )
    console.log('All images have been stitched.')

    if (use_waifu) {
      await exec(
        `waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/Stitched -f jpg -j 2:2:2`,
        { cwd: waifu }
      )
      console.log('All images have been through waifu-2x-caffe.')
    }

    use_waifu
      ? await exec(`7z a public/${chaptername}.7z  ./${waifu_directory}/*`)
      : await exec(`7z a public/${chaptername}.7z  ./${directory}/Stitched/*`)

    await exec(`7z a public/${chaptername}.7z  ./${waifu_directory}/*`)

    const Buffer = await fs.readFile(`./public/${chaptername}.7z`)

    await uploadFile(`${chaptername}.7z`, Buffer)

    fs.rm(`./${directory}`, { recursive: true })
    fs.rm(`./${waifu_directory}`, { recursive: true })
    fs.rm(`./public/${chaptername}.7z`, { recursive: true })

    console.log('Temp directories are being removed.')

    const link = await getUrl(`${chaptername}.7z`)
    return link
  } catch (error) {
    console.log(error)
    console.log(
      `An error in chapter ${number} has occurred during download/stitching/waifu.`
    )
  }
}

type chapter = {
  id: number
  title: string
  free: boolean
  chapter_number: number
  series_id: string
  age_15: boolean
  bought: boolean
}

type kakaoEdge = {
  cursor: string
  node: {
    id: string
    type: string
    single: {
      productId: number
      isFree: boolean
      id: string
      ageGrade: string
      thumbnail: string
      title: string
    }
    row3: {
      badgeList: string[]
    }
  }
  __typename: string
}

type kakaoNode = {
  productId: number
  isFree: boolean
  id: string
  ageGrade: string
  thumbnail: string
  title: string
}

type kakaoChaptersResponse = {
  edges: kakaoEdge[]
  pageInfo: {
    endCursor: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: number
  }
  totalCount: number
}

function formatChapters(
  kakao_chapters: kakaoEdge[],
  seriesid: number | string
): chapter[] {
  return kakao_chapters.map((kakao_node, index: number) => {
    const chapter: kakaoNode = kakao_node.node.single

    const number = parseInt(chapter.title.replaceAll(/\D/g, ''))

    return {
      id: chapter.productId,
      title: chapter.title,
      free: chapter.isFree,
      chapter_number: number ? number : index,
      series_id: seriesid as string,
      age_15: chapter.ageGrade == 'All' ? false : true,
      bought: kakao_node.node.row3.badgeList.includes('LabelBadgeRent')
        ? true
        : false,
    }
  })
}

const fetchChapters = async (
  seriesid: string | number,
  after: string = '0'
) => {
  var cookies = await redis.get('kakao_cookies')
  const bodyData = {
    operationName: 'contentHomeProductList',
    query:
      '\n    query contentHomeProductList($after: String, $before: String, $first: Int, $last: Int, $seriesId: Long!, $boughtOnly: Boolean, $sortType: String) {\n  contentHomeProductList(\n    seriesId: $seriesId\n    after: $after\n    before: $before\n    first: $first\n    last: $last\n    boughtOnly: $boughtOnly\n    sortType: $sortType\n  ) {\n    totalCount\n    pageInfo {\n      hasNextPage\n      endCursor\n      hasPreviousPage\n      startCursor\n    }\n    selectedSortOption {\n      id\n      name\n      param\n    }\n    sortOptionList {\n      id\n      name\n      param\n    }\n    edges {\n      cursor\n      node {\n        ...SingleListViewItem\n      }\n    }\n  }\n}\n    \n    fragment SingleListViewItem on SingleListViewItem {\n  id\n  type\n  thumbnail\n  showPlayerIcon\n  isCheckMode\n  isChecked\n  scheme\n  row1\n  row2\n  row3 {\n    badgeList\n    text\n  }\n  single {\n    productId\n    ageGrade\n    id\n    isFree\n    thumbnail\n    title\n    slideType\n    operatorProperty {\n      isTextViewer\n    }\n  }\n  isViewed\n  eventLog {\n    ...EventLogFragment\n  }\n}\n    \n\n    fragment EventLogFragment on EventLog {\n  fromGraphql\n  click {\n    layer1\n    layer2\n    setnum\n    ordnum\n    copy\n    imp_id\n    imp_provider\n  }\n  eventMeta {\n    id\n    name\n    subcategory\n    category\n    series\n    provider\n    series_id\n    type\n  }\n  viewimp_contents {\n    type\n    name\n    id\n    imp_area_ordnum\n    imp_id\n    imp_provider\n    imp_type\n    layer1\n    layer2\n  }\n  customProps {\n    landing_path\n    view_type\n    helix_id\n    helix_yn\n    helix_seed\n    content_cnt\n    event_series_id\n    event_ticket_type\n    play_url\n    banner_uid\n  }\n}\n    ',
    variables: {
      seriesId: seriesid,
      boughtOnly: false,
      sortType: 'desc',
      after,
    },
  }

  const response = await axios.post(
    'https://page.kakao.com/graphql',
    bodyData,
    {
      headers: {
        Referer: 'https://page.kakao.com/content/' + seriesid,
        Origin: 'https://page.kakao.com',
        Cookie: cookies || '',
        'Content-Type': 'application/json',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )

  console.log(response.data.data.contentHomeProductList)

  return response.data.data.contentHomeProductList
}

export async function getFullChaptersList(
  seriesid: string | number,
  order: string
): Promise<chapter[]> {
  if (order == 'asc' || order == 'desc') {
    const chapters: chapter[] = []

    const fetchUntilSatisfied = async (
      seriesid: string | number,
      chapters: chapter[],
      after: string = '0'
    ) => {
      const response = await fetchChapters(seriesid, after)
      const kakao_chapters = formatChapters(response.edges, seriesid)
      chapters.push(...kakao_chapters)

      if (response.pageInfo.hasNextPage) {
        await fetchUntilSatisfied(
          seriesid,
          chapters,
          `${response.pageInfo.endCursor}`
        )
      } else {
        return
      }
    }

    await fetchUntilSatisfied(seriesid, chapters)

    return chapters
  } else return []
}

export async function getChaptersList(
  seriesid: string | number,
  order: string
): Promise<chapter[]> {
  if (order == 'asc' || order == 'desc') {
    const chapters: chapter[] = []

    const fetchUntilSatisfied = async (
      seriesid: string | number,
      chapters: chapter[],
      after: string = '0'
    ) => {
      const response = await fetchChapters(seriesid, after)
      const kakao_chapters = formatChapters(response.edges, seriesid)
      chapters.push(...kakao_chapters)

      return
    }

    await fetchUntilSatisfied(seriesid, chapters)

    return chapters
  } else return []
}

function getDriveDownloadUrl(string: string): string {
  if (string.startsWith('https://drive.google.com')) {
    return string.split('/')[5]
  } else {
    return string
  }
}

export async function processNaver(
  url: string,
  channel_name: string,
  use_waifu: boolean = true
) {
  try {
    const directory = randomstring.generate()
    const array_of_variables = url.split('/')
    const filename = array_of_variables[array_of_variables.length - 1]

    const downloadd = new downloader({
      url: getDriveDownloadUrl(url),
      directory: `${directory}`,
      fileName: `${filename}`,
    })

    if (url.includes('discord')) {
      await downloadd.download()
    } else if (url.includes('mediafire')) {
      console.log('initializing mediafire')
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      const mediafire_page = await browser.newPage()
      await mediafire_page.goto(url)
      const download_link = await mediafire_page.evaluate(() => {
        const url =
          document.querySelector<HTMLAnchorElement>('a#downloadButton')
        if (url) {
          return url.href
        } else return null
      })
      if (download_link) {
        await download(download_link, `./${directory}`)
      } else return null
    }

    await downloadd.download()
    const files = await fs.readdir(`./${directory}`)
    const name = files[0].split('.')[0] + channel_name
    const ext = files[0].split('.')[1]

    ext === 'rar'
      ? await exec(`rar e "./${files[0]}"`, { cwd: `./${directory}` })
      : await exec(`7z e "./${files[0]}"`, { cwd: `./${directory}` })

    await exec(
      `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    )

    await fs.mkdir(`./${directory}/${name}`, { recursive: true })

    if (use_waifu) {
      await exec(
        `waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
        { cwd: waifu }
      )
    }

    await exec(`7z a public/${name}.7z  ./${directory}/${name}/*`)
    const Buffer = await fs.readFile(`./public/${name}.7z`)
    await uploadFile(`${name}.7z`, Buffer)

    console.log('Chapter processment done.')

    fs.rm(`./public/${name}.7z`, { recursive: true })
    fs.rm(`./${directory}`, { recursive: true })

    const link = await getUrl(`${name}.7z`)
    return link
  } catch (e) {
    console.log(e)
    return null
  }
}

function getGQLQuery_Ticket(seriesId: number | string) {
  return {
    operationName: 'contentMyTicket',
    query:
      '\n    query contentMyTicket($seriesId: Long!, $includeSingle: Boolean, $includeWaitfree: Boolean, $onlyPaidTicket: Boolean) {\n  contentMyTicket(\n    seriesId: $seriesId\n    includeSingle: $includeSingle\n    includeWaitfree: $includeWaitfree\n    onlyPaidTicket: $onlyPaidTicket\n  ) {\n    notOwnCount\n    notReadCount\n    ticketOwnCount\n    ticketRentalCount\n    waitfree {\n      activation\n      chargedAt\n      chargedComplete\n      chargedPeriodByMinute\n      baseDate\n    }\n  }\n}\n    ',
    variables: {
      seriesId,
      includeWaitfree: true,
    },
  }
}

function getGQLQuery_Content(
  seriesId: number | string,
  productId: number | string
) {
  return {
    operationName: 'viewerInfo',
    query:
      'query viewerInfo($seriesId: Long!, $productId: Long!) {\n  viewerInfo(seriesId: $seriesId, productId: $productId) {\n    item {\n      ...SingleFragment\n      __typename\n    }\n    seriesItem {\n      ...SeriesFragment\n      __typename\n    }\n    prevItem {\n      ...NearItemFragment\n      __typename\n    }\n    nextItem {\n      ...NearItemFragment\n      __typename\n    }\n    viewerData {\n      ...TextViewerData\n      ...TalkViewerData\n      ...ImageViewerData\n      ...VodViewerData\n      __typename\n    }\n    displayAd {\n      ...DisplayAd\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SingleFragment on Single {\n  id\n  productId\n  seriesId\n  title\n  thumbnail\n  badge\n  isFree\n  ageGrade\n  state\n  slideType\n  lastReleasedDate\n  size\n  pageCount\n  isHidden\n  remainText\n  isWaitfreeBlocked\n  saleState\n  series {\n    ...SeriesFragment\n    __typename\n  }\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment SeriesFragment on Series {\n  id\n  seriesId\n  title\n  thumbnail\n  categoryUid\n  category\n  categoryType\n  subcategoryUid\n  subcategory\n  badge\n  isAllFree\n  isWaitfree\n  ageGrade\n  state\n  onIssue\n  authors\n  description\n  pubPeriod\n  freeSlideCount\n  lastSlideAddedDate\n  waitfreeBlockCount\n  waitfreePeriodByMinute\n  bm\n  saleState\n  startSaleDt\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment ServicePropertyFragment on ServiceProperty {\n  viewCount\n  readCount\n  ratingCount\n  ratingSum\n  commentCount\n  pageContinue {\n    ...ContinueInfoFragment\n    __typename\n  }\n  todayGift {\n    ...TodayGift\n    __typename\n  }\n  preview {\n    ...PreviewFragment\n    ...PreviewFragment\n    ...PreviewFragment\n    __typename\n  }\n  waitfreeTicket {\n    ...WaitfreeTicketFragment\n    __typename\n  }\n  isAlarmOn\n  isLikeOn\n  ticketCount\n  purchasedDate\n  lastViewInfo {\n    ...LastViewInfoFragment\n    __typename\n  }\n  purchaseInfo {\n    ...PurchaseInfoFragment\n    __typename\n  }\n  preview {\n    ...PreviewFragment\n    __typename\n  }\n}\n\nfragment ContinueInfoFragment on ContinueInfo {\n  title\n  isFree\n  productId\n  lastReadProductId\n  scheme\n  continueProductType\n  hasNewSingle\n  hasUnreadSingle\n}\n\nfragment TodayGift on TodayGift {\n  id\n  uid\n  ticketType\n  ticketKind\n  ticketCount\n  ticketExpireAt\n  ticketExpiredText\n  isReceived\n}\n\nfragment PreviewFragment on Preview {\n  item {\n    ...PreviewSingleFragment\n    __typename\n  }\n  nextItem {\n    ...PreviewSingleFragment\n    __typename\n  }\n  usingScroll\n}\n\nfragment PreviewSingleFragment on Single {\n  id\n  productId\n  seriesId\n  title\n  thumbnail\n  badge\n  isFree\n  ageGrade\n  state\n  slideType\n  lastReleasedDate\n  size\n  pageCount\n  isHidden\n  remainText\n  isWaitfreeBlocked\n  saleState\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment OperatorPropertyFragment on OperatorProperty {\n  thumbnail\n  copy\n  helixImpId\n  isTextViewer\n  selfCensorship\n}\n\nfragment AssetPropertyFragment on AssetProperty {\n  bannerImage\n  cardImage\n  cardTextImage\n  cleanImage\n  ipxVideo\n}\n\nfragment WaitfreeTicketFragment on WaitfreeTicket {\n  chargedPeriod\n  chargedCount\n  chargedAt\n}\n\nfragment LastViewInfoFragment on LastViewInfo {\n  isDone\n  lastViewDate\n  rate\n  spineIndex\n}\n\nfragment PurchaseInfoFragment on PurchaseInfo {\n  purchaseType\n  rentExpireDate\n  expired\n}\n\nfragment NearItemFragment on NearItem {\n  productId\n  slideType\n  ageGrade\n  isFree\n  title\n  thumbnail\n}\n\nfragment TextViewerData on TextViewerData {\n  type\n  atsServerUrl\n  metaSecureUrl\n  contentsList {\n    chapterId\n    contentId\n    secureUrl\n    __typename\n  }\n}\n\nfragment TalkViewerData on TalkViewerData {\n  type\n  talkDownloadData {\n    dec\n    host\n    path\n    talkViewerType\n    __typename\n  }\n}\n\nfragment ImageViewerData on ImageViewerData {\n  type\n  imageDownloadData {\n    ...ImageDownloadData\n    __typename\n  }\n}\n\nfragment ImageDownloadData on ImageDownloadData {\n  files {\n    ...ImageDownloadFile\n    __typename\n  }\n  totalCount\n  totalSize\n  viewDirection\n  gapBetweenImages\n  readType\n}\n\nfragment ImageDownloadFile on ImageDownloadFile {\n  no\n  size\n  secureUrl\n  width\n  height\n}\n\nfragment VodViewerData on VodViewerData {\n  type\n  vodDownloadData {\n    contentId\n    drmType\n    endpointUrl\n    width\n    height\n    duration\n    __typename\n  }\n}\n\nfragment DisplayAd on DisplayAd {\n  sectionUid\n  bannerUid\n  treviUid\n  momentUid\n}\n',
    variables: {
      seriesId,
      productId,
    },
  }
}

function getGQLQuery_useTicket(productId: number | string) {
  return {
    operationName: 'UseTicket',
    query:
      '\n    mutation UseTicket($input: TicketUseMutationInput!) {\n  useTicket(input: $input) {\n    waitfreeChargedAt\n    ticketUid\n  }\n}\n    ',
    variables: {
      input: {
        ticketType: 'RentSingle',
        productId,
      },
    },
  }
}

function getGQLQuery_buyTicket(seriesId: number | string) {
  return {
    operationName: 'buyTicket',
    query:
      'mutation buyTicket($input: TicketBuyMutationInput!) {\n  buyTicket(input: $input) {\n    remainCash\n    purchasedTicketCount\n    __typename\n  }\n}\n',
    variables: {
      input: {
        seriesId,
        ticketKind: 'Rent',
        ticketList: [{ ticketId: `TKT020000000${seriesId}001`, quantity: 1 }],
      },
    },
  }
}

function getGQLQuery_readyToUseTicket(
  seriesId: number | string,
  productId: string | number
) {
  return {
    query:'\n    query readyToUseTicket($seriesId: Long!, $productId: Long!) {\n  readyToUseTicket(seriesId: $seriesId, productId: $productId) {\n    series {\n      isWaitfree\n      waitfreeBlockCount\n      saleMethod\n    }\n    single {\n      readAccessType\n      title\n      waitfreeBlock\n      isDone\n    }\n    my {\n      cashAmount\n      ticketOwnCount\n      ticketRentalCount\n    }\n    available {\n      ticketOwnType\n      ticketRentalType\n    }\n    purchase {\n      ticketRental {\n        ticketId\n        ticketType\n        ticketKind\n        price\n        discountPrice\n      }\n      ticketOwn {\n        ticketId\n        ticketType\n        ticketKind\n        price\n        discountPrice\n      }\n    }\n    nextItem {\n      productId\n      isFree\n      slideType\n      ageGrade\n    }\n  }\n}\n    ',
    variables: {
      productId,
      seriesId,
    },
  }
}

function getGQLQuery_getDevicesList() {
  return {
    operationName: 'deviceInfo',
    query:
      'query deviceInfo {\n  deviceInfo {\n    deviceList {\n      ...Device\n      __typename\n    }\n    deviceReplaceableCount\n    deviceLimitCount\n    __typename\n  }\n}\n\nfragment Device on Device {\n  deviceUid\n  deviceModel\n  isCurrentDevice\n  lastUsedDt\n  createdDt\n}\n',
    variables: {},
  }
}

async function getDeviceCookie(auth_cookies: string) {
  const response = await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_getDevicesList(),
    {
      headers: {
        Cookie: auth_cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )
  return `_kpdid=${response.data.data.deviceInfo.deviceList[0].deviceUid};`
}

async function getTickets(seriesId: string | number, cookies: string) {
  const response = await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_Ticket(seriesId),
    {
      headers: {
        Cookie: cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )
  console.log(response.data)

  return {
    tickets: response.data.data.contentMyTicket.ticketRentalCount,
    status: response.status,
  }
}

async function buyTicket(seriesId: number | string, cookies: string) {
  const response = await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_buyTicket(seriesId),
    {
      headers: {
        Cookie: cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )
  return {
    status: response.status,
  }
}

async function useTicket(productId: number | string, cookies: string) {
  const response = await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_useTicket(productId),
    {
      headers: {
        Cookie: cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )
  return {
    status: response.status,
    data: response.data,
  }
}

async function buyAndUseTicket(
  productId: number | string,
  seriesId: string | number,
  cookies: string
) {
  await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_buyTicket(seriesId),
    {
      headers: {
        Cookie: cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )

  try {
    await axios.post(
      'https://page.kakao.com/graphql',
      getGQLQuery_readyToUseTicket(seriesId, productId),
      {
        headers: {
          Cookie: cookies,
          Referer: 'https://page.kakao.com/content',
          'User-Agent': 'insomnia/9.1.0',
        },
      }
    )
  } catch (error) {
    console.log(error)
  }

  try {
    await axios.post(
      'https://page.kakao.com/graphql',
      getGQLQuery_useTicket(productId),

      {
        headers: {
          Cookie: cookies,
          Referer: 'https://page.kakao.com/content',
          'User-Agent': 'insomnia/9.1.0',
        },
      }
    )

    console.log('Ticket bought and used! [V]')
  } catch (error) {
    console.log(error)
  }
}

async function readyToUseTicket(
  productId: number | string,
  seriesId: number | string,
  cookies: string
) {
  console.log(getGQLQuery_readyToUseTicket(seriesId, productId))
  const response = await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_readyToUseTicket(seriesId, productId),
    {
      headers: {
        Cookie: cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )
  console.log('response from ready to use ticket', response.data)
  return {
    status: response.status,
    data: response.data,
  }
}

async function getChapterContent(
  seriesId: number | string,
  productId: number | string,
  cookies: string
) {
  const response = await axios.post(
    'https://page.kakao.com/graphql',
    getGQLQuery_Content(seriesId, productId),
    {
      headers: {
        Cookie: cookies,
        Referer: 'https://page.kakao.com/content',
        'User-Agent': 'insomnia/9.1.0',
      },
    }
  )
  console.log(response.data)
  return {
    status: response.status,
    files: response.data.data.viewerInfo.viewerData.imageDownloadData.files.map(
      (file: any) => file.secureUrl
    ),
  }
}

async function checkCookiesValidity(cookies: string) {
  try {
    const device = await getDeviceCookie(cookies)
    if (typeof device === 'string') return true
  } catch (error) {
    return false
  }
}

async function getSpecificChapter(
  seriesId: string | number,
  chapter_number: string | number,
  title: string | number
) {
  var cookies = await redis.get('kakao_cookies')
  if (!cookies) {
    const browser = await start()
    cookies = await logIn(browser)
    await browser.close()
    await redis.set('kakao_cookies', cookies, 'EX', 3600)
  }
  const chapters = await getFullChaptersList(seriesId, 'desc')
  console.log(chapters.length)
  console.log(seriesId, chapter_number, title)
  console.log(chapters)
  const chapter = chapters.find(
    (chapter) => chapter.chapter_number == chapter_number
  )
  if (chapter) {
    if (chapter.bought) {
      const content_chapter = await getChapterContent(
        seriesId,
        chapter.id,
        cookies
      )
      const chapter_file = await handleChapter(
        content_chapter.files,
        chapter.chapter_number.toString(),
        title.toString(),
        cookies,
        use_waifu
      )
      return chapter_file
    } else {
      const tickets = await getTickets(seriesId, cookies)
      tickets.tickets == 0 && (await buyTicket(seriesId, cookies))
      await readyToUseTicket(chapter.id, seriesId, cookies)
      await useTicket(chapter.id, cookies)
      const content = await getChapterContent(seriesId, chapter.id, cookies)
      if (content.files) {
        const chapter_file = await handleChapter(
          content.files,
          chapter.chapter_number.toString(),
          title.toString(),
          cookies,
          use_waifu
        )

        return chapter_file
      }
    }
  }
}

async function getLatestChapter(
  seriesId: string | number,
  title: string | number
) {
  try {
    var cookies = await redis.get('kakao_cookies')

    if (!cookies) {
      const browser = await start()
      cookies = await logIn(browser)
      await browser.close()
      await redis.set('kakao_cookies', cookies, 'EX', 259200)
    }

    const isValid = await checkCookiesValidity(cookies)

    if (!isValid) {
      const browser = await start()
      cookies = await logIn(browser)
      await browser.close()
      await redis.set('kakao_cookies', cookies, 'EX', 259200)
    }

    console.log(cookies)
    const chapters = await getChaptersList(seriesId, 'desc')
    console.log(chapters)
    const chapter = chapters[0]
    if (chapter) {
      try {
        const content_chapter = await getChapterContent(
          seriesId,
          chapter.id,
          cookies
        )
        const chapter_file = await handleChapter(
          content_chapter.files,
          chapter.chapter_number.toString(),
          title.toString(),
          cookies,
          use_waifu as boolean
        )
        return chapter_file
      } catch (error) {
        const tickets = await getTickets(seriesId, cookies)
        if (tickets.tickets == 0) {
          await buyTicket(seriesId, cookies)
        } else {
          const useTicket_data = await useTicket(chapter.id, cookies)
          if (
            useTicket_data.data.errors &&
            useTicket_data.data.errors.length > 0
          ) {
            try {
              await buyAndUseTicket(chapter.id, seriesId, cookies)
            } catch (error) {
              await buyAndUseTicket(chapter.id, seriesId, cookies)
              console.log(error)
            }
          }
          const content = await getChapterContent(seriesId, chapter.id, cookies)
          if (content.files) {
            const chapter_file = await handleChapter(
              content.files,
              chapter.chapter_number.toString(),
              title.toString(),
              cookies,
              use_waifu as boolean
            )
            return chapter_file
          }
        }
      }
    }
  } catch (error: any) {
    console.log(error)
    console.log(error.data)
  }
}

async function logInAndSetCookies() {
  var cookies = await redis.get('kakao_cookies')

  if (!cookies) {
    const browser = await start()
    cookies = await logIn(browser)
    await browser.close()
    await redis.set('kakao_cookies', cookies, 'EX', 259200)
  }

  const isValid = await checkCookiesValidity(cookies)

  if (!isValid) {
    const browser = await start()
    cookies = await logIn(browser)
    await browser.close()
    await redis.set('kakao_cookies', cookies, 'EX', 259200)
  }

  console.log(cookies)
}

export {
  handleChapter,
  getSpecificChapter,
  getLatestChapter,
  logInAndSetCookies,
}
