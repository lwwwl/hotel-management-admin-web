import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import MenuSelectorModal from './MenuSelectorModal';
import { roleApi } from '../api/roleApi';
import { useToast } from '../components/ToastProvider';
import UserSelectorModal from './UserSelectorModal';
import type { RoleDetailResponse } from '../api/types';

interface RoleDetailProps {
  roleId: number;
  onBack: () => void;
  onUpdate?: () => void;
}

const RoleDetail: React.FC<RoleDetailProps> = ({ roleId, onBack, onUpdate }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [roleDetail, setRoleDetail] = useState<RoleDetailResponse | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showMenuSelector, setShowMenuSelector] = useState(false);
  
  // 使用 useMemo 来稳定 initialSelectedUserIds 的引用
  const initialSelectedUserIds = useMemo(() => {
    if (!roleDetail?.users) return [];
    return roleDetail.users.map(user => user.userId);
  }, [roleDetail?.users]);

  useEffect(() => {
    fetchRoleDetail();
  }, [roleId]);

  const fetchRoleDetail = async () => {
    try {
      setLoading(true);
      const response = await roleApi.getRoleDetail({ roleId });
      if (response.statusCode === 200) {
        setRoleDetail(response.data);
      } else {
        showError(response.message || '获取角色详情失败');
      }
    } catch (error) {
      console.error('获取角色详情失败:', error);
      showError('获取角色详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getStatusIcon = (active: number) => {
    return active === 1 ? (
      <Icons.CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <Icons.XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const renderMenuIcon = (iconName?: string) => {
    if (!iconName) return <div className="w-8" />;
    const Cmp = (Icons as any)[iconName];
    return Cmp ? <Cmp className="w-5 h-5 text-blue-600" /> : <div className="w-8" />;
  };

  // 处理用户选择
  const handleUserSelection = async (selectedUsers: any[]) => {
    try {
      setUpdating(true);
      const userIdList = selectedUsers.map(user => user.id);
      
      const response = await roleApi.updateRoleUser({
        roleId,
        userIdList
      });

      if (response.statusCode === 200) {
        showSuccess('角色成员更新成功');
        // 重新加载角色详情
        await fetchRoleDetail();
        // 通知父组件刷新列表
        onUpdate?.();
      } else {
        showError('更新角色成员失败', response.message);
      }
    } catch (error) {
      console.error('更新角色成员失败:', error);
      showError('更新角色成员失败');
    } finally {
      setUpdating(false);
      setShowUserSelector(false);
    }
  };

  // 更新菜单选择
  const handleMenuUpdate = async (selectedMenus: { menuId: number }[]) => {
    try {
      setUpdating(true);
      const menuIdList = selectedMenus.map(m => m.menuId);
      const response = await roleApi.updateRoleMenu({ roleId, menuIdList });
      if (response.statusCode === 200) {
        showSuccess('菜单权限更新成功');
        await fetchRoleDetail();
        // 通知父组件刷新列表
        onUpdate?.();
      } else {
        showError(response.message || '更新菜单失败');
      }
    } catch (e) {
      console.error('更新菜单失败:', e);
      showError('更新菜单失败');
    } finally {
      setUpdating(false);
      setShowMenuSelector(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!roleDetail) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">角色详情加载失败</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部 - 压缩的角色基本信息 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icons.Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{roleDetail.roleInfo.name}</h1>
              <p className="text-sm text-gray-600">{roleDetail.roleInfo.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Icons.Users className="w-4 h-4" />
                <span>{roleDetail.roleInfo.memberCount} 名成员</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Icons.Calendar className="w-4 h-4" />
                <span>创建于 {formatDate(roleDetail.roleInfo.createTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 菜单权限和用户成员 - 左右横向布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)]">
        {/* 菜单权限 */}
        <div className="bg-white rounded-lg shadow-sm border flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Icons.Menu className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">菜单权限</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {roleDetail.menus.length} 个权限
              </span>
            </div>
            <button
              onClick={() => setShowMenuSelector(true)}
              disabled={updating}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 flex items-center space-x-1"
            >
              <Icons.Settings className="w-4 h-4" />
              <span>编辑菜单</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {roleDetail.menus.length > 0 ? (
              <div className="space-y-3">
                {roleDetail.menus
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((menu) => (
                    <div
                      key={menu.menuId}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {renderMenuIcon(menu.icon)}
                        </div>
                        <div className="flex-1 min-w-0 text-left pl-2">
                          <h3 className="font-medium text-gray-900 truncate text-left">{menu.menuName}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icons.Menu className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>该角色暂无菜单权限</p>
              </div>
            )}
          </div>
        </div>

        {/* 用户成员 */}
        <div className="bg-white rounded-lg shadow-sm border flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Icons.Users className="w-5 h-5 text紫-600" />
              <h2 className="text-lg font-semibold text-gray-900">用户成员</h2>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {roleDetail.users.length} 人
              </span>
            </div>
            <button
              onClick={() => setShowUserSelector(true)}
              disabled={updating}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 flex items-center space-x-1"
            >
              <Icons.Edit className="w-4 h-4" />
              <span>编辑用户</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roleDetail.users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用户信息
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        工号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        部门
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleDetail.users.map((user) => (
                      <tr key={user.userId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <Icons.User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {user.employeeNumber || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.departments.length > 0 ? (
                            <div className="space-y-1">
                              {user.departments.map((dept) => (
                                <div key={dept.deptId} className="flex items-center text-sm">
                                  <Icons.Building className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                                  <span className="text-gray-900 truncate">{dept.deptName}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">未分配部门</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(user.active)}
                            <span className="text-sm text-gray-900">
                              {user.active === 1 ? '启用' : '禁用'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icons.Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>该角色暂无用户成员</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 用户选择弹窗 */}
      <UserSelectorModal
        isOpen={showUserSelector}
        onClose={() => setShowUserSelector(false)}
        onConfirm={handleUserSelection}
        title="编辑角色成员"
        confirmText="更新成员"
        mode="role"
        currentRoleId={roleId}
        selectionMode="multiple"
        maxSelection={0}
        initialSelectedUserIds={initialSelectedUserIds}
      />

      {/* 菜单选择弹窗 */}
      <MenuSelectorModal
        isOpen={showMenuSelector}
        onClose={() => setShowMenuSelector(false)}
        onConfirm={handleMenuUpdate}
        initialSelectedIds={roleDetail?.menus?.map(m => m.menuId) || []}
      />
    </div>
  );
};

export default RoleDetail;
