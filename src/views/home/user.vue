<script setup>



import {

  GetNsCustomerInfo

  , getCode

  , StartNS

  , CreateOrder

  , CreateActiveScanOrder

  , CheckOrder

} from '@/api/customer.js'

import { useRoute } from 'vue-router';

import { onMounted, onUnmounted, ref, computed } from 'vue'

import { detectPayEnv, getOpenIdByEnv, getPayTypeByEnv, ensurePayAuthOnMount, loadPayConfig, getCachedPayUserId } from '@/utils/payEnv.js'

import { invokeWechatPay } from '@/utils/wechatPay.js'

import { invokeAlipayPay } from '@/utils/alipayPay.js'

import QRCode from 'qrcode'



import { ElMessage } from 'element-plus'

import { ElLoading } from 'element-plus'



const showHtml = ref('')

const isExpire = ref(true)

const isStop = ref(true)

const endTime = ref('')

const isCanShowInput = ref(false)

const host = ref('')

const years = ref(1)

const isTarget = ref(false)

const payEnv = ref('other')

const paying = ref(false)

const authLoading = ref(false)

const payUserId = ref('')

const myWatch = ref(null)



const isOtherBrowser = computed(() => payEnv.value === 'other')

const authReady = computed(() => isOtherBrowser.value || !!payUserId.value)

const payInfo = ref({})

const qrCodeDataUrl = ref('')



onMounted(async () => {

  payEnv.value = detectPayEnv()



  const route = useRoute();

  const hasQueryHost = !!(route.query && route.query.host)

  if (hasQueryHost) {

    host.value = route.query.host

    isTarget.value = true

  } else {

    await GetUserInfo()

  }



  if (payEnv.value === 'wechat' || payEnv.value === 'alipay') {

    authLoading.value = true

    try {

      await loadPayConfig()

      const authResult = await ensurePayAuthOnMount({ host: host.value, years: years.value })

      if (authResult?.stateData) {

        if (authResult.stateData.host) host.value = authResult.stateData.host

        if (authResult.stateData.years) years.value = authResult.stateData.years

      }

      if (authResult?.openid) {
        payUserId.value = authResult.openid
      }

    } catch (err) {

      if (err?.message && !err.message.includes('redirect')) {

        ElMessage.error(err?.message || '授权登录失败，请重试')

      }

    } finally {

      authLoading.value = false

    }

  }



  if (hasQueryHost) {

    GetUserInfo()

  }

})



onUnmounted(() => {

  clearOrderCheck()

})



const clearOrderCheck = () => {

  if (myWatch.value) {

    clearInterval(myWatch.value)

    myWatch.value = null

  }

}



const handlePaySuccess = () => {

  clearOrderCheck()

  ElMessage.success("续费成功")



  const loading = ElLoading.service({

    lock: true,

    text: '续费成功,页面即将刷新中...',

    background: 'rgba(0, 0, 0, 0.7)',

  })

  loadingNs.value = true

  setTimeout(() => {

    loading.close()

    if (isTarget.value) {

      ToMyNs()

    } else {

      RefreshMyNs()

    }

  }, 5000)

}



const AddOrderCheck = () => {

  clearOrderCheck()

  if (!payInfo.value.data?.out_order_no) return



  myWatch.value = setInterval(() => {
    CheckOrder({ id: payInfo.value.data.out_order_no }).then(() => {
      handlePaySuccess()
    }).catch(() => {})
  }, 3000)

}



const toPay = async () => {

  if (paying.value) return

  paying.value = true

  qrCodeDataUrl.value = ''



  try {

    const env = detectPayEnv()

    payEnv.value = env



    if (env === 'other') {

      const res = await CreateActiveScanOrder({ host: host.value, years: years.value })

      payInfo.value = res.data.response

      if (payInfo.value?.data?.code_url) {

        qrCodeDataUrl.value = await QRCode.toDataURL(payInfo.value.data.code_url, {

          width: 220,

          margin: 1,

        })

        AddOrderCheck()

      }

      return

    }



    const payType = getPayTypeByEnv(env) ?? 1

    let openid = payUserId.value || getCachedPayUserId(env)



    if (!openid) {

      openid = await getOpenIdByEnv(env, { host: host.value, years: years.value })

      if (openid) payUserId.value = openid

    }



    if (!openid) {

      ElMessage.error('请先完成授权登录')

      return

    }



    const params = { host: host.value, years: years.value, payType, openid }



    const res = await CreateOrder(params)

    payInfo.value = res.data.response



    if (env === 'wechat' && payInfo.value.data?.appId) {

      await invokeWechatPay(payInfo.value.data)

      AddOrderCheck()

    } else if (env === 'alipay' && payInfo.value.data?.tradeNO) {

      await invokeAlipayPay(payInfo.value.data.tradeNO)

      AddOrderCheck()

    }

  } catch (err) {

    if (err?.message && !err.message.includes('redirect')) {

      ElMessage.error(err.message || '支付失败，请重试')

    }

  } finally {

    paying.value = false

  }

}



