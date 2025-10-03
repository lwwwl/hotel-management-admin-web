import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle,
  ChevronDown
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { deptApi } from '../api/deptApi';
import { roleApi } from '../api/roleApi';
import { transformUserItemToUser, transformUserFormToCreateRequest, transformUserFormToUpdateRequest } from '../utils/userDataTransform';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import type { Department, Role, RoleInfo, User, UserForm } from '../api/types';

const UserManagement = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('-1');
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
  
  // 分页状态 -
  const [pageSize] = useState(500);
  
  const isInitialMount = useRef(true);

  const roleMap = useMemo(() => {
    return roles.reduce((acc, role) => {
      acc[role.id] = role.name;
      return acc;
    }, {} as Record<string, string>);
  }, [roles]);

  // Custom dropdown states
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);


  // 确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const buildSearchParams = useCallback(() => {
    const params: {
      size: number;
      deptId?: number;
      active?: number;
    } = {
      size: pageSize
    };

    const deptId = parseInt(filterDepartmentId, 10);
    if (!isNaN(deptId) && deptId !== -1) {
      params.deptId = deptId;
    }

    if (filterStatus) {
      params.active = filterStatus === 'active' ? 1 : 0;
    }

    return params;
  }, [filterDepartmentId, filterStatus, pageSize]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allFetchedUsers: User[] = [];
      let hasMorePages = true;
      let lastTime: number | null = null;
      let lastId: number | null = null;
      const baseParams = buildSearchParams();

      while (hasMorePages) {
        const response = await userApi.searchUsers({
          ...baseParams,
          lastCreateTime: lastTime,
          lastUserId: lastId,
        });

        if (response.statusCode === 200 && response.data) {
          const transformedUsers = response.data.users.map(transformUserItemToUser);
          allFetchedUsers.push(...transformedUsers);
          hasMorePages = response.data.hasMore;
          
          if (transformedUsers.length > 0) {
            const lastUserItem = response.data.users[response.data.users.length - 1];
            lastTime = lastUserItem.createTime;
            lastId = lastUserItem.userId;
          } else {
            hasMorePages = false; // Safeguard to exit loop
          }
        } else {
          console.error('Failed to load users:', response.message);
          setError('加载用户列表失败');
          hasMorePages = false; // Exit loop on error
        }
      }
      setUsers(allFetchedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('加载用户列表时发生错误');
    } finally {
      setLoading(false);
    }
  }, [buildSearchParams]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await deptApi.getDeptSelectList({});
      if (response.statusCode === 200 && response.data) {
        // 将API返回的数据格式转换为组件内部使用的Department格式
        const transformedDepts = response.data.deptList.map(d => ({
          id: d.deptId,
          name: d.deptName,
          manager: '', // select list不返回manager和memberCount
          memberCount: 0
        }));
        setDepartments(transformedDepts);
      } else {
        showError('加载部门列表失败', response.message);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      showError('加载部门列表时发生错误');
    }
  }, [showError]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await roleApi.getRoleList({});
      if (response.statusCode === 200 && response.data) {
        const transformedRoles = response.data.roles.map((r: RoleInfo) => ({
          id: String(r.roleId),
          name: r.name,
          description: r.description || '',
          userCount: 0, // 列表接口不返回用户数量
          permissions: [] // 列表接口不返回权限
        }));
        setRoles(transformedRoles);
      } else {
        showError('加载角色列表失败', response.message);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      showError('加载角色列表时发生错误');
    }
  }, [showError]);

  // 初始化加载用户数据
  useEffect(() => {
    loadUsers();
    loadDepartments();
    loadRoles();
  }, [loadUsers, loadDepartments, loadRoles]);

  // Effect to handle closing dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当筛选条件变化时，自动重新加载用户列表
  useEffect(() => {
    // 避免在组件首次加载时执行，因为初始加载由上面的useEffect处理
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      loadUsers();
    }
  }, [filterDepartmentId, filterStatus, loadUsers]);

  // 前端实时搜索过滤
  const displayedUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.employeeId.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // 获取角色名称
  const getRoleName = (roleId: string) => {
    return roleMap[roleId] || roleId;
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

  return (
    <>
      {/* 顶部标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">用户管理</h2>
          <p className="text-gray-600 mt-2">管理员工账号信息</p>
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

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow">
        {/* 搜索和筛选 */}
        <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索用户名、姓名或工号..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Custom Department Dropdown */}
              <div className="relative w-48" ref={deptDropdownRef}>
                <button
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <span className="truncate">
                    {departments.find(d => String(d.id) === filterDepartmentId)?.name || '选择部门'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform text-gray-500 ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDeptDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <ul className="py-1 max-h-60 overflow-y-auto">
                      {departments.map((dept) => (
                        <li
                          key={dept.id}
                          onClick={() => {
                            setFilterDepartmentId(String(dept.id));
                            setIsDeptDropdownOpen(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          {dept.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Custom Status Dropdown */}
              <div className="relative w-48" ref={statusDropdownRef}>
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <span className="truncate">
                    {filterStatus === 'active' ? '启用' : filterStatus === 'inactive' ? '禁用' : '所有状态'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform text-gray-500 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <ul className="py-1">
                      {[
                        { value: '', label: '所有状态' },
                        { value: 'active', label: '启用' },
                        { value: 'inactive', label: '禁用' },
                      ].map((opt) => (
                        <li
                          key={opt.value}
                          onClick={() => {
                            setFilterStatus(opt.value);
                            setIsStatusDropdownOpen(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          {opt.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-sm text-gray-600 border-b bg-gray-50">
                      <th className="px-6 py-3 font-medium text-left">用户信息</th>
                      <th className="px-6 py-3 font-medium text-left">角色</th>
                      <th className="px-6 py-3 font-medium text-left">部门</th>
                      <th className="px-6 py-3 font-medium text-left">状态</th>
                      <th className="px-6 py-3 font-medium text-left">创建时间</th>
                      <th className="px-6 py-3 font-medium text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {displayedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 align-middle">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                              <span className="text-gray-600 font-medium">{user.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{user.name}</p>
                              <p className="text-gray-500 text-xs">
                                {user.username} · {user.employeeId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={'bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium'}
                          >
                            {getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`flex items-center text-xs ${
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
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.createTime}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => editUser(user)}
                              disabled={loading}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user)}
                              disabled={loading}
                              className={`p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 ${
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
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
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
            )}
          </div>
        </div>

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
