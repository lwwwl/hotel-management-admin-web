// 基础API响应类型
export interface ApiResponse<T> {
  timestamp: number;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}



// 用户相关类型定义
export interface UserDetailRequest {
  userId: number;
}

export interface UserCreateRequest {
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

export interface UserUpdateRequest {
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

export interface UserDeleteRequest {
  userId: number;
}

export interface UserLockRequest {
  userId: number;
}

export interface UserSearchRequest {
  keyword?: string;
  deptId?: number;
  active?: number;
  lastCreateTime?: number | null; // 时间戳格式，第一页传null
  lastUserId?: number | null; // 第一页传null
  size?: number;
}

// 用户信息响应类型
export interface UserDepartmentInfo {
  deptId: number;
  deptName: string;
}

export interface UserRoleInfo {
  roleId: number;
  roleName: string;
}

export interface UserDetailResponse {
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

export interface UserItem {
  userId: number;
  username: string;
  displayName: string;
  employeeNumber?: string;
  active: number;
  department?: UserDepartmentInfo;
}

export interface UserListResponse {
  users: UserItem[];
  hasMore: boolean;
  lastCreateTime?: number; // 时间戳格式
  lastUserId?: number;
  size: number;
}

// 角色相关类型
export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

// 部门相关类型
export interface Department {
  id: number;
  name: string;
  manager: string;
  memberCount: number;
}

// 前端组件使用的用户类型（兼容现有代码）
export interface User {
  id: number;
  name: string;
  username: string;
  employeeId: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface UserForm {
  name: string;
  username: string;
  employeeId: string;
  role: string;
  department: string;
}
