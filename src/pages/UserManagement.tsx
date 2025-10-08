import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle,
  Search // 添加搜索图标
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { deptApi } from '../api/deptApi';
import { transformUserFormToCreateRequest, transformUserFormToUpdateRequest } from '../utils/userDataTransform';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import type { User, UserForm, DeptInfo, UserRoleInfo } from '../api/types';

// 根据提供的JSON定义API响应类型，以确保清晰和安全
type UserItem = {
  userId: number;
  username: string;
  displayName: string;
  employeeNumber: string | null;
  active: number;
  createTime: number;
  updateTime: number;
  department: {
    deptId: number;
    deptName: string;
  } | null;
  userRoles: UserRoleInfo[] | null;
};

// 在本地定义转换函数，以确保它与确切的API结构匹配
const transformUserItemToUser = (userItem: UserItem): User => ({
  id: userItem.userId,
  username: userItem.username,
  name: userItem.displayName,
  employeeId: userItem.employeeNumber || 'N/A',
  department: userItem.department ? userItem.department.deptName : '未分配',
  departmentId: userItem.department ? userItem.department.deptId : null,
  userRoles: userItem.userRoles, // 直接传递数组
  // 假设第一个角色是用于编辑的主要角色
  role: userItem.userRoles && userItem.userRoles.length > 0 ? String(userItem.userRoles[0].roleId) : '',
  status: userItem.active === 1 ? 'active' : 'inactive',
  createTime: new Date(userItem.createTime).toLocaleString(),
});

