import type { UserItem, UserDetailResponse, User } from '../api/types';

// 定义用户表单类型
interface UserFormData {
  name: string;
  username: string;
  employeeId: string;
  role: string;
  department: string;
}

/**
 * 将API用户项转换为前端组件使用的用户格式
 * 直接使用后端字段，避免字段转换
 */
export const transformUserItemToUser = (userItem: UserItem): User => {
  return {
    id: userItem.userId,
    name: userItem.displayName,
    username: userItem.username,
    employeeId: userItem.employeeNumber || '',
    role: 'staff', // 默认角色，实际应该从roles字段获取
    department: userItem.department?.deptName || '',
    status: userItem.active === 1 ? 'active' : 'inactive',
    lastLogin: new Date().toLocaleString('zh-CN') // 模拟最后登录时间
  };
};

/**
 * 将API用户详情转换为前端组件使用的用户格式
 */
export const transformUserDetailToUser = (userDetail: UserDetailResponse) => {
  return {
    id: userDetail.userId,
    name: userDetail.displayName,
    username: userDetail.username,
    employeeId: userDetail.employeeNumber || '',
    role: userDetail.roles && userDetail.roles.length > 0 ? userDetail.roles[0].roleName : 'staff',
    department: userDetail.department?.deptName || '',
    status: userDetail.active === 1 ? 'active' : 'inactive',
    lastLogin: new Date().toLocaleString('zh-CN') // 模拟最后登录时间
  };
};

/**
 * 将前端用户表单转换为API创建用户请求格式
 */
export const transformUserFormToCreateRequest = (userForm: UserFormData, password: string = 'defaultPassword123') => {
  return {
    username: userForm.username,
    password: password,
    displayName: userForm.name,
    employeeNumber: userForm.employeeId,
    email: `${userForm.username}@hotel.com`, // 模拟邮箱
    phone: '13800138000', // 模拟手机号
    roleIds: [1], // 默认角色ID
    deptId: parseInt(userForm.department) || 1,
    superAdmin: false
  };
};

/**
 * 将前端用户表单转换为API更新用户请求格式
 */
export const transformUserFormToUpdateRequest = (userId: number, userForm: UserFormData) => {
  return {
    userId: userId,
    username: userForm.username,
    displayName: userForm.name,
    employeeNumber: userForm.employeeId,
    email: `${userForm.username}@hotel.com`, // 模拟邮箱
    phone: '13800138000', // 模拟手机号
    roleIds: [1], // 默认角色ID
    deptId: parseInt(userForm.department) || 1,
    superAdmin: false
  };
};
