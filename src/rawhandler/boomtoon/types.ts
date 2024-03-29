type AccessToken = {
  token: string
  createdAt: number
  expiredAt: number
}

type RefreshToken = {
  token: string
  createdAt: number
  expiredAt: number
}

type UserPlatform = {
  is_app: boolean
  is_android: boolean
  is_ios: boolean
  platform_name: string
  is_ios_guest: boolean
  is_viewer_app: boolean
  is_viewer_android: boolean
  is_viewer_ios: boolean
  deviceId: string | null
  deviceModel: string | null
}

type User = {
  email: string
  accessToken: AccessToken
  refreshToken: RefreshToken
  isSignUp: boolean
  ipAddress: string
  userPlatform: UserPlatform
}

export type BtSession = {
  user: User
  expires: string
}

export interface SeriesResponse {
  result: string
  data: Series
}
export interface Series {
  id: number
  alias: string
  title: string
  isAdult: boolean
  isComplete: boolean
  synopsis: string
  type: string
  oneRentPeriod: number
  allRentPeriod: number
  saleType: string
  status: string
  devices: Devices
  tag: string
  tags: Tag[]
  banner?: any
  episodes: Episode[]
  isAdvert: boolean
  isFavorite: boolean
  isAlarm: boolean
  recentEpisodeId?: any
  thumbnails: Thumbnail[]
  viewCount: number
  favoriteCount: number
  isComment: boolean
  commentCount: number
  bestComment?: any
  isSale: boolean
  schedules: string[]
  hasViewerBottomBanner: boolean
  creators: Creator[]
  freetimeInfo?: any
  contentsPurchaseRewards: any[]
  isMixed: boolean
}
interface Creator {
  creatorId: number
  name: string
  type: string
}
interface Episode {
  id: number
  alias: string
  title: string
  subTitle: string
  openedAt: number
  isLogin: boolean
  isAdult: boolean
  isUp: boolean
  possessionCoin: number
  rentCoin: number
  permanentCoin: number
  thumbnails: Thumbnail[]
  orderNo: number
  eventPossessionCoin?: any
  eventRentCoin?: any
  contentType: string
  purchaseStatus?: any
  expiredAt: number
  isRentGift: boolean
  isPossessionGift: boolean
  isRentFreetime: boolean
  isFavoriteEpisode: boolean
}
interface Thumbnail {
  imagePath: string
  type: string
}
interface Tag {
  name: string
  isExtra: boolean
}
interface Devices {
  isWeb: boolean
  isAndPlay: boolean
  isIosApp: boolean
}

export interface EpisodeResponse {
  result: string
  data: DataEpisode
}
interface DataEpisode {
  contentsId: number
  contentsAlias: string
  contentsTitle: string
  contentsType: string
  contentsSynopsis: string
  contentsTag: string
  contentsStatus: string
  isSale: boolean
  episodeId: number
  saleType: string
  newOpenedAt?: any
  title: string
  subTitle: string
  viewerType: string
  paperOption: string
  paperDirection: string
  type: string
  contentType: string
  isAdult: boolean
  isScramble: boolean
  images: Image[]
  mark: string
  isFavorite: boolean
  isFavoriteEpisode: boolean
  isPossession: boolean
  isComment: boolean
  isCheerComment: boolean
  commentCount: number
  nextEpisode: NextEpisode
  prevEpisode?: any
  creators: Creator[]
  hasViewerBottomBanner: boolean
  qrcode?: any
  noticeImages: any[]
  imageTotalHeight: number
}

interface NextEpisode {
  id: number
  alias: string
}
interface Image {
  imagePath: string
  orderNo: number
  width: number
  height: number
  defaultHeight: number
  scrambleIndex?: any
  expiredAt: number
}

export interface EpisodeStateData {
  result: string
  data: EpisodeState
}
interface EpisodeState {
  contentsId: number
  contentsTitle: string
  contentsAlias: string
  episodeId: number
  episodeTitle: string
  episodeAlias: string
  isLogin: boolean
  isAdult: boolean
  possessionCoin: number
  rentCoin: number
  permanentCoin: number
  isAvailable: boolean
  priceInfo: PriceInfo
  isPossessionGift: boolean
  isRentGift: boolean
  isRentFreetime: boolean
  thumbnails: Thumbnail[]
}

interface PriceInfo {
  allPossessionCoin: number
  allPossessionCount: number
  allRentCoin: number
  allRentCount: number
  paymentInfo: PaymentInfo
}
interface PaymentInfo {
  purchaseType: string
  paymentCoin: number
  paymentOriginPrice: number
  paymentPrice: number
  paymentCount: number
  remainCoin: number
}
