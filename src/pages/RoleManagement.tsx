import { useState, useEffect } from 'react';
import { 
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 text-left mb-8">
        <h1 className="text-3xl font-bold text-gray-800">角色管理</h1>
        <p className="mt-2 text-gray-600">定义用户角色并分配相应的系统权限。</p>
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


      {/* 标签页 */}
      <div className="flex-shrink-0 bg-white rounded-lg shadow mb-6">
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

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden text-left">
        {/* 角色列表 */}
        {activeTab === 'list' && (
          <div className="h-full overflow-y-auto p-6">
            {loading && roles.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : roles.length === 0 ? (
               <div className="text-center py-12 text-gray-500">
                 <Shield className="mx-auto h-12 w-12 text-gray-400" />
                 <p className="mt-4">暂无角色，请点击右上角添加。</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                  <div key={role.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Shield className="text-blue-600 mr-3" size={24} />
                        <div>
                          <h3 className="font-semibold text-gray-800">{role.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{role.description || '暂无描述'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => viewRoleDetail(role)}
                          disabled={loading}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="查看详情"
                        >
                          <Users size={16} />
                        </button>
                        {role.id !== 1 && (
                          <>
                            <button
                              onClick={() => editRole(role)}
                              disabled={loading}
                              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="编辑角色"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(role)}
                              disabled={loading}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="删除角色"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-600">
                        {new Date(role.createTime).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => viewRoleDetail(role)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        查看详情 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 角色详情 */}
        {activeTab === 'detail' && selectedRole && (
          <div className="h-full overflow-y-auto p-6">
            <RoleDetail 
              roleId={selectedRole.roleId} 
              onBack={() => setActiveTab('list')} 
            />
          </div>
        )}
      </div>

      {/* Modals */}
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
    </div>
  );
};

export default RoleManagement;
