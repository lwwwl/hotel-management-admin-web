import api from './axiosConfig';
import type { ApiResponse, QuickMenuCreateRequest, QuickMenuDeleteRequest, QuickMenuItemBO, QuickMenuOrderItem, QuickMenuUpdateRequest } from './types';

export const quickMenuApi = {
  list: async (): Promise<ApiResponse<QuickMenuItemBO[]>> => {
    const res = await api.post('/quickMenu/list', {});
    return res.data;
  },
  create: async (request: QuickMenuCreateRequest): Promise<ApiResponse<number>> => {
    const res = await api.post('/quickMenu/create', request);
    return res.data;
  },
  update: async (request: QuickMenuUpdateRequest): Promise<ApiResponse<boolean>> => {
    const res = await api.post('/quickMenu/update', request);
    return res.data;
  },
  delete: async (request: QuickMenuDeleteRequest): Promise<ApiResponse<boolean>> => {
    const res = await api.post('/quickMenu/delete', request);
    return res.data;
  },
  // 若后端未实现detail，调用会失败，页面会自动回退到列表数据
  detail: async (id: number): Promise<ApiResponse<QuickMenuItemBO>> => {
    const res = await api.post('/quickMenu/detail', { id });
    return res.data;
  },
  saveOrder: async (orders: QuickMenuOrderItem[]): Promise<ApiResponse<boolean>> => {
    const res = await api.post('/quickMenu/save-order', { orders });
    return res.data;
  }
};


