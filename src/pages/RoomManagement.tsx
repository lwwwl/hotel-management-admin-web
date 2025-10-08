import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Bed, CheckCircle2, XCircle, QrCode, Download, Copy, Trash, FileArchive } from 'lucide-react';
import { roomApi } from '../api/roomApi';
import type { HotelRoom } from '../api/types';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import ReactDOM from 'react-dom/client';

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

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrRoom, setQrRoom] = useState<HotelRoom | null>(null);

  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);

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
      console.error('Failed to load rooms:', e);
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

  const openQrCode = (room: HotelRoom) => {
    setQrRoom(room);
    setShowQrModal(true);
  };

  const downloadQrCode = () => {
    if (!qrRoom) return;
    const canvas = document.getElementById('room-qrcode-canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${qrRoom.name}.png`);
        }
      });
    }
  };

  const toggleRoomSelection = (roomId: number) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAllRooms = () => {
    setSelectedRoomIds(filteredRooms.map(r => r.id));
  };

  const deselectAllRooms = () => {
    setSelectedRoomIds([]);
  };

  const exportQrCodes = async () => {
    if (selectedRoomIds.length === 0) {
      showError('没有选择任何房间');
      return;
    }

    setExporting(true);
    const zip = new JSZip();
    const roomsToExport = rooms.filter(r => selectedRoomIds.includes(r.id));

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);
    const root = ReactDOM.createRoot(tempContainer);

    try {
      for (const room of roomsToExport) {
        const qrValue = `https://kefu.5ok.co/guest/?id=${room.id}&name=${room.name}`;
        const canvasPromise = new Promise<Blob | null>((resolve) => {
          const Component = () => {
            const qrRef = (canvas: HTMLCanvasElement | null) => {
              if (canvas) {
                // 等待下一个浏览器渲染周期，确保canvas，特别是logo图片，完全渲染后再转换为blob。
                requestAnimationFrame(() => {
                  // 添加一个最小化超时，给浏览器一个额外的时刻来渲染图片。
                  // 这有助于防止竞争条件，确保logo图片包含在blob中。
                  setTimeout(() => {
                    canvas.toBlob(resolve);
                  }, 50);
                });
              } else {
                resolve(null);
              }
            };
            return (
              <QRCodeCanvas
                ref={qrRef}
                value={qrValue}
                size={256}
                level="H"
                imageSettings={{ src: '/logo.png', height: 40, width: 40, excavate: true }}
              />
            );
          };
          root.render(<Component />);
        });

        const blob = await canvasPromise;
        if (blob) {
          zip.file(`${room.name}.png`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `房间二维码_${new Date().toISOString().slice(0, 10)}.zip`);
      showSuccess('二维码已开始导出');
      setSelectedRoomIds([]);
    } catch (err) {
      showError('导出失败', (err as Error).message);
    } finally {
      setExporting(false);
      root.unmount();
      document.body.removeChild(tempContainer);
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
          onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">全部状态</option>
          <option value="active">仅有效</option>
          <option value="inactive">仅无效</option>
        </select>
        <button onClick={() => { /* 前端过滤，无需请求 */ }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">搜索</button>
      </div>

      {/* 批量操作 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center space-x-3">
        <button
          onClick={selectAllRooms}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
        >
          <Copy size={14} className="mr-2" /> 全选
        </button>
        <button
          onClick={deselectAllRooms}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
        >
          <Trash size={14} className="mr-2" /> 取消选择
        </button>
        <button
          onClick={exportQrCodes}
          disabled={selectedRoomIds.length === 0 || exporting}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              导出中...
            </>
          ) : (
            <>
              <FileArchive size={14} className="mr-2" /> 批量导出二维码 ({selectedRoomIds.length})
            </>
          )}
        </button>
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
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-sm text-gray-600 border-b bg-gray-50">
                    <th className="px-2 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRoomIds.length > 0 && selectedRoomIds.length === filteredRooms.length}
                        onChange={(e) => e.target.checked ? selectAllRooms() : deselectAllRooms()}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium text-left">房间名称</th>
                    <th className="px-6 py-3 font-medium text-left">状态</th>
                    <th className="px-6 py-3 font-medium text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-800">
                  {filteredRooms.map((room) => (
                    <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 align-middle">
                      <td className="px-2 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room.id)}
                          onChange={() => toggleRoomSelection(room.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Bed className="text-blue-600 mr-4" size={20} />
                          <p className="font-semibold">{room.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center text-xs font-medium ${room.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {room.active ? (
                            <><CheckCircle2 className="mr-1.5" size={16} />有效</>
                          ) : (
                            <><XCircle className="mr-1.5" size={16} />无效</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <button onClick={() => openQrCode(room)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="二维码">
                            <QrCode size={16} />
                          </button>
                          <button onClick={() => openEdit(room)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="编辑">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => confirmDelete(room)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="删除">
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
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-left"
          >
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

      {/* 二维码弹窗 */}
      {showQrModal && qrRoom && (
        <div
          onClick={() => { setShowQrModal(false); setQrRoom(null); }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-xs p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{qrRoom.name}</h3>
            <div className="mb-4 p-4 border rounded-lg inline-block">
              <QRCodeCanvas
                id="room-qrcode-canvas"
                value={`https://kefu.5ok.co/guest/?id=${qrRoom.id}&name=${qrRoom.name}`}
                size={200}
                level="H"
                imageSettings={{
                  src: '/logo.png', // 假设public目录下有logo
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">扫描二维码进入客服页面</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => { setShowQrModal(false); setQrRoom(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 w-full"
              >
                关闭
              </button>
              <button
                onClick={downloadQrCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center w-full"
              >
                <Download size={16} className="mr-2" />
                下载
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomManagement;


