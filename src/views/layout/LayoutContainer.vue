<script setup>

import {
  GetNsCustomerInfo
  , getCode
  , StartNS
} from '@/api/customer.js'
import { useUserStore, useSettingStore } from '@/stores'
import { onMounted, ref } from 'vue'

// 消息框
import { ElMessage } from 'element-plus'
import { ElLoading } from 'element-plus'

const curYear = ref('2024')
const showHtml = ref('')
const isExpire = ref(true)
const isCanShowInput = ref(false)

onMounted(() => {

  curYear.value = new Date().getFullYear();

  GetUserInfo()
  refreshCode()
})

const GetUserInfo = () => {

  GetNsCustomerInfo({ host: '' }).then(res => {
    showHtml.value = res.data.response.showHtml
    isExpire.value = res.data.response.isExpire
    isCanShowInput.value = res.data.response.isCanShowInput
  })
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
  formData.value.host = ''
  StartNS(formData.value).then(res => {
    GetNsCustomerInfo()
    ElMessage.success("启动成功");

    const loading = ElLoading.service({
      lock: true,
      text: '启动成功,页面刷新中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    loadingNs.value = true
    setTimeout(() => {
      loading.close()
      location.reload(true);
    }, 5000)


  })
    .catch(() => {
      formData.value.code = ''
      refreshCode()
    })
}


</script>

<template>
  <div style="border-radius: 5px;margin-top: 35px;margin-left: 10px;margin-right: 10px;border: 1px solid red;">


    <div style="padding: 20px;">


      <div v-if="loadingNs">
        NS启动中,请稍等......
      </div>
      <div v-if="!loadingNs && !isExpire && isCanShowInput">
        <div>你得NS处于闲置状态,回复下方信息可以手动重启NS</div>
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
      <div v-if="showHtml && isExpire" style="color: red;">
        NS已过期,请联系下方微信进行续费!
      </div>
      <div v-html="showHtml">

      </div>



      <div v-if="false">
        <div style="color: red;">温馨提示:</div>

        <div>如果您打开ns页面跳转到本页面,请无需担心</div>
        <div>如果您之前绑定过微信公众号回复"启动"既可</div>
        <div>如果没有绑定,您可以联系小羊帮您重新启动ns如下图所示</div>
        <div>
          <img style="width: 100%;"
            src="https://cdn.aiwanyun.cn/2024/20241109/20241109_263193fccf4b455da4d3dd34f568863b.png">
        </div>
        <div>
          <div>
            <div :span="12">
              <div style="font-weight: 900;">手机硅基延期远程</div>
              <div>硅基延期远程</div>
              <div>雅培延期远程</div>
              <div>Ns远程Pro服务</div>
            </div>
            <div :span="12">
              <div style="font-weight: 900;">承接血糖服务</div>
              <div>苹果手机loop</div>
              <div>安卓手机aps(免费)</div>
              <div>苹果硅基延期远程</div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-weight: 900;">各类定制,优惠价格</div>
          <div>硅基探头</div>
          <div>雅培探头</div>
          <div>年卡套餐</div>
          <div>硅基定制手表等</div>
        </div>
        <div>
          <div style="font-weight: 900;">扫码关注小羊微信&微信公众号</div>
          <div><img style="width: 100%;"
              src="https://cdn.aiwanyun.cn/2024/20241109/20241109_9668d65602604f82afe4e545a7a7e934.jpg">
          </div>
          <div><img style="width: 100%;"
              src="https://cdn.aiwanyun.cn/2024/20241109/20241109_2a348997385c4cc2a6c30d0948316f26.jpg">
          </div>
        </div>
        <div>
          <div style="text-align: center;">
            © 2023-{{ curYear }} 爱云diy <a href="https://beian.miit.gov.cn" target="_blank"
              rel="nofollow">蜀ICP备15023992号-5</a>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
<style lang="scss" scoped></style>
