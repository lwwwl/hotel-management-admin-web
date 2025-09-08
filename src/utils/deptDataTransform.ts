import type { DeptListItemBO, DeptDetailResponse, DeptForm } from '../api/types';

/**
 * 将部门列表项转换为前端使用的部门对象
 */
export const transformDeptItemToDept = (item: DeptListItemBO) => {
  return {
    id: item.deptId,
    name: item.deptName,
    manager: item.leaderName,
    memberCount: item.memberCount,
    leaderId: item.leaderId
  };
};

/**
 * 将部门详情转换为前端使用的部门对象
 */
export const transformDeptDetailToDept = (detail: DeptDetailResponse) => {
  return {
    id: detail.deptId,
    name: detail.deptName,
    manager: detail.leaderName,
    memberCount: detail.memberList.length,
    leaderId: detail.leaderId
  };
};

/**
 * 将部门表单转换为创建请求
 */
export const transformDeptFormToCreateRequest = (form: DeptForm) => {
  return {
    deptName: form.deptName,
    leaderId: form.leaderId
  };
};

/**
 * 将部门表单转换为更新请求
 */
export const transformDeptFormToUpdateRequest = (deptId: number, form: DeptForm) => {
  return {
    deptId,
    deptName: form.deptName,
    leaderId: form.leaderId
  };
};
