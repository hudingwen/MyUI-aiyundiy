import { GetPayConfig } from '@/api/customer.js'
import { getWechatOpenId, tryResolveWechatOAuth, getCachedWechatOpenId } from './wechatPay.js'
import { getAlipayUserId, getCachedAlipayUserId } from './alipayPay.js'

export const PAY_TYPE_WECHAT = 1
export const PAY_TYPE_ALIPAY = 2

export const WX_OPENID_KEY = 'wx_openid'
export const ALI_OPENID_KEY = 'ali_openid'

let payConfigCache = null

export function detectPayEnv() {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('micromessenger')) return 'wechat'
  if (ua.includes('alipayclient') || ua.includes('alipay')) return 'alipay'
  return 'other'
}

export async function loadPayConfig() {
  if (payConfigCache) return payConfigCache
  try {
    const res = await GetPayConfig()
    payConfigCache = res.data.response || {}
  } catch {
    payConfigCache = {}
  }
  return payConfigCache
}

export async function ensurePayAuthOnMount(options = {}) {
  const env = detectPayEnv()
  if (env === 'wechat') {
    const codeResult = await tryResolveWechatOAuth()
    if (codeResult?.openid) return { ...codeResult, env: 'wechat' }

    const cached = getCachedWechatOpenId()
    if (cached) return { openid: cached, env: 'wechat' }

    const config = await loadPayConfig()
    if (!config.wechatAppId) throw new Error('微信 appId 未配置')

    const openid = await getWechatOpenId(config.wechatAppId, {
      ...options,
      oauthRedirectBase: config.wechatOAuthRedirectBase,
    })
    return { openid, env: 'wechat' }
  }

  if (env === 'alipay') {
    const cached = getCachedAlipayUserId()
    if (cached) return { openid: cached, env: 'alipay' }

    const config = await loadPayConfig()
    if (!config.alipayAppId) throw new Error('支付宝 appId 未配置')

    const userId = await getAlipayUserId(config.alipayAppId)
    return { openid: userId, env: 'alipay' }
  }

  return null
}

/** @deprecated 使用 ensurePayAuthOnMount */
export const resolveOAuthOnMount = ensurePayAuthOnMount

export function getCachedPayUserId(env) {
  if (env === 'wechat') return getCachedWechatOpenId()
  if (env === 'alipay') return getCachedAlipayUserId()
  return ''
}

export async function getOpenIdByEnv(env, options = {}) {
  const cached = getCachedPayUserId(env)
  if (cached) return cached

  const config = await loadPayConfig()
  if (env === 'wechat') {
    return getWechatOpenId(config.wechatAppId, {
      ...options,
      oauthRedirectBase: config.wechatOAuthRedirectBase,
    })
  }
  if (env === 'alipay') {
    return getAlipayUserId(config.alipayAppId, options)
  }
  return ''
}

export function getPayTypeByEnv(env) {
  if (env === 'wechat') return PAY_TYPE_WECHAT
  if (env === 'alipay') return PAY_TYPE_ALIPAY
  return null
}
