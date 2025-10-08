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
  createTime: number;
  updateTime: number;
  department?: UserDepartmentInfo;
  userRoles?: UserRoleInfo[];
}

export interface UserListResponse {
  users: UserItem[];
  hasMore: boolean;
  lastCreateTime?: number; // 时间戳格式
  lastUserId?: number;
  size: number;
}

// 角色管理相关类型定义
export interface RoleCreateRequest {
  name: string;
  description?: string;
  menuIdList?: number[];
  userIdList?: number[];
}

export interface RoleUpdateRequest {
  roleId: number;
  name?: string;
  description?: string;
  menuIdList?: number[];
  userIdList?: number[];
}

export interface RoleDeleteRequest {
  roleId: number;
}

export interface RoleListRequest {
  keyword?: string;
}

export interface RoleUpdateUserRequest {
  roleId: number;
  userIdList: number[];
}

export interface RoleUpdateMenuRequest {
  roleId: number;
  menuIdList: number[];
}

// 角色信息响应类型
export interface RoleInfo {
  roleId: number;
  name: string;
  description?: string;
  createTime: number;
  updateTime: number;
}

export interface RoleListResponse {
  roles: RoleInfo[];
}

// 角色详情相关类型
export interface RoleDetailRequest {
  roleId: number;
}

export interface MenuDetailInfo {
  menuId: number;
  menuName: string;
  icon: string;
  sortOrder: number;
}

export interface DepartmentInfo {
  deptId: number;
  deptName: string;
}

export interface UserDetailInfo {
  userId: number;
  username: string;
  displayName: string;
  employeeNumber: string;
  active: number;
  departments: DepartmentInfo[];
}

export interface RoleBasicInfo {
  roleId: number;
  name: string;
  description: string;
  memberCount: number;
  createTime: number;
  updateTime: number;
}

export interface RoleDetailResponse {
  roleInfo: RoleBasicInfo;
  menus: MenuDetailInfo[];
  users: UserDetailInfo[];
}

// 角色相关类型（兼容现有代码）
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

// 部门管理相关类型定义
export interface DeptSelectListRequest {
  // 预留扩展，目前无参数
}

export interface DeptListRequest {
  // 预留扩展，目前无参数
}

export interface DeptDetailRequest {
  deptId: number;
}

export interface DeptCreateRequest {
  deptName: string;
  leaderId: number;
}

export interface DeptUpdateRequest {
  deptId: number;
  deptName?: string;
  leaderId?: number;
}

export interface DeptDeleteRequest {
  deptId: number;
}

export interface DeptAddUserRequest {
  deptId: number;
  userIdList: number[];
}

export interface DeptRemoveUserRequest {
  deptId: number;
  userIdList: number[];
}

// 部门响应类型
export interface DeptInfo {
  deptId: number;
  deptName: string;
}

export interface DeptListItemBO {
  deptId: number;
  deptName: string;
  leaderId: number;
  leaderName: string;
  memberCount: number;
}

export interface DeptUserInfo {
  userId: number;
  name: string;
  username: string;
}

export interface DeptSelectListResponse {
  deptList: DeptInfo[];
}

export interface DeptListResponse {
  deptList: DeptListItemBO[];
}

export interface DeptDetailResponse {
  deptId: number;
  deptName: string;
  leaderId: number;
  leaderName: string;
  memberList: DeptUserInfo[];
}

// 部门表单类型
export interface DeptForm {
  deptName: string;
  leaderId: number;
}

// 前端组件使用的用户类型（兼容现有代码）
export interface User {
  id: number;
  username: string;
  name: string;
  employeeId: string;
  department: string;
  departmentId: number | null; // Add departmentId
  userRoles: UserRoleInfo[] | null; // Replaces 'roles: string'
  role: string; // Keep for form compatibility
  status: 'active' | 'inactive';
  createTime: string;
}

export interface UserForm {
  name: string;
  username: string;
  employeeId: string;
  role: string;
  department: string;
}

// 菜单列表接口响应类型
export interface MenuListItem {
  menuId: number;
  menuName: string;
  icon: string;
  sortOrder: number;
  parentId: number;
  path: string;
  type: number;
  visible: boolean;
}

export interface MenuListResponse {
  menus: MenuListItem[];
}

// 房间管理相关类型
export interface RoomCreateRequest {
  name: string;
  active?: number; // 0/1
}

export interface RoomUpdateRequest {
  id: number;
  name?: string;
  active?: number; // 0/1
}

export interface RoomDeleteRequest {
  id: number;
}

export interface RoomDetailRequest {
  id: number;
}

export interface RoomListRequest {
  active?: number;
  keyword?: string;
}

export interface HotelRoom {
  id: number;
  name: string;
  active: number;
  createTime?: string;
  updateTime?: string;
}

// 快捷菜单相关类型
export interface QuickMenuContentLang {
  name: string; // 菜单名称
  message: string; // 点击后发送的消息
}

export interface QuickMenuContent {
  name: { zh: string; en: string; ja: string };
  message: { zh: string; en: string; ja: string };
  // 预留扩展字段，如下方可按需增加
  // extra?: Record<string, unknown>;
}

export interface QuickMenuItemBO {
  id: number;
  icon: string;
  content: string; // 后端以JSON字符串返回
  sortOrder?: number;
  createTime?: string;
  updateTime?: string;
}

export interface QuickMenuOrderItem {
  id: number;
  sortOrder: number;
}

export interface QuickMenuCreateRequest {
  icon: string;
  content: string; // JSON.stringify(QuickMenuContent)
}

export interface QuickMenuUpdateRequest {
  id: number;
  icon?: string;
  content?: string;
}

export interface QuickMenuDeleteRequest {
  id: number;
}

export interface QuickMenuListResponse {
  quickMenus: QuickMenuItemBO[]; // 若后端直接返回List<QuickMenu>，则用ApiResponse<QuickMenuItemBO[]>
}
