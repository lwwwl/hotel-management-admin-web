import api from './axiosConfig';
import type { ApiResponse, MenuListResponse } from './types';

export const menuApi = {
  async listMenus(): Promise<ApiResponse<MenuListResponse>> {
    const res = await api.post<ApiResponse<MenuListResponse>>('/menu/list', {});
    return res.data;
  },
};


