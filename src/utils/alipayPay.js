import { GetOpenId } from '@/api/customer.js'
import { PAY_TYPE_ALIPAY, ALI_OPENID_KEY } from './payEnv.js'

function onAlipayJSBridgeReady(callback) {
  if (window.AlipayJSBridge) {
    callback()
    return
  }
  document.addEventListener('AlipayJSBridgeReady', callback, false)
}

export function getCachedAlipayUserId() {
  return sessionStorage.getItem(ALI_OPENID_KEY) || ''
}

export function cacheAlipayUserId(userId) {
  if (userId) {
    sessionStorage.setItem(ALI_OPENID_KEY, userId)
  }
}

async function exchangeAlipayCode(code) {
  const res = await GetOpenId({ code, payType: PAY_TYPE_ALIPAY })
  if (!res.data.success) {
    throw new Error(res.data.msg || '获取支付宝userid失败')
  }
  const data = res.data.response
  const userId = data?.openid || (typeof data === 'string' ? data : '')
  if (!userId) {
    throw new Error('获取支付宝userid失败')
  }
  cacheAlipayUserId(userId)
  return userId
}

function getAuthCode(appId) {
  return new Promise((resolve, reject) => {
    onAlipayJSBridgeReady(() => {
      AlipayJSBridge.call(
        'getAuthCode',
        { appId },
        (result) => {
          if (result.authCode) {
            resolve(result.authCode)
          } else {
            reject(new Error(result.errorMessage || '获取支付宝授权码失败'))
          }
        }
      )
    })
  })
}

export async function getAlipayUserId(appId) {
  const cached = getCachedAlipayUserId()
  if (cached) return cached

  if (!appId) {
    throw new Error('缺少支付宝appId配置')
  }

  const authCode = await getAuthCode(appId)
  return exchangeAlipayCode(authCode)
}

export function invokeAlipayPay(tradeNO) {
  if (typeof my !== 'undefined' && my.tradePay) {
    return new Promise((resolve, reject) => {
      my.tradePay({
        tradeNO,
        success: (res) => resolve(res),
        fail: (err) => reject(new Error(err.errorMessage || '支付宝支付失败')),
      })
    })
  }

  return new Promise((resolve, reject) => {
    onAlipayJSBridgeReady(() => {
      AlipayJSBridge.call(
        'tradePay',
        { tradeNO },
        (result) => {
          if (result.resultCode === '9000') {
            resolve(result)
          } else if (result.resultCode === '6001') {
            reject(new Error('用户取消支付'))
          } else {
            reject(new Error(result.memo || '支付宝支付失败'))
          }
        }
      )
    })
  })
}
