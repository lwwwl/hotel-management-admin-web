import api from './axiosConfig';
import type { 
  ApiResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleDeleteRequest,
  RoleListRequest,
  RoleDetailRequest,
  RoleListResponse,
  RoleDetailResponse,
  RoleUpdateUserRequest,
  RoleUpdateMenuRequest
} from './types';

/**
 * 角色管理 API
 */
export const roleApi = {
  /**
   * 创建角色
   */
  createRole: async (request: RoleCreateRequest): Promise<ApiResponse<number>> => {
    const response = await api.post('/role/create', request);
    return response.data;
  },

  /**
   * 更新角色
   */
  updateRole: async (request: RoleUpdateRequest): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/role/update', request);
    return response.data;
  },

  /**
   * 删除角色
   */
  deleteRole: async (request: RoleDeleteRequest): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/role/delete', request);
    return response.data;
  },

  /**
   * 获取角色列表
   */
  getRoleList: async (request: RoleListRequest): Promise<ApiResponse<RoleListResponse>> => {
    const response = await api.post('/role/list', request);
    return response.data;
  },

  /**
   * 获取角色详情
   */
  getRoleDetail: async (request: RoleDetailRequest): Promise<ApiResponse<RoleDetailResponse>> => {
    const response = await api.post('/role/detail', request);
    return response.data;
  },

  /**
   * 更新角色用户
   */
  updateRoleUser: async (request: RoleUpdateUserRequest): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/role/updateUser', request);
    return response.data;
  },

  /**
   * 更新角色菜单
   */
  updateRoleMenu: async (request: RoleUpdateMenuRequest): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/role/updateMenu', request);
    return response.data;
  }
};
