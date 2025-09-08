import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Check, Users, UserPlus } from 'lucide-react';
import { userApi } from '../api/userApi';
import { useToast } from './ToastProvider';
import type { UserItem } from '../api/types';

// 用户选择弹窗的 Props 类型
interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedUsers: User[]) => void;
  title?: string;
  confirmText?: string;
  excludeUserIds?: number[]; // 需要排除的用户ID列表
  maxSelection?: number; // 最大选择数量，0表示无限制
  selectionMode?: 'single' | 'multiple'; // 选择模式：单选或多选
  allowCurrentDeptMembers?: boolean; // 是否允许选择当前部门的成员（用于选择领导场景）
  currentDeptId?: number; // 当前部门ID（用于判断是否为当前部门成员）
  // 角色管理相关属性
  mode?: 'department' | 'role'; // 选择模式：部门管理或角色管理
  currentRoleId?: number; // 当前角色ID（用于角色管理场景）
  initialSelectedUserIds?: number[]; // 初始已选中的用户ID列表（用于角色管理场景）
}

// 前端使用的用户类型
interface User {
  id: number;
  name: string;
  username: string;
  employeeNumber?: string;
  department?: string;
  departmentId?: number; // 部门ID
  active: number;
  createTime: number;
  updateTime: number;
  userRoles?: {
    roleId: number;
    roleName: string;
  }[];
}

const UserSelectorModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "选择用户",
  confirmText = "确认选择",
  excludeUserIds = [],
  maxSelection = 0,
  selectionMode = 'multiple',
  allowCurrentDeptMembers = false,
  currentDeptId,
  mode = 'department',
  currentRoleId,
  initialSelectedUserIds = []
}: UserSelectorModalProps) => {
  const { showError } = useToast();
  
  // 记录当前角色ID（用于调试和将来扩展）
  if (mode === 'role' && currentRoleId) {
    console.debug('UserSelectorModal in role mode for role:', currentRoleId);
  }
  
  // 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize] = useState(50);
  
  // 使用 ref 来避免闭包问题
  const lastCreateTimeRef = useRef<number | null>(null);
  const lastUserIdRef = useRef<number | null>(null);
  const excludeUserIdsRef = useRef<number[]>([]);

  // 转换用户数据格式
  const transformUserItemToUser = (item: UserItem): User => {
    return {
      id: item.userId,
      name: item.displayName,
      username: item.username,
      employeeNumber: item.employeeNumber,
      department: item.department?.deptName,
      departmentId: item.department?.deptId,
      active: item.active,
      createTime: item.createTime,
      updateTime: item.updateTime
    };
  };

  // 加载用户列表
  const loadUsers = useCallback(async (reset: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      if (reset) {
        lastCreateTimeRef.current = null;
        lastUserIdRef.current = null;
        setUsers([]);
      }
      
      const searchParams = reset ? {
        size: pageSize,
        lastCreateTime: null,
        lastUserId: null
      } : {
        size: pageSize,
        lastCreateTime: lastCreateTimeRef.current,
        lastUserId: lastUserIdRef.current
      };
      
      const response = await userApi.searchUsers(searchParams);
      
      if (response.statusCode === 200 && response.data) {
        const transformedUsers = response.data.users.map(transformUserItemToUser);
        
        // 过滤掉需要排除的用户
        const filteredUsers = transformedUsers.filter(user => 
          !excludeUserIdsRef.current.includes(user.id)
        );
        
        if (reset) {
          setUsers(filteredUsers);
        } else {
          setUsers(prev => [...prev, ...filteredUsers]);
        }
        
        setHasMore(response.data.hasMore);
        
        if (filteredUsers.length > 0) {
          const lastUser = response.data.users[response.data.users.length - 1];
          lastCreateTimeRef.current = lastUser.createTime;
          lastUserIdRef.current = lastUser.userId;
        } else {
          lastCreateTimeRef.current = null;
          lastUserIdRef.current = null;
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
  }, [pageSize]);

  // 加载更多用户
  const loadMoreUsers = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadUsers(false);
  }, [hasMore, loading, loadUsers]);

  // 搜索过滤
  const filterUsers = useCallback((query: string, userList: User[]) => {
    if (!query.trim()) {
      setFilteredUsers(userList);
      return;
    }
    
    const filtered = userList.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      (user.employeeNumber && user.employeeNumber.toLowerCase().includes(query.toLowerCase())) ||
      (user.department && user.department.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredUsers(filtered);
  }, []);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterUsers(query, users);
  };

  // 切换用户选择状态
  const toggleUserSelection = (user: User) => {
    // 角色管理模式下，不检查部门限制
    if (mode === 'role') {
      // 角色管理场景：只检查是否已加入当前角色
      if (excludeUserIds.includes(user.id)) {
        showError(`用户 "${user.name}" 已加入当前角色，不可重复分配`);
        return;
      }
    } else {
      // 部门管理场景：检查部门限制
      const hasDepartment = user.departmentId && user.departmentId > 0;
      
      // 如果允许选择当前部门成员，且用户是当前部门的成员，则允许选择
      if (hasDepartment && allowCurrentDeptMembers && currentDeptId && user.departmentId === currentDeptId) {
        // 允许选择当前部门的成员（用于选择领导场景）
      } else if (hasDepartment) {
        showError(`用户 "${user.name}" 已加入部门 "${user.department}"，不可重复分配`);
        return;
      }
    }
    
    // 单选模式：如果已选择其他用户，先清空
    if (selectionMode === 'single') {
      const isSelected = selectedUsers.find(u => u.id === user.id);
      if (isSelected) {
        setSelectedUsers([]);
      } else {
        setSelectedUsers([user]);
      }
      return;
    }
    
    // 多选模式：原有的多选逻辑
    if (maxSelection > 0 && selectedUsers.length >= maxSelection && !selectedUsers.find(u => u.id === user.id)) {
      showError(`最多只能选择 ${maxSelection} 个用户`);
      return;
    }
    
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // 确认选择
  const handleConfirm = () => {
    onConfirm(selectedUsers);
    handleClose();
  };

  // 关闭弹窗
  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  // 更新 excludeUserIdsRef
  useEffect(() => {
    excludeUserIdsRef.current = excludeUserIds;
  }, [excludeUserIds]);

  // 初始化加载
  useEffect(() => {
    if (isOpen) {
      loadUsers(true);
    }
  }, [isOpen, loadUsers]);

  // 角色管理模式下，根据初始选中的用户ID设置选中状态
  useEffect(() => {
    if (isOpen && mode === 'role' && initialSelectedUserIds.length > 0 && users.length > 0) {
      const selectedUsers = users.filter(user => initialSelectedUserIds.includes(user.id));
      setSelectedUsers(selectedUsers);
    } else if (isOpen && mode === 'role' && initialSelectedUserIds.length === 0) {
      // 如果没有初始选中的用户，清空选中状态
      setSelectedUsers([]);
    }
  }, [isOpen, mode, initialSelectedUserIds, users]);

  // 搜索过滤
  useEffect(() => {
    filterUsers(searchQuery, users);
  }, [searchQuery, users, filterUsers]);

  // 获取当前显示的用户列表
  const displayUsers = searchQuery ? filteredUsers : users;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                {selectedUsers.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm">
                    {selectionMode === 'single' 
                      ? `已选择：${selectedUsers[0].name}` 
                      : `已选择 ${selectedUsers.length} 个用户`
                    }
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* 搜索框 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="搜索用户名、姓名、工号或部门..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="px-6 py-2 bg-red-100 border-b border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 用户列表 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading && users.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">加载中...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayUsers.map((user) => {
                    const isSelected = selectedUsers.find(u => u.id === user.id);
                    const hasDepartment = user.departmentId && user.departmentId > 0; // 用户已有部门
                    const hasRole = excludeUserIds.includes(user.id); // 用户已加入当前角色
                    
                    // 判断是否为当前部门成员
                    const isCurrentDeptMember = allowCurrentDeptMembers && currentDeptId && user.departmentId === currentDeptId;
                    
                    // 禁用逻辑
                    let isDisabled = false;
                    if (mode === 'role') {
                      // 角色管理场景：只检查是否已加入当前角色或达到最大选择数量限制
                      isDisabled = hasRole || (maxSelection > 0 && selectedUsers.length >= maxSelection && !isSelected);
                    } else {
                      // 部门管理场景：检查部门限制
                      isDisabled = (hasDepartment && !isCurrentDeptMember) || (maxSelection > 0 && selectedUsers.length >= maxSelection && !isSelected);
                    }
                    
                    return (
                      <div
                        key={user.id}
                        onClick={() => !isDisabled && toggleUserSelection(user)}
                        className={`p-3 border rounded-lg transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {/* 选择指示器 */}
                            <div className="mr-3">
                              {selectionMode === 'single' ? (
                                // 单选模式：使用圆形单选按钮
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                              ) : (
                                // 多选模式：使用方形复选框
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <Check className="text-white" size={12} />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-gray-600 font-medium">{user.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <p className="font-medium text-gray-800">{user.name}</p>
                                {mode === 'department' && hasDepartment && (
                                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                    isCurrentDeptMember 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-orange-100 text-orange-600'
                                  }`}>
                                    {user.department}
                                    {isCurrentDeptMember && ' (当前部门)'}
                                  </span>
                                )}
                                {mode === 'role' && hasRole && (
                                  <span className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-600">
                                    已加入当前角色
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {user.username}
                                {user.employeeNumber && ` · ${user.employeeNumber}`}
                                {mode === 'department' && hasDepartment && ` · ${isCurrentDeptMember ? '当前部门成员' : '已加入部门'}`}
                                {mode === 'role' && hasDepartment && ` · ${user.department}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {user.active === 1 ? (
                              <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
                                启用
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                                禁用
                              </span>
                            )}
                            {mode === 'department' && hasDepartment && (
                              <span className="ml-2 text-xs text-gray-500">
                                已分配
                              </span>
                            )}
                            {mode === 'role' && hasRole && (
                              <span className="ml-2 text-xs text-gray-500">
                                已加入角色
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* 加载更多按钮 */}
                  {hasMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMoreUsers}
                        disabled={loading}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '加载中...' : '加载更多'}
                      </button>
                    </div>
                  )}
                  
                  {displayUsers.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="mx-auto mb-2" size={48} />
                      <p>{searchQuery ? '没有找到匹配的用户' : '暂无用户数据'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部操作按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || selectedUsers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <UserPlus className="mr-2" size={16} />
                {selectionMode === 'single' 
                  ? confirmText 
                  : `${confirmText} (${selectedUsers.length})`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserSelectorModal;
