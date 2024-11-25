import request from '@/utils/request.js'

// 获取客户信息
export const GetNsCustomerInfo = params => {
    return request.get('/api/Nightscout/GetNsCustomerInfo', { params: params });
};