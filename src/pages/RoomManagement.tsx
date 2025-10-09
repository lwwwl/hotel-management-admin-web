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
      // 创建一个新的、更大的canvas来容纳二维码和文字
      const newCanvas = document.createElement('canvas');
      const ctx = newCanvas.getContext('2d');
      if (!ctx) return;
      
      const padding = 10;
      const fontSize = 16;
      newCanvas.width = canvas.width + 2 * padding;
      newCanvas.height = canvas.height + 2 * padding + fontSize + 5; // 5 for spacing
      
      // 填充白色背景
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
      
      // 绘制二维码
      ctx.drawImage(canvas, padding, padding);
      
      // 绘制文字
      ctx.fillStyle = '#000';
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(qrRoom.name, newCanvas.width / 2, canvas.height + padding + fontSize);
      
      newCanvas.toBlob((blob) => {
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
                requestAnimationFrame(() => {
                  setTimeout(() => {
                     // 创建一个新的、更大的canvas来容纳二维码和文字
                    const newCanvas = document.createElement('canvas');
                    const ctx = newCanvas.getContext('2d');
                    if (!ctx) {
                      resolve(null);
                      return;
                    }
                    
                    const padding = 10;
                    const fontSize = 16;
                    newCanvas.width = canvas.width + 2 * padding;
                    newCanvas.height = canvas.height + 2 * padding + fontSize + 5; // 5 for spacing
                    
                    // 填充白色背景
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
                    
                    // 绘制二维码
                    ctx.drawImage(canvas, padding, padding);
                    
                    // 绘制文字
                    ctx.fillStyle = '#000';
                    ctx.font = `${fontSize}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(room.name, newCanvas.width / 2, canvas.height + padding + fontSize);

                    newCanvas.toBlob(resolve);
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
    <div className="h-full flex flex-col">
      {error && (
        <div className="flex-shrink-0 mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex-shrink-0 text-left mb-8">
        <h1 className="text-3xl font-bold text-gray-800">房型管理</h1>
        <p className="mt-2 text-gray-600">管理酒店的所有房型信息、价格和可用状态。</p>
      </div>

      {/* 筛选栏 */}
      <div className="flex-shrink-0 bg-white rounded-lg shadow p-4 mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
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
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
          <Plus className="mr-2" size={16} /> 新增房间
        </button>
      </div>
      
      {/* 批量操作 */}
      <div className="flex-shrink-0 bg-white rounded-lg shadow p-4 mb-4 flex items-center space-x-3">
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

      {/* Room List */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {loading && rooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bed className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4">没有找到匹配的房型。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRooms.map((room) => (
                <div key={room.id} className={`relative border rounded-lg hover:shadow-md transition-shadow text-left ${selectedRoomIds.includes(room.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                  {/* Clickable Area for Selection */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleRoomSelection(room.id)}
                  >
                    {/* Custom Checkbox */}
                    <label htmlFor={`room-checkbox-${room.id}`} className="absolute top-2 right-2 p-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        id={`room-checkbox-${room.id}`}
                        type="checkbox"
                        checked={selectedRoomIds.includes(room.id)}
                        onChange={() => toggleRoomSelection(room.id)}
                        className="sr-only" // Visually hide the native checkbox
                      />
                      <span className={`h-6 w-6 flex items-center justify-center rounded-md border-2 transition-colors ${
                        selectedRoomIds.includes(room.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {selectedRoomIds.includes(room.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </span>
                    </label>

                    <div className="flex items-center justify-between mb-3 pr-8"> {/* Add padding to prevent overlap with checkbox */}
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
                    </div>
                  </div>
                  {/* Action buttons at the bottom of the card */}
                  <div className="flex items-center justify-end space-x-1 px-4 py-2 border-t border-gray-100">
                      <button onClick={(e) => { e.stopPropagation(); openQrCode(room); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="二维码">
                          <QrCode size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(room); }} className="p-1 text-green-600 hover:bg-green-50 rounded" title="编辑">
                          <Edit size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); confirmDelete(room); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="删除">
                          <Trash2 size={16} />
                      </button>
                  </div>
                </div>
              ))}
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
              <p className="mt-2 text-center font-semibold">{qrRoom.name}</p>
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
    </div>
  );
};

export default RoomManagement;


