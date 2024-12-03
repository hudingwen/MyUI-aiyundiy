<script setup>

import {
  GetNsCustomerInfo
  , getCode
  , StartNS
  , CreateOrder
  , CheckOrder
} from '@/api/customer.js'
import { useUserStore, useSettingStore } from '@/stores'
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue'

// 消息框
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

const payInfo = ref({})
onMounted(() => {

  const route = useRoute();
  if (route.query && route.query.host) {
    host.value = route.query.host
    isTarget.value = true
  }
  //测试
  // if (!host.value)
  //   host.value = 'test.aiyundiy.com'

  GetUserInfo()

})

// 支付宝续费
const myWatch = ref()
const toAlipay = () => {
  CreateOrder({ host: host.value, payType: 2, years: years.value }).then(res => {
    payInfo.value = res.data.response
    AddOrderCheck()
  })

}
// 微信续费
const toWechatPay = () => {
  CreateOrder({ host: host.value, payType: 1, years: years.value }).then(res => {
    payInfo.value = res.data.response
    AddOrderCheck()
  })

}

// 轮询订单
const AddOrderCheck = () => {
  myWatch.value = setInterval(() => {
    CheckOrder({ id: payInfo.value.data.out_order_no }).then(res => {
      clearInterval(myWatch.value)

      ElMessage.success("续费成功");

      const loading = ElLoading.service({
        lock: true,
        text: '续费成功,页面即将刷新中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
      loadingNs.value = true
      setTimeout(() => {
        loading.close()
        if (isTarget.value) {
          //跳转
          ToMyNs()
        } else {
          //刷新
          RefreshMyNs()
        }

      }, 5000) 

    })
  }, 3000);
}
// 获取我的信息
const GetUserInfo = () => {
  GetNsCustomerInfo({ host: host.value }).then(res => {
    showHtml.value = res.data.response.showHtml
    isExpire.value = res.data.response.isExpire
    isCanShowInput.value = res.data.response.isCanShowInput
    endTime.value = res.data.response.endTime
    host.value = res.data.response.host
    isStop.value = res.data.response.isStop

    if (isStop.value) {
      refreshCode()
    }
  })
}

const formData = ref({})
const imgStr = ref('')
// 刷新验证码
const refreshCode = () => {
  getCode().then(res => {
    formData.value.code = ''
    formData.value.key = res.data.response.key
    imgStr.value = 'data:image/png;base64,' + res.data.response.code
  })
}
// 启动NS
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
        //跳转
        ToMyNs()
      } else {
        //刷新
        RefreshMyNs()
      }

    }, 5000)


  })
    .catch(() => {
      formData.value.code = ''
      refreshCode()
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

          <el-button type="primary" @click="toAlipay">支付宝</el-button>

          <el-button type="primary" @click="toWechatPay">微信</el-button>

          <div style="margin-top: 10px;">
            我要续费<el-input-number v-model="years" style="margin-left: 10px;width: 150px;" :min="1" :max="10"> <template
                #append>年</template></el-input-number> 年
          </div>
          <div v-if="payInfo.data && payInfo.data.code_url" style="margin-top: 10px;">

            <el-link type="primary" :href="payInfo.data.code_url" target="_blank">点击去支付</el-link>

            <div style="margin-top: 10px;">
              <div style="margin-top: 10px;">扫码支付</div>
              <el-image :src="payInfo.data.qrcode" />
            </div>
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
          <el-form-item label="输入右边验证码">
            <el-input v-model="formData.code" clearable style="width: 100%;" />
            <el-image @click="refreshCode" style="height: 35px;cursor:pointer;" :src="imgStr">
              <template #error>
                <div class="image-slot">
                  验证码获取中...
                </div>
              </template>
            </el-image>
          </el-form-item>
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
