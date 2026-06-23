import { GetOpenId } from '@/api/customer.js'
import { PAY_TYPE_WECHAT, WX_OPENID_KEY } from './payEnv.js'

/**
 * 构建微信 OAuth redirect_uri。
 * 须与公众号后台「网页授权域名」一致：不能带非标准端口、IP、localhost。
 */
function buildRedirectUri(oauthRedirectBase) {
  const current = new URL(window.location.href)
  current.searchParams.delete('code')
  current.searchParams.delete('state')

  const pathAndQuery = `${current.pathname}${current.search}`

  if (oauthRedirectBase) {
    return `${oauthRedirectBase.replace(/\/$/, '')}${pathAndQuery}`
  }

  const port = current.port
  const isStandardPort =
    !port ||
    (current.protocol === 'http:' && port === '80') ||
    (current.protocol === 'https:' && port === '443')

  if (!isStandardPort) {
    current.port = ''
  }

  const hostname = current.hostname
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    throw new Error('请在微信中通过已配置的授权域名访问，或联系管理员配置 wechatOAuthRedirectBase')
  }

  return current.toString()
}

function buildOAuthState(options = {}) {
  return encodeURIComponent(JSON.stringify({
    host: options.host || '',
    years: options.years || 1,
  }))
}

function parseOAuthState(state) {
  if (!state) return null
  try {
    return JSON.parse(decodeURIComponent(state))
  } catch {
    return null
  }
}

function cleanOAuthQuery() {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  window.history.replaceState({}, '', url.toString())
}

export function getCachedWechatOpenId() {
  return sessionStorage.getItem(WX_OPENID_KEY) || ''
}

export function cacheWechatOpenId(openid) {
  if (openid) {
    sessionStorage.setItem(WX_OPENID_KEY, openid)
  }
}

export async function exchangeWechatCode(code) {
  const res = await GetOpenId({ code, payType: PAY_TYPE_WECHAT })
  if (!res.data.success) {
    throw new Error(res.data.msg || '获取微信openid失败')
  }
  const data = res.data.response
  const openid = data?.openid || (typeof data === 'string' ? data : '')
  if (!openid) {
    throw new Error('获取微信openid失败')
  }
  cacheWechatOpenId(openid)
  return openid
}

export async function tryResolveWechatOAuth() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (!code) return null

  const openid = await exchangeWechatCode(code)
  const stateData = parseOAuthState(url.searchParams.get('state'))
  cleanOAuthQuery()
  return { openid, stateData }
}

export function redirectToWechatOAuth(appId, options = {}) {
  if (!appId || !appId.startsWith('wx')) {
    throw new Error('微信 appId 配置错误，请联系管理员配置正确的公众号 appId')
  }
  const redirectUri = encodeURIComponent(buildRedirectUri(options.oauthRedirectBase))
  const state = buildOAuthState(options)
  window.location.href =
    `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}` +
    `&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`
  throw new Error('redirect')
}

export async function getWechatOpenId(appId, options = {}) {
  const cached = getCachedWechatOpenId()
  if (cached) return cached

  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (code) {
    const openid = await exchangeWechatCode(code)
    cleanOAuthQuery()
    return openid
  }

  redirectToWechatOAuth(appId, options)
}

function onWeixinJSBridgeReady(callback) {
  if (typeof WeixinJSBridge !== 'undefined') {
    callback()
    return
  }
  if (document.addEventListener) {
    document.addEventListener('WeixinJSBridgeReady', callback, false)
  } else if (document.attachEvent) {
    document.attachEvent('WeixinJSBridgeReady', callback)
    document.attachEvent('onWeixinJSBridgeReady', callback)
  }
}

export function invokeWechatPay(payParams) {
  return new Promise((resolve, reject) => {
    onWeixinJSBridgeReady(() => {
      WeixinJSBridge.invoke(
        'getBrandWCPayRequest',
        {
          appId: payParams.appId,
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType,
          paySign: payParams.paySign,
        },
        (res) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            resolve(res)
          } else {
            reject(new Error(res.err_msg || '微信支付失败'))
          }
        }
      )
    })
  })
}
