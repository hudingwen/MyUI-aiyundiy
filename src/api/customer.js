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

