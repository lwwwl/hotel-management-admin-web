import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Bed, CheckCircle2, XCircle } from 'lucide-react';
import { roomApi } from '../api/roomApi';
import type { HotelRoom } from '../api/types';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';

interface RoomForm {
  id?: number;
  name: string;
  active: number; // 0/1
}

const RoomManagement = () => {
  const { showSuccess, showError } = useToast();
  const [rooms, setRooms] = useState<HotelRoom[]>([]); // 全量数据
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HotelRoom | null>(null);
  const [form, setForm] = useState<RoomForm>({ name: '', active: 1 });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HotelRoom | null>(null);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      // 仅加载一次全量数据，前端进行过滤
      const res = await roomApi.list();
      if (res.statusCode === 200) {
        setRooms(res.data || []);
      } else {
        setError(res.message || '加载失败');
      }
    } catch (e) {
      setError('加载房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rooms.filter(r => {
      const matchActive = activeFilter === 'all' || (activeFilter === 'active' ? r.active === 1 : r.active === 0);
      const matchKw = kw ? (r.name?.toLowerCase().includes(kw)) : true;
      return matchActive && matchKw;
    });
  }, [rooms, keyword, activeFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', active: 1 });
    setShowModal(true);
  };

  const openEdit = (room: HotelRoom) => {
    setEditing(room);
    setForm({ id: room.id, name: room.name, active: room.active });
    setShowModal(true);
  };

  const saveRoom = async () => {
    try {
      setLoading(true);
      if (editing) {
        const res = await roomApi.update({ id: form.id!, name: form.name, active: form.active });
        if (res.statusCode === 200 && res.data) {
          showSuccess('房间已更新');
          setShowModal(false);
          loadRooms();
        } else {
          showError('更新失败', res.message);
        }
      } else {
        const res = await roomApi.create({ name: form.name, active: form.active });
        if (res.statusCode === 200 && res.data) {
          showSuccess('房间创建成功');
          setShowModal(false);
          loadRooms();
        } else {
          showError('创建失败', res.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (room: HotelRoom) => {
    setPendingDelete(room);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      setLoading(true);
      const res = await roomApi.delete({ id: pendingDelete.id });
      if (res.statusCode === 200 && res.data) {
        showSuccess('删除成功');
        loadRooms();
      } else {
        showError('删除失败', res.message);
      }
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">房间管理</h2>
          <p className="text-gray-600 mt-2">管理酒店房间的基础信息</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="mr-2" size={16} /> 新增房间
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索房间名称..."
          className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
        />
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">全部状态</option>
          <option value="active">仅有效</option>
          <option value="inactive">仅无效</option>
        </select>
        <button onClick={() => { /* 前端过滤，无需请求 */ }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">搜索</button>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {loading && rooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Bed className="text-blue-600 mr-3" size={20} />
                      <div>
                        <h3 className="font-semibold text-gray-800">{room.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          {room.active ? (
                            <><CheckCircle2 className="text-green-600 mr-1" size={14} /> 有效</>
                          ) : (
                            <><XCircle className="text-gray-400 mr-1" size={14} /> 无效</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => openEdit(room)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="编辑">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => confirmDelete(room)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredRooms.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Bed className="mx-auto mb-2" size={48} />
              <p>暂无房间</p>
            </div>
          )}
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editing ? '编辑房间' : '新增房间'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); saveRoom(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">房间名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={form.active}
                  onChange={(e) => setForm({ ...form, active: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={1}>有效</option>
                  <option value={0}>无效</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="确认删除"
        message={`确定要删除房间 "${pendingDelete?.name}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
        type="danger"
        loading={loading}
      />
    </>
  );
};

export default RoomManagement;


