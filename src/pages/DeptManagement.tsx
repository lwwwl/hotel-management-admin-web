import { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Users, 
  UserPlus, 
  UserMinus,
  Building
} from 'lucide-react';
import { deptApi } from '../api/deptApi';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import UserSelectorModal from '../components/UserSelectorModal';
import { transformDeptItemToDept, transformDeptFormToCreateRequest, transformDeptFormToUpdateRequest } from '../utils/deptDataTransform';
import type { DeptDetailResponse, DeptUserInfo } from '../api/types';

// 前端使用的部门类型
interface Dept {
  id: number;
  name: string;
  manager: string;
  memberCount: number;
  leaderId: number;
}

// 部门表单类型
interface DeptForm {
  id?: number; // 部门ID，编辑时使用
  deptName: string;
  leaderId: number;
}

const DeptManagement = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [selectedDept, setSelectedDept] = useState<DeptDetailResponse | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Dept | null>(null);
  const [deptForm, setDeptForm] = useState<DeptForm>({
    deptName: '',
    leaderId: 0
  });
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Dept | null>(null);
  
  // 用户选择弹窗状态
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showLeaderSelector, setShowLeaderSelector] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<any>(null);

  // 初始化加载部门数据
  useEffect(() => {
    loadDepartments();
  }, []);

  // 加载部门列表
  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deptApi.getDeptList({});
      
      if (response.statusCode === 200 && response.data) {
        const transformedDepts = response.data.deptList.map(transformDeptItemToDept);
        setDepartments(transformedDepts);
      } else {
        console.error('Failed to load departments:', response.message);
        setError('加载部门列表失败');
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('加载部门列表时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 加载部门详情
  const loadDeptDetail = async (deptId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deptApi.getDeptDetail({ deptId });
      
      if (response.statusCode === 200 && response.data) {
        setSelectedDept(response.data);
        setActiveTab('detail');
      } else {
        console.error('Failed to load department detail:', response.message);
        setError('加载部门详情失败');
      }
    } catch (err) {
      console.error('Error loading department detail:', err);
      setError('加载部门详情时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 编辑部门
  const editDept = (dept: Dept) => {
    setEditingDept(dept);
    setSelectedLeader({
      id: dept.leaderId,
      name: dept.manager
    });
    setDeptForm({
      id: dept.id, // 设置部门ID
      deptName: dept.name,
      leaderId: dept.leaderId
    });
    setShowDeptModal(true);
  };

  // 关闭部门模态框
  const closeDeptModal = () => {
    setShowDeptModal(false);
    setEditingDept(null);
    setSelectedLeader(null);
  };

  // 保存部门
  const saveDept = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingDept) {
        // 更新部门
        const updateRequest = transformDeptFormToUpdateRequest(editingDept.id, deptForm);
        const response = await deptApi.updateDept(updateRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('部门信息已更新');
          loadDepartments(); // 重新加载部门列表
        } else {
          showError('更新部门失败', response.message);
        }
      } else {
        // 创建部门
        const createRequest = transformDeptFormToCreateRequest(deptForm);
        const response = await deptApi.createDept(createRequest);
        
        if (response.statusCode === 200 && response.data) {
          showSuccess('部门创建成功');
          loadDepartments(); // 重新加载部门列表
        } else {
          showError('创建部门失败', response.message);
        }
      }
      
      closeDeptModal();
    } catch (err) {
      console.error('Error saving department:', err);
      setError('保存部门时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认弹窗
  const openDeleteConfirm = (dept: Dept) => {
    setDeptToDelete(dept);
    setShowConfirmModal(true);
  };

  // 确认删除部门
  const confirmDeleteDept = async () => {
    if (!deptToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await deptApi.deleteDept({ deptId: deptToDelete.id });
      
      if (response.statusCode === 200 && response.data) {
        showSuccess('部门删除成功');
        loadDepartments(); // 重新加载部门列表
        if (selectedDept && selectedDept.deptId === deptToDelete.id) {
          setSelectedDept(null);
          setActiveTab('list');
        }
      } else {
        showError('删除部门失败', response.message);
      }
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('删除部门时发生错误');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setDeptToDelete(null);
    }
  };

  // 打开添加成员模态框
  const openAddMemberModal = () => {
    if (!selectedDept) return;
    setShowUserSelector(true);
  };

  // 处理领导选择确认
  const handleLeaderSelection = (selectedUsers: any[]) => {
    if (selectedUsers.length > 0) {
      setSelectedLeader(selectedUsers[0]);
      setDeptForm({ ...deptForm, leaderId: selectedUsers[0].id });
    }
    setShowLeaderSelector(false);
  };

  // 处理用户选择确认
  const handleUserSelection = async (selectedUsers: any[]) => {
    if (!selectedDept || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // 过滤掉已有部门的用户（双重保险）
      const availableUsers = selectedUsers.filter(user => !user.departmentId || user.departmentId === 0);
      
      if (availableUsers.length === 0) {
        showError('所选用户都已加入其他部门，无法添加');
        return;
      }
      
      if (availableUsers.length < selectedUsers.length) {
        showError(`有 ${selectedUsers.length - availableUsers.length} 名用户已加入其他部门，将只添加 ${availableUsers.length} 名用户`);
      }

      const userIdList = availableUsers.map(user => user.id);
      const response = await deptApi.addDeptUser({
        deptId: selectedDept.deptId,
        userIdList: userIdList
      });
      
      if (response.statusCode === 200 && response.data) {
        showSuccess(`成功添加 ${availableUsers.length} 名成员`);
        loadDeptDetail(selectedDept.deptId); // 重新加载部门详情
      } else {
        showError('添加成员失败', response.message);
      }
    } catch (err) {
      console.error('Error adding members:', err);
      setError('添加成员时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 移除成员
  const removeMember = async (member: DeptUserInfo) => {
    if (!selectedDept) return;

    try {
      setLoading(true);
      setError(null);

      const response = await deptApi.removeDeptUser({
        deptId: selectedDept.deptId,
        userIdList: [member.userId]
      });
      
      if (response.statusCode === 200 && response.data) {
        showSuccess('成员移除成功');
        loadDeptDetail(selectedDept.deptId); // 重新加载部门详情
      } else {
        showError('移除成员失败', response.message);
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError('移除成员时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setShowConfirmModal(false);
    setDeptToDelete(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 text-left mb-8">
        <h1 className="text-3xl font-bold text-gray-800">部门管理</h1>
        <p className="mt-2 text-gray-600">管理公司的组织架构和部门信息。</p>
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
              部门列表
              <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{departments.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              disabled={!selectedDept}
              className={`px-6 py-3 font-medium hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'detail' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              部门详情
              {selectedDept && (
                <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  {selectedDept.memberList.length} 成员
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden text-left">
        {/* 部门列表 */}
        {activeTab === 'list' && (
          <div className="p-6">
            {loading && departments.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                  <div key={dept.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Building className="text-blue-600 mr-3" size={24} />
                        <div>
                          <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                          <p className="text-sm text-gray-600">负责人: {dept.manager}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => loadDeptDetail(dept.id)}
                          disabled={loading}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="查看详情"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => editDept(dept)}
                          disabled={loading}
                          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          title="编辑部门"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(dept)}
                          disabled={loading}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="删除部门"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        <Users className="inline mr-1" size={14} />
                        {dept.memberCount} 名成员
                      </span>
                      <button
                        onClick={() => loadDeptDetail(dept.id)}
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

        {/* 部门详情 */}
        {activeTab === 'detail' && selectedDept && (
          <div className="p-6">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Building className="mr-2 text-blue-600" size={20} />
                  {selectedDept.deptName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  负责人: {selectedDept.leaderName} · {selectedDept.memberList.length} 名成员
                </p>
              </div>
              <button
                onClick={openAddMemberModal}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
              >
                <UserPlus className="mr-2" size={16} />
                添加成员
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDept.memberList.map((member) => {
                  const isLeader = member.userId === selectedDept.leaderId; // 判断是否为部门领导
                  
                  return (
                    <div key={member.userId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-gray-600 font-medium">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium text-gray-800">{member.name}</p>
                              {isLeader && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                  负责人
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{member.username}</p>
                          </div>
                        </div>
                        {!isLeader && (
                          <button
                            onClick={() => removeMember(member)}
                            disabled={loading}
                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="移除成员"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedDept.memberList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto mb-2" size={48} />
                  <p>暂无成员</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Modals */}
      {/* 添加/编辑部门模态框 */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingDept ? '编辑部门' : '添加部门'}
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); saveDept(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部门名称</label>
                <input
                  type="text"
                  value={deptForm.deptName}
                  onChange={(e) => setDeptForm({ ...deptForm, deptName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">部门领导</label>
                 <div className="flex items-center space-x-2">
                   <input
                     type="text"
                     value={selectedLeader ? selectedLeader.name : ''}
                     placeholder="请选择部门领导"
                     readOnly
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                   />
                   <button
                     type="button"
                     onClick={() => setShowLeaderSelector(true)}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                   >
                     <Users className="mr-2" size={16} />
                     选择领导
                   </button>
                 </div>
               </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeptModal}
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

       {/* 用户选择弹窗 */}
       <UserSelectorModal
         isOpen={showUserSelector}
         onClose={() => setShowUserSelector(false)}
         onConfirm={handleUserSelection}
         title="添加部门成员"
         confirmText="添加成员"
         excludeUserIds={selectedDept?.memberList.map(member => member.userId) || []}
         maxSelection={0} // 无限制
         selectionMode="multiple"
       />

       {/* 领导选择弹窗 */}
       <UserSelectorModal
         isOpen={showLeaderSelector}
         onClose={() => setShowLeaderSelector(false)}
         onConfirm={handleLeaderSelection}
         title="选择部门领导"
         confirmText="确认选择"
         excludeUserIds={[]}
         maxSelection={1}
         selectionMode="single"
         allowCurrentDeptMembers={true}
         currentDeptId={deptForm.id}
       />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="确认删除"
        message={`确定要删除部门 "${deptToDelete?.name}" 吗？此操作将同时删除该部门的所有成员关联，且不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteDept}
        onCancel={cancelDelete}
        type="danger"
        loading={loading}
      />
    </div>
  );
};

export default DeptManagement;
