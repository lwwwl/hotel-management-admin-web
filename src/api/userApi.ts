import api from './axiosConfig';

// 内联类型定义，避免模块导入问题
interface ApiResponse<T> {
  timestamp: number;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}

interface UserDetailRequest {
  userId: number;
}

interface UserCreateRequest {
  username: string;
  password: string;
  displayName: string;
  employeeNumber?: string;
  email?: string;
  phone?: string;
  roleIds?: number[];
  deptId?: number;
  superAdmin?: boolean;
}

interface UserUpdateRequest {
  userId: number;
  username?: string;
  password?: string;
  displayName?: string;
  employeeNumber?: string;
  email?: string;
  phone?: string;
  roleIds?: number[];
  deptId?: number;
  superAdmin?: boolean;
}

interface UserDeleteRequest {
  userId: number;
}

interface UserLockRequest {
  userId: number;
}

interface UserSearchRequest {
  keyword?: string;
  deptId?: number;
  active?: number;
  lastCreateTime?: number | null;
  lastUserId?: number | null;
  size?: number;
}

interface UserDepartmentInfo {
  deptId: number;
  deptName: string;
}

interface UserRoleInfo {
  roleId: number;
  roleName: string;
}

interface UserDetailResponse {
  userId: number;
  username: string;
  displayName: string;
  employeeNumber?: string;
  email?: string;
  phone?: string;
  superAdmin: boolean;
  active: number;
  department?: UserDepartmentInfo;
  roles?: UserRoleInfo[];
}

interface UserListResponse {
  users: UserItem[];
  hasMore: boolean;
  lastCreateTime?: number;
  lastUserId?: number;
  size: number;
}

interface UserItem {
  userId: number;
  username: string;
  displayName: string;
  employeeNumber?: string;
  active: number;
  department?: UserDepartmentInfo;
}

export const userApi = {
  /**
   * 获取用户详情
   * @param request 用户详情请求
   */
  getUserDetail: async (request: UserDetailRequest) => {
    const response = await api.post<ApiResponse<UserDetailResponse>>('/user/detail', request);
    return response.data;
  },

  /**
   * 创建新用户
   * @param request 用户创建请求
   */
  createUser: async (request: UserCreateRequest) => {
    const response = await api.post<ApiResponse<number>>('/user/create', request);
    return response.data;
  },

  /**
   * 更新用户信息
   * @param request 用户更新请求
   */
  updateUser: async (request: UserUpdateRequest) => {
    const response = await api.post<ApiResponse<boolean>>('/user/update', request);
    return response.data;
  },

  /**
   * 删除用户
   * @param request 用户删除请求
   */
  deleteUser: async (request: UserDeleteRequest) => {
    const response = await api.post<ApiResponse<boolean>>('/user/delete', request);
    return response.data;
  },

  /**
   * 锁定/解锁用户
   * @param request 用户锁定请求
   */
  toggleUserLock: async (request: UserLockRequest) => {
    const response = await api.post<ApiResponse<string>>('/user/lock', request);
    return response.data;
  },

  /**
   * 搜索用户
   * @param request 用户搜索请求
   */
  searchUsers: async (request: UserSearchRequest) => {
    const response = await api.post<ApiResponse<UserListResponse>>('/user/search', request);
    return response.data;
  }
};
