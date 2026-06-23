import request from '@/utils/request.js'

// 获取客户信息
export const GetNsCustomerInfo = params => {
  return request.get('/api/Nightscout/GetNsCustomerInfo', { params: params });
};
// 获取验证码
export const getCode = params => {
  return request.get('/api/Login/getCode', { params: params });
};
// 启动NS
export const StartNS = params => {
  return request.get('/api/Nightscout/StartNS', { params: params });
};
// 创建续费订单
export const CreateOrder = params => {
  return request.get('/api/Pay/CreateOrder', { params: params });
};
// 创建主扫续费订单（非微信/支付宝浏览器扫码支付）
export const CreateActiveScanOrder = params => {
  return request.get('/api/Pay/CreateActiveScanOrder', { params: params });
};
// 订单状态检查
export const CheckOrder = params => {
  return request.get('/api/Pay/CheckOrder', { params: params, ext: { loading: false } });
};
// 授权码换取 openid/userid
export const GetOpenId = params => {
  return request.get('/api/Pay/GetOpenId', { params: params });
};
// 获取支付配置（微信/支付宝 appId）
export const GetPayConfig = params => {
  return request.get('/api/Pay/GetPayConfig', { params: params, ext: { loading: false } });
};
