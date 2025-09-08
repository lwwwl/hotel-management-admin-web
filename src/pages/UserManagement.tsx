import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle,
  Folder
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { transformUserItemToUser, transformUserFormToCreateRequest, transformUserFormToUpdateRequest } from '../utils/userDataTransform';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import type { User, Role, Department, UserForm } from '../api/types';

// Mock数据（保留作为备用）
const MOCK_ROLES = [
  { id: 'admin', name: '超级管理员', description: '拥有系统所有权限', userCount: 2, permissions: ['用户管理', '系统设置', '数据导出', '所有功能'] },
  { id: 'agent', name: '前台客服', description: '处理客人会话和工单', userCount: 5, permissions: ['会话管理', '工单创建', '查看报表'] },
  { id: 'staff', name: '部门员工', description: '处理分配的工单任务', userCount: 12, permissions: ['工单处理', '任务更新'] }
];

const MOCK_DEPARTMENTS = [
  { id: 1, name: '管理部', manager: '总经理', memberCount: 3 },
  { id: 2, name: '前台', manager: '张三', memberCount: 5 },
  { id: 3, name: '客房部', manager: '李四', memberCount: 8 },
  { id: 4, name: '餐饮部', manager: '王五', memberCount: 6 }
];

const UserManagement = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'departments'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([...MOCK_ROLES]);
  const [departments, setDepartments] = useState<Department[]>([...MOCK_DEPARTMENTS]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    username: '',
    employeeId: '',
    role: '',
    department: ''
  });
  
  // 新增状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [hasMore, setHasMore] = useState(false);
  const [lastCreateTime, setLastCreateTime] = useState<number | null>(null);
  const [lastUserId, setLastUserId] = useState<number | null>(null);
  const [pageSize] = useState(500);
  
  // 确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // 初始化加载用户数据
  useEffect(() => {
    loadUsers();
  }, []);

  // 加载用户列表（第一页或重置）
  const loadUsers = async (reset: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      if (reset) {
        // 重置分页状态
        setLastCreateTime(null);
        setLastUserId(null);
        setUsers([]);
      }
      
      const searchParams = reset ? buildSearchParams() : {
        size: pageSize,
        lastCreateTime: lastCreateTime,
        lastUserId: lastUserId
      };
      
      const response = await userApi.searchUsers(searchParams);
      
      if (response.statusCode === 200 && response.data) {
        const transformedUsers = response.data.users.map(transformUserItemToUser);
        
        if (reset) {
          setUsers(transformedUsers);
        } else {
          setUsers(prev => [...prev, ...transformedUsers]);
        }
        
        // 更新分页状态
        setHasMore(response.data.hasMore);
        
        // 如果有数据，使用最后一条数据的id和createtime作为下一页的游标
        if (transformedUsers.length > 0) {
          const lastUser = transformedUsers[transformedUsers.length - 1];
          // 从原始数据中获取createTime（毫秒时间戳）
          const lastUserItem = response.data.users[response.data.users.length - 1];
          setLastCreateTime(lastUserItem.createTime);
          setLastUserId(lastUser.id);
        } else {
          setLastCreateTime(null);
          setLastUserId(null);
        }
      } else {
        console.error('Failed to load users:', response.message);
        setError('加载用户列表失败');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('加载用户列表时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 加载更多用户（下一页）
  const loadMoreUsers = async () => {
    if (!hasMore || loading) return;
    await loadUsers(false);
  };

  // 获取过滤后的用户列表
  const getFilteredUsers = () => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.employeeId.toLowerCase().includes(query)
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(user => user.department === filterDepartment);
    }

    if (filterStatus) {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    return filtered;
  };

  // 搜索用户
  const handleSearch = () => {
    loadUsers(true); // 重置并重新搜索
  };

  // 筛选用户
  const handleFilter = () => {
    loadUsers(true); // 重置并重新筛选
  };

  // 构建搜索参数
  const buildSearchParams = () => {
    const params: {
      size: number;
      lastCreateTime: null;
      lastUserId: null;
      keyword?: string;
      deptId?: number;
      active?: number;
    } = {
      size: pageSize,
      lastCreateTime: null,
      lastUserId: null
    };

    if (searchQuery) {
      params.keyword = searchQuery;
    }

    if (filterDepartment) {
      // 根据部门名称找到部门ID
      const dept = departments.find(d => d.name === filterDepartment);
      if (dept) {
        params.deptId = dept.id;
      }
    }

    if (filterStatus) {
      params.active = filterStatus === 'active' ? 1 : 0;
    }

    return params;
  };

  // 获取角色名称
  const getRoleName = (roleId: string) => {
    const roleNames: Record<string, string> = {
      'admin': '超级管理员',
      'agent': '前台客服',
      'staff': '部门员工'
    };
    return roleNames[roleId] || roleId;
  };

  // 打开添加用户模态框
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      employeeId: '',
      role: '',
      department: ''
    });
    setShowUserModal(true);
  };

  // 编辑用户
  const editUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ ...user });
    setShowUserModal(true);
  };

  // 关闭用户模态框
  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  // 保存用户
  const saveUser = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingUser) {
        // 更新用户
        const updateRequest = transformUserFormToUpdateRequest(editingUser.id, userForm);
        const response = await userApi.updateUser(updateRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('用户信息已更新');
          loadUsers(); // 重新加载用户列表
        } else {
          showError('更新用户失败', response.message);
        }
      } else {
        // 创建用户
        const createRequest = transformUserFormToCreateRequest(userForm);
        const response = await userApi.createUser(createRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('用户创建成功');
          loadUsers(); // 重新加载用户列表
        } else {
          showError('创建用户失败', response.message);
        }
      }
      
      closeUserModal();
    } catch (err) {
      console.error('Error saving user:', err);
      setError('保存用户时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 切换用户状态
  const toggleUserStatus = async (user: User) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.toggleUserLock({ userId: user.id });
      
      if (response.statusCode === 200 && response.data) {
        showSuccess(`用户已${user.status === 'active' ? '禁用' : '启用'}`);
        loadUsers(); // 重新加载用户列表以获取最新数据
      } else {
        showError('切换用户状态失败', response.message);
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('切换用户状态时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认弹窗
  const openDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  // 确认删除用户
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await userApi.deleteUser({ userId: userToDelete.id });
      
      if (response.statusCode === 200 && response.data) {
        showSuccess('用户删除成功');
        loadUsers(); // 重新加载用户列表以获取最新数据
      } else {
        showError('删除用户失败', response.message);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('删除用户时发生错误');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setUserToDelete(null);
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setShowConfirmModal(false);
    setUserToDelete(null);
  };

  // 添加角色
  const openAddRoleModal = () => {
    showInfo('添加角色功能开发中...');
  };

  // 添加部门
  const openAddDepartmentModal = () => {
    showInfo('添加部门功能开发中...');
  };

  return (
    <>
      {/* 顶部标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">用户管理</h2>
          <p className="text-gray-600 mt-2">管理员工账号、角色权限和部门结构</p>
        </div>
        <button
          onClick={openAddUserModal}
          data-testid="add-user-button"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="mr-2" size={16} />
          {loading ? '加载中...' : '添加用户'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* 标签页 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium hover:text-gray-800 ${
                activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              用户列表
              <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{users.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-6 py-3 font-medium hover:text-gray-800 ${
                activeTab === 'roles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              角色管理
              <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{roles.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-3 font-medium hover:text-gray-800 ${
                activeTab === 'departments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              部门管理
              <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{departments.length}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 用户列表 */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
          {/* 搜索和筛选 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索用户名、姓名或工号..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有部门</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有状态</option>
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                搜索
              </button>
              <button
                onClick={handleFilter}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                筛选
              </button>
            </div>
          </div>

          {/* 用户表格 */}
          <div className="p-6">
            {loading && users.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="pb-3 font-medium">用户信息</th>
                      <th className="pb-3 font-medium">角色</th>
                      <th className="pb-3 font-medium">部门</th>
                      <th className="pb-3 font-medium">状态</th>
                      <th className="pb-3 font-medium">创建时间</th>
                      <th className="pb-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {getFilteredUsers().map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-gray-600 font-medium">{user.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <p className="text-gray-500">
                                {user.username} · {user.employeeId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                              user.role === 'agent' ? 'bg-blue-100 text-blue-600' :
                              'bg-green-100 text-green-600'
                            }`}
                          >
                            {getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600">{user.department}</td>
                        <td className="py-4">
                          <span
                            className={`flex items-center ${
                              user.status === 'active' ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <CheckCircle className="mr-1" size={16} />
                            ) : (
                              <XCircle className="mr-1" size={16} />
                            )}
                            <span>{user.status === 'active' ? '启用' : '禁用'}</span>
                          </span>
                        </td>
                        <td className="py-4 text-gray-600">{user.createTime}</td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => editUser(user)}
                              disabled={loading}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user)}
                              disabled={loading}
                              className={`p-1 hover:bg-gray-50 rounded disabled:opacity-50 ${
                                user.status === 'active' ? 'text-orange-600' : 'text-green-600'
                              }`}
                            >
                              {user.status === 'active' ? (
                                <Unlock size={16} />
                              ) : (
                                <Lock size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(user)}
                              disabled={loading}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* 加载更多按钮 */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreUsers}
                      disabled={loading}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 角色管理 */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">角色列表</h3>
            <button
              onClick={openAddRoleModal}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              添加角色
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{role.name}</h4>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                      {role.userCount} 用户
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700 mb-1">权限:</p>
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <p key={index} className="text-xs text-gray-500">• {permission}</p>
                    ))}
                    {role.permissions.length > 3 && (
                      <p className="text-xs text-blue-600">
                        +{role.permissions.length - 3} 更多
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm">编辑</button>
                    <button className="text-red-600 hover:text-red-700 text-sm">删除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 部门管理 */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">部门结构</h3>
            <button
              onClick={openAddDepartmentModal}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              添加部门
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {departments.map((dept) => (
                <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Folder className="text-gray-400 mr-3 text-xl" size={20} />
                      <div className="text-left">
                        <h4 className="font-medium text-gray-800">{dept.name}</h4>
                        <p className="text-sm text-gray-600">
                          负责人: {dept.manager} · {dept.memberCount} 名成员
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑用户模态框 */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingUser ? '编辑用户' : '添加用户'}
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); saveUser(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工号</label>
                <input
                  type="text"
                  value={userForm.employeeId}
                  onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                <select
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeUserModal}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="确认删除"
        message={`确定要删除用户 "${userToDelete?.name}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteUser}
        onCancel={cancelDelete}
        type="danger"
        loading={loading}
      />
    </>
  );
};

export default UserManagement;
