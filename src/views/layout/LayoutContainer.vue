<script setup>
import { ElMessageBox } from 'element-plus'

import { useUserStore, useSettingStore } from '@/stores'
import { onMounted, ref } from 'vue'
import router from '@/router'

const userStore = useUserStore()
const settingStore = useSettingStore()


const curYear = ref('2024')

onMounted(() => {
 
  curYear.value = new Date().getFullYear(); 
})


</script>

<template>
  <div style="border-radius: 5px;margin-top: 35px;margin-left: 10px;margin-right: 10px;border: 1px solid red;">


    <el-row style="padding: 20px;">

      <el-col style="color: red;">温馨提示:</el-col>

      <el-col>如果您打开ns页面跳转到本页面,请无需担心</el-col>
      <el-col>如果您之前绑定过微信公众号回复"启动"既可</el-col>
      <el-col>如果没有绑定,您可以联系小羊帮您重新启动ns如下图所示</el-col>
      <el-col>
        <img style="width: 100%;"
          src="https://www.aiyundiy.com/wp-content/uploads/2024/03/1709890471-UI2DHEWEOM7ZQWQH4CO.png">
      </el-col>
      <el-col>
        <el-row>
          <el-col :span="12">
            <div style="font-weight: 900;">手机硅基延期远程</div>
            <div>硅基延期远程</div>
            <div>雅培延期远程</div>
            <div>Ns远程Pro服务</div>
          </el-col>
          <el-col :span="12">
            <div style="font-weight: 900;">承接血糖服务</div>
            <div>苹果手机loop</div>
            <div>安卓手机aps(免费)</div>
            <div>苹果硅基延期远程</div>
          </el-col>
        </el-row>
      </el-col>
      <el-col>
        <div style="font-weight: 900;">各类定制,优惠价格</div>
        <div>硅基探头</div>
        <div>雅培探头</div>
        <div>年卡套餐</div>
        <div>硅基定制手表等</div>
      </el-col>
      <el-col>
        <div style="font-weight: 900;">扫码关注小羊微信&微信公众号</div>
        <div><img style="width: 100%;"
            src="https://cdn.aiwanyun.cn/2024/20241109/20241109_263193fccf4b455da4d3dd34f568863b.png">
        </div>
        <div><img style="width: 100%;"
            src="https://cdn.aiwanyun.cn/2024/20241109/20241109_9668d65602604f82afe4e545a7a7e934.jpg">
        </div>
      </el-col>
      <el-col>
        <div style="text-align: center;">
          © 2023-{{ curYear }} 爱云diy <a href="https://beian.miit.gov.cn" target="_blank"
            rel="nofollow">蜀ICP备15023992号-5</a>
        </div>
      </el-col>
    </el-row>
</div></template>
<style lang="scss" scoped></style>