// 用于将角色显示为带工具提示的彩色徽章的组件
const RoleBadges = ({ roles }: { roles: UserRoleInfo[] | null }) => {
  if (!roles || roles.length === 0) {
    return <span className="text-gray-500">无</span>;
  }

  const colors = [
    'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800'
  ];
  
  const displayedRoles = roles.slice(0, 3);
  const hasMore = roles.length > 3;
  const tooltipText = roles.map(r => r.roleName).join(', ');

  return (
    <div className="relative group flex items-center gap-1 flex-wrap">
      {displayedRoles.map((role, index) => (
        <span key={role.roleId} className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[index % colors.length]}`}>
          {role.roleName}
        </span>
      ))}
      {hasMore && (
        <div className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">...</div>
      )}
      {/* 工具提示 */}
      <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded-md invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-300 z-10">
        {tooltipText}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]); // 存储从API获取的所有用户
  const [departments, setDepartments] = useState<DeptInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState(''); // 存储部门ID，-1代表“全部部门”
  const [filterStatus, setFilterStatus] = useState(''); // 存储'active'、'inactive'或''
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    username: '',
    employeeId: '',
    role: '',
    department: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // 加载初始数据
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userResponse, deptResponse] = await Promise.all([
        userApi.searchUsers({ size: 1000 }), // 获取大量用户以加载全部
        deptApi.getDeptSelectList({})
      ]);

      if (userResponse.statusCode === 200 && userResponse.data) {
        const transformedUsers = userResponse.data.users.map(transformUserItemToUser);
        setAllUsers(transformedUsers);
      } else {
        throw new Error(userResponse.message || '加载用户列表失败');
      }

      if (deptResponse.statusCode === 200 && deptResponse.data) {
        // 根据要求，后端会发送一个ID为-1的“全部部门”选项
        setDepartments(deptResponse.data.deptList);
        // 如果存在“全部部门”选项，则设置为默认筛选器
        const allDeptOption = deptResponse.data.deptList.find(d => d.deptId === -1);
        if (allDeptOption) {
          setFilterDepartment(String(allDeptOption.deptId));
        }
      } else {
        throw new Error(deptResponse.message || '加载部门列表失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载初始数据时发生错误';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // 使用useMemo缓存筛选后的用户，以实现即时筛选
  const filteredUsers = useMemo(() => {
    let users = [...allUsers];

    // 按部门筛选
    if (filterDepartment && filterDepartment !== '-1') {
      users = users.filter(user => String(user.departmentId) === filterDepartment);
    }

    // 按状态筛选
    if (filterStatus) {
      users = users.filter(user => user.status === filterStatus);
    }

    // 按搜索查询筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(query))
      );
    }

    return users;
  }, [allUsers, searchQuery, filterDepartment, filterStatus]);

  // 在CRUD操作后刷新用户列表
  const refreshUsers = async () => {
    try {
      // 对于后台刷新，一个好的做法是不显示主加载指示器，
      // 但我们暂时保持简单。为了更好的用户体验，可以使用一个更小的、非阻塞的
      // 指示器。
      const userResponse = await userApi.searchUsers({ size: 1000 });
      if (userResponse.statusCode === 200 && userResponse.data) {
          const transformedUsers = userResponse.data.users.map(transformUserItemToUser);
          setAllUsers(transformedUsers);
      } else {
        // 如果刷新失败，显示信息性消息但不要阻塞UI
        showInfo('刷新用户列表失败，请稍后重试。');
      }
    } catch (e) {
      showError('刷新用户列表时发生错误', e instanceof Error ? e.message : String(e));
    }
  }

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
        // 根据要求，编辑时不更新部门/角色。发送null。
        const formForUpdate = { ...userForm, department: '', role: '' };
        const updateRequest = transformUserFormToUpdateRequest(editingUser.id, formForUpdate);
        const response = await userApi.updateUser(updateRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('用户信息已更新');
          refreshUsers(); // 重新加载用户列表
        } else {
          showError('更新用户失败', response.message);
        }
      } else {
        // 创建用户
        // 根据要求，创建时不设置部门/角色。发送null。
        const formForCreate = { ...userForm, department: '', role: '' };
        const createRequest = transformUserFormToCreateRequest(formForCreate);
        const response = await userApi.createUser(createRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('用户创建成功');
          refreshUsers(); // 重新加载用户列表
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
        refreshUsers(); // 重新加载用户列表以获取最新数据
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
        refreshUsers(); // 重新加载用户列表以获取最新数据
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

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题 */}
      <div className="flex-shrink-0 mb-8 flex items-center justify-between">
        <div className="text-left">
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
        <div className="flex-shrink-0 mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex-shrink-0 bg-white rounded-lg shadow p-4 mb-4 flex items-center space-x-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用户名、姓名或工号..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        
        <div className="relative">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="appearance-none w-48 bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            {departments.map((dept) => (
              <option key={dept.deptId} value={dept.deptId}>{dept.deptName}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none w-40 bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有状态</option>
            <option value="active">启用</option>
            <option value="inactive">禁用</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="py-3 px-4 font-semibold">用户</th>
                    <th className="py-3 px-4 font-semibold">工号</th>
                    <th className="py-3 px-4 font-semibold">部门</th>
                    <th className="py-3 px-4 font-semibold">角色</th>
                    <th className="py-3 px-4 font-semibold">状态</th>
                    <th className="py-3 px-4 font-semibold">创建时间</th>
                    <th className="py-3 px-4 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-left">
                        <div className="font-semibold text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.username}</div>
                      </td>
                      <td className="py-4 px-4 text-left">{user.employeeId}</td>
                      <td className="py-4 px-4 text-left">{user.department}</td>
                      <td className="py-4 px-4 text-left">
                        <RoleBadges roles={user.userRoles} />
                      </td>
                      <td className="py-4 px-4 text-left">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="mr-1.5" size={12} />
                            启用
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="mr-1.5" size={12} />
                            禁用
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-left text-gray-600">{user.createTime}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center space-x-2 justify-end">
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
        </div>
      </div>

      {/* 添加/编辑用户模态框 */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-left">
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
              
              {/* 角色和部门字段现在已从添加和编辑中移除 */}

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
    </div>
  );
};

export default UserManagement;
