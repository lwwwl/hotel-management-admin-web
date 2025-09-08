import api from './axiosConfig';

// 内联类型定义，避免模块导入问题
interface ApiResponse<T> {
  timestamp: number;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}

interface DeptSelectListRequest {
  // 预留扩展，目前无参数
}

interface DeptListRequest {
  // 预留扩展，目前无参数
}

interface DeptDetailRequest {
  deptId: number;
}

interface DeptCreateRequest {
  deptName: string;
  leaderId: number;
}

interface DeptUpdateRequest {
  deptId: number;
  deptName?: string;
  leaderId?: number;
}

interface DeptDeleteRequest {
  deptId: number;
}

interface DeptAddUserRequest {
  deptId: number;
  userIdList: number[];
}

interface DeptRemoveUserRequest {
  deptId: number;
  userIdList: number[];
}

interface DeptInfo {
  deptId: number;
  deptName: string;
}

interface DeptListItemBO {
  deptId: number;
  deptName: string;
  leaderId: number;
  leaderName: string;
  memberCount: number;
}

interface DeptUserInfo {
  userId: number;
  name: string;
  username: string;
}

interface DeptSelectListResponse {
  deptList: DeptInfo[];
}

interface DeptListResponse {
  deptList: DeptListItemBO[];
}

interface DeptDetailResponse {
  deptId: number;
  deptName: string;
  leaderId: number;
  leaderName: string;
  memberList: DeptUserInfo[];
}

export const deptApi = {
  /**
   * 获取部门选择列表
   * @param request 部门选择列表请求
   */
  getDeptSelectList: async (request: DeptSelectListRequest) => {
    const response = await api.post<ApiResponse<DeptSelectListResponse>>('/dept/select-list', request);
    return response.data;
  },

  /**
   * 获取部门列表
   * @param request 部门列表请求
   */
  getDeptList: async (request: DeptListRequest) => {
    const response = await api.post<ApiResponse<DeptListResponse>>('/dept/list', request);
    return response.data;
  },

  /**
   * 获取部门详情
   * @param request 部门详情请求
   */
  getDeptDetail: async (request: DeptDetailRequest) => {
    const response = await api.post<ApiResponse<DeptDetailResponse>>('/dept/detail', request);
    return response.data;
  },

  /**
   * 创建部门
   * @param request 创建部门请求
   */
  createDept: async (request: DeptCreateRequest) => {
    const response = await api.post<ApiResponse<string>>('/dept/create', request);
    return response.data;
  },

  /**
   * 更新部门
   * @param request 更新部门请求
   */
  updateDept: async (request: DeptUpdateRequest) => {
    const response = await api.post<ApiResponse<string>>('/dept/update', request);
    return response.data;
  },

  /**
   * 删除部门
   * @param request 删除部门请求
   */
  deleteDept: async (request: DeptDeleteRequest) => {
    const response = await api.post<ApiResponse<string>>('/dept/delete', request);
    return response.data;
  },

  /**
   * 添加部门成员
   * @param request 添加部门成员请求
   */
  addDeptUser: async (request: DeptAddUserRequest) => {
    const response = await api.post<ApiResponse<string>>('/dept/add-user', request);
    return response.data;
  },

  /**
   * 移除部门成员
   * @param request 移除部门成员请求
   */
  removeDeptUser: async (request: DeptRemoveUserRequest) => {
    const response = await api.post<ApiResponse<string>>('/dept/remove-user', request);
    return response.data;
  }
};
