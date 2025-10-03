import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield
} from 'lucide-react';
import { roleApi } from '../api/roleApi';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import RoleDetail from '../components/RoleDetail';
import type { RoleInfo, RoleCreateRequest, RoleUpdateRequest } from '../api/types';

// 前端使用的角色类型
interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  createTime: number;
  updateTime: number;
}

// 角色表单类型
interface RoleForm {
  id?: number; // 角色ID，编辑时使用
  name: string;
  description: string;
  userIdList: number[];
}

const RoleManagement = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleInfo | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>({
    name: '',
    description: '',
    userIdList: []
  });
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // 初始化加载角色数据
  useEffect(() => {
    loadRoles();
  }, []);

  // 加载角色列表
  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await roleApi.getRoleList({});
      
      if (response.statusCode === 200 && response.data) {
        const transformedRoles = response.data.roles.map(role => ({
          id: role.roleId,
          name: role.name,
          description: role.description || '',
          userCount: 0, // 暂时设为0，后续可以从详情接口获取
          createTime: role.createTime,
          updateTime: role.updateTime
        }));
        setRoles(transformedRoles);
      } else {
        console.error('Failed to load roles:', response.message);
        setError('加载角色列表失败');
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('加载角色列表时发生错误');
    } finally {
      setLoading(false);
    }
  };


  // 打开添加角色模态框
  const openAddRoleModal = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      userIdList: []
    });
    setShowRoleModal(true);
  };

  // 编辑角色
  const editRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description,
      userIdList: []
    });
    setShowRoleModal(true);
  };

  // 关闭角色模态框
  const closeRoleModal = () => {
    setShowRoleModal(false);
    setEditingRole(null);
  };

  // 保存角色
  const saveRole = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingRole) {
        // 更新角色
        const updateRequest: RoleUpdateRequest = {
          roleId: editingRole.id,
          name: roleForm.name,
          description: roleForm.description,
          userIdList: roleForm.userIdList
        };
        const response = await roleApi.updateRole(updateRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('角色信息已更新');
          loadRoles(); // 重新加载角色列表
        } else {
          showError('更新角色失败', response.message);
        }
      } else {
        // 创建角色
        const createRequest: RoleCreateRequest = {
          name: roleForm.name,
          description: roleForm.description,
          userIdList: roleForm.userIdList
        };
        const response = await roleApi.createRole(createRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('角色创建成功');
          loadRoles(); // 重新加载角色列表
        } else {
          showError('创建角色失败', response.message);
        }
      }
      
      closeRoleModal();
    } catch (err) {
      console.error('Error saving role:', err);
      setError('保存角色时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认弹窗
  const openDeleteConfirm = (role: Role) => {
    setRoleToDelete(role);
    setShowConfirmModal(true);
  };

  // 确认删除角色
  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await roleApi.deleteRole({ roleId: roleToDelete.id });
      
      if (response.statusCode === 200 && response.data) {
        showSuccess('角色删除成功');
        loadRoles(); // 重新加载角色列表
        if (selectedRole && selectedRole.roleId === roleToDelete.id) {
          setSelectedRole(null);
          setActiveTab('list');
        }
      } else {
        showError('删除角色失败', response.message);
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('删除角色时发生错误');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setRoleToDelete(null);
    }
  };


  // 取消删除
  const cancelDelete = () => {
    setShowConfirmModal(false);
    setRoleToDelete(null);
  };

  // 查看角色详情
  const viewRoleDetail = (role: Role) => {
    setSelectedRole({
      roleId: role.id,
      name: role.name,
      description: role.description,
      createTime: role.createTime,
      updateTime: role.updateTime
    });
    setActiveTab('detail');
  };

  return (
    <>
      {/* 顶部标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">角色管理</h2>
          <p className="text-gray-600 mt-2">管理酒店角色权限和用户分配</p>
        </div>
        <button
          onClick={openAddRoleModal}
          data-testid="add-role-button"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="mr-2" size={16} />
          {loading ? '加载中...' : '添加角色'}
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
              onClick={() => setActiveTab('list')}
              className={`px-6 py-3 font-medium hover:text-gray-800 ${
                activeTab === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              角色列表
              <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{roles.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              disabled={!selectedRole}
              className={`px-6 py-3 font-medium hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'detail' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              角色详情
              {selectedRole && (
                <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  {selectedRole.name}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* 角色列表 */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading && roles.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-sm text-gray-600 border-b bg-gray-50">
                      <th className="px-6 py-3 font-medium text-left">角色名称</th>
                      <th className="px-6 py-3 font-medium text-left">描述</th>
                      <th className="px-6 py-3 font-medium text-left">创建时间</th>
                      <th className="px-6 py-3 font-medium text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-800">
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50 align-middle">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Shield className="text-blue-600 mr-4" size={20} />
                            <div>
                              <p className="font-semibold">{role.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {role.description || '暂无描述'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          {new Date(role.createTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => viewRoleDetail(role)}
                              disabled={loading}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50"
                              title="查看详情"
                            >
                              <Users size={16} />
                            </button>
                            {role.id !== 1 && (
                              <>
                                <button
                                  onClick={() => editRole(role)}
                                  disabled={loading}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-full disabled:opacity-50"
                                  title="编辑角色"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(role)}
                                  disabled={loading}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                                  title="删除角色"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {roles.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="mx-auto mb-2" size={48} />
                <p>暂无角色</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 角色详情 */}
      {activeTab === 'detail' && selectedRole && (
        <RoleDetail 
          roleId={selectedRole.roleId} 
          onBack={() => setActiveTab('list')} 
        />
      )}

      {/* 添加/编辑角色模态框 */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">
              {editingRole ? '编辑角色' : '添加角色'}
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); saveRole(); }} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色名称</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色描述</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeRoleModal}
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
        message={`确定要删除角色 "${roleToDelete?.name}" 吗？此操作将同时删除该角色的所有用户关联，且不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteRole}
        onCancel={cancelDelete}
        type="danger"
        loading={loading}
      />
    </>
  );
};

export default RoleManagement;