const GetUserInfo = async () => {

  const res = await GetNsCustomerInfo({ host: host.value })

  showHtml.value = res.data.response.showHtml

  isExpire.value = res.data.response.isExpire

  isCanShowInput.value = res.data.response.isCanShowInput

  endTime.value = res.data.response.endTime

  host.value = res.data.response.host

  isStop.value = res.data.response.isStop



  if (isStop.value) {

    // refreshCode()

  }

}



const formData = ref({})

const imgStr = ref('')



const refreshCode = () => {

  getCode().then(res => {

    formData.value.code = ''

    formData.value.key = res.data.response.key

    imgStr.value = 'data:image/png;base64,' + res.data.response.code

  })

}



const loadingNs = ref(false)

const onSubmit = () => {

  formData.value.host = host.value

  StartNS(formData.value).then(res => {

    ElMessage.success("启动成功");



    const loading = ElLoading.service({

      lock: true,

      text: '启动成功,页面即将刷新中...',

      background: 'rgba(0, 0, 0, 0.7)',

    })

    loadingNs.value = true

    setTimeout(() => {

      loading.close()

      if (isTarget.value) {

        ToMyNs()

      } else {

        RefreshMyNs()

      }



    }, 5000)





  })

    .catch(() => {

      formData.value.code = ''

      // refreshCode()

    })

}



const ToMyNs = () => {

  window.open("https://" + host.value)

}

const RefreshMyNs = () => {

  location.reload(true);

}





</script>



<template>

  <div style="border-radius: 5px;margin-top: 35px;margin-left: 10px;margin-right: 10px;border: 1px solid red;">





    <div style="padding: 20px;">

      <!-- 续费订单 -->

      <div v-if="host">

        <div>NS用户: {{ host }}</div>

        <div>到期时间: {{ endTime }}</div>



        <el-popover placement="bottom-start" :width="400" trigger="click">

          <template #reference>

            <el-button type="primary">点我续费</el-button>

          </template>



          <div style="margin-top: 10px;">

            我要续费<el-input-number v-model="years" style="margin-left: 10px;width: 150px;" :min="1" :max="10"> <template

                #append>年</template></el-input-number> 年

          </div>



          <el-button
            type="primary"
            style="margin-top: 10px;"
            :loading="paying || authLoading"
            :disabled="!isOtherBrowser && !authReady"
            @click="toPay"
          >
            {{ authLoading ? '授权中...' : '去支付' }}
          </el-button>



          <div v-if="payUserId && !isOtherBrowser" style="margin-top: 8px;color: #67c23a;font-size: 13px;word-break: break-all;">
            当前用户标识（{{ payEnv === 'alipay' ? 'userid' : 'openid' }}）：{{ payUserId }}
          </div>



          <div v-if="isOtherBrowser" style="margin-top: 10px;color: #909399;font-size: 13px;">

            当前为普通浏览器，请使用微信或支付宝扫码支付

          </div>



          <div v-if="isOtherBrowser && qrCodeDataUrl" style="margin-top: 10px;text-align: center;">

            <div style="margin-bottom: 8px;color: #303133;font-size: 14px;">请使用微信或支付宝扫码支付</div>

            <el-image :src="qrCodeDataUrl" style="width: 220px;height: 220px;" />

          </div>



        </el-popover>



      </div>







      <!-- 启动ns -->

      <div v-if="loadingNs">

        NS启动中,请稍等......

      </div>

      <div v-if="!loadingNs && !isExpire && isCanShowInput && isStop">

        <div>您的NS处于闲置状态,回复下方信息可以手动重启NS</div>

        <el-form :model="formData" label-width="auto">

          <!-- <el-form-item label="输入右边验证码">

            <el-input v-model="formData.code" clearable style="width: 100%;" />

            <el-image @click="refreshCode" style="height: 35px;cursor:pointer;" :src="imgStr">

              <template #error>

                <div class="image-slot">

                  验证码获取中...

                </div>

              </template>

            </el-image>

          </el-form-item> -->
          

          <el-form-item label="输入NS密码">

            <el-input v-model="formData.pass" clearable style="width: 100%;" type="password" show-password />

          </el-form-item>

          <el-form-item label="　">

            <el-button type="primary" @click="onSubmit">启动NS</el-button>

          </el-form-item>

        </el-form>

      </div>

      <!-- 过期提醒 -->

      <div v-if="showHtml && isExpire" style="color: red;">

        NS已过期,点击[续费按钮]进行续费或直接联系下方微信进行手动续费!

      </div>



      <div>

        <el-button style="margin-top: 10px;" type="primary" v-if="isTarget" @click="ToMyNs">进入我的NS</el-button>

        <el-button style="margin-top: 10px;" type="primary" v-else @click="RefreshMyNs">点我刷新NS页面</el-button>

      </div>

      <!-- 客户介绍 -->

      <div v-html="showHtml">

      </div>



    </div>

  </div>

</template>

<style lang="scss" scoped></style>


