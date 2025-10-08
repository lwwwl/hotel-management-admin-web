import { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Bed,
  Utensils,
  Brush,
  HelpCircle,
  Bell,
  Car,
  Wifi,
  Phone
} from 'lucide-react';

import { quickMenuApi } from '../api/quickMenuApi';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import type { QuickMenuItemBO, QuickMenuContent, QuickMenuOrderItem } from '../api/types';

// 图标映射
const iconMap = {
  Bed: Bed,
  Utensils: Utensils,
  Brush: Brush,
  HelpCircle: HelpCircle,
  Bell: Bell,
  Car: Car,
  Wifi: Wifi,
  Phone: Phone
};

// 可用图标列表
const availableIcons = [
  'Bed',
  'Utensils', 
  'Brush',
  'HelpCircle',
  'Bell',
  'Car',
  'Wifi',
  'Phone'
];

interface MenuItem {
  id: number; // 后端ID，新增项使用负数临时ID
  label: { zh: string; en: string; ja: string };
  icon: string;
  message: { zh: string; en: string; ja: string };
  level: number;
  children: MenuItem[];
}

const MenuConfig = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLang, setEditLang] = useState<'zh' | 'en' | 'ja'>('zh');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailLang, setDetailLang] = useState<'zh' | 'en' | 'ja'>('zh');
  const { showSuccess, showError } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // 加载后端数据
  useEffect(() => {
    const load = async () => {
      try {
        const res = await quickMenuApi.list();
        if (res.statusCode === 200) {
          const list = (res.data as QuickMenuItemBO[]).map((bo) => {
            let content: QuickMenuContent | null = null;
            try {
              content = bo.content ? JSON.parse(bo.content) : null;
            } catch (_) {
              content = null;
            }
            const label = content?.name || { zh: '', en: '', ja: '' };
            const message = content?.message || { zh: '', en: '', ja: '' };
            const item: MenuItem = {
              id: bo.id,
              icon: bo.icon || 'HelpCircle',
              label,
              message,
              level: 1,
              children: []
            };
            return item;
          });
          setMenuItems(list);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.currentTarget.classList.add('opacity-50');
  };

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };

  // 处理拖拽放置
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newMenuItems = [...menuItems];
      const draggedItem = newMenuItems[draggedIndex];
      newMenuItems.splice(draggedIndex, 1);
      newMenuItems.splice(dropIndex, 0, draggedItem);
      setMenuItems(newMenuItems);

      // 构造排序并保存
      try {
        const orders: QuickMenuOrderItem[] = newMenuItems
          .filter(i => i.id > 0) // 仅已有后端ID的项
          .map((item, idx) => ({ id: item.id, sortOrder: idx }));
        const res = await quickMenuApi.saveOrder(orders);
        if (res.statusCode === 200 && res.data) {
          showSuccess('排序已更新');
        }
      } catch (err) {
        console.error('保存排序失败', err);
      }
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedIndex(null);
  };

  // 编辑菜单项
  const editItem = (item: MenuItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setEditLang('zh');
    setIsEditModalOpen(true);
  };

  // 保存编辑（直接调用后端接口）
  const saveItemEdit = async () => {
    if (!editingItem) return;
    try {
      const isCreate = editingItem.id <= 0;
      const content: QuickMenuContent = {
        name: { ...editingItem.label },
        message: { ...editingItem.message }
      };

      if (isCreate) {
        const res = await quickMenuApi.create({ icon: editingItem.icon, content: JSON.stringify(content) });
        if (res.statusCode !== 200) throw new Error('create failed');
      } else {
        const res = await quickMenuApi.update({ id: editingItem.id, icon: editingItem.icon, content: JSON.stringify(content) });
        if (res.statusCode !== 200) throw new Error('update failed');
      }

      // 刷新列表
      const listRes = await quickMenuApi.list();
      if (listRes.statusCode === 200) {
        const list = (listRes.data as QuickMenuItemBO[]).map((bo) => {
          let parsed: QuickMenuContent | null = null;
          try { parsed = bo.content ? JSON.parse(bo.content) : null; } catch { parsed = null; }
          const label = parsed?.name || { zh: '', en: '', ja: '' };
          const message = parsed?.message || { zh: '', en: '', ja: '' };
          const item: MenuItem = { id: bo.id, icon: bo.icon || 'HelpCircle', label, message, level: 1, children: [] };
          return item;
        });
        setMenuItems(list);
      }

      setEditingItem(null);
      setIsEditModalOpen(false);
      showSuccess('快捷菜单已保存');
    } catch (e) {
      console.error(e);
      showError('保存失败');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingItem(null);
    setIsEditModalOpen(false);
  };

  // 删除菜单项（使用确认弹窗）
  const requestDeleteItem = (item: MenuItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const cancelDeleteItem = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const res = await quickMenuApi.delete({ id: itemToDelete.id });
      if (res.statusCode === 200 && res.data) {
        // 刷新列表
        const listRes = await quickMenuApi.list();
        if (listRes.statusCode === 200) {
          const list = (listRes.data as QuickMenuItemBO[]).map((bo) => {
            let parsed: QuickMenuContent | null = null;
            try { parsed = bo.content ? JSON.parse(bo.content) : null; } catch { parsed = null; }
            const label = parsed?.name || { zh: '', en: '', ja: '' };
            const message = parsed?.message || { zh: '', en: '', ja: '' };
            return { id: bo.id, icon: bo.icon || 'HelpCircle', label, message, level: 1, children: [] } as MenuItem;
          });
          setMenuItems(list);
        }
        if (selectedItem && selectedItem.id === itemToDelete.id) {
          setSelectedItem(null);
        }
        showSuccess('已删除快捷菜单');
      } else {
        showError('删除失败');
      }
    } catch (e) {
      console.error(e);
      showError('删除失败');
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // 添加新菜单项（仅弹窗，不立即插入）
  const addNewItem = () => {
    const newItem: MenuItem = {
      id: -Date.now(), // 负数表示临时ID
      label: { zh: '新菜单项', en: 'New Item', ja: '新しい項目' },
      icon: 'HelpCircle',
      message: { zh: '', en: '', ja: '' },
      level: 1,
      children: []
    };
    setEditingItem(newItem);
    setEditLang('zh');
    setIsEditModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 text-left mb-8">
        <h1 className="text-3xl font-bold text-gray-800">菜单配置</h1>
        <p className="mt-2 text-gray-600">管理系统的导航菜单、权限和可见性。</p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto text-left items-start">
        {/* 菜单树结构 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">菜单结构</h3>
              <p className="text-sm text-gray-600 mt-1">拖拽调整菜单顺序，点击编辑内容</p>
            </div>
            <div className="p-6">
              {/* 菜单项列表 */}
              <div className="space-y-2">
                {menuItems.map((item, index) => {
                  const IconComponent = iconMap[item.icon as keyof typeof iconMap];
                  
                  return (
                    <div
                      key={item.id}
                      data-id={item.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={async () => {
                        // 选中并尝试加载详情
                        setSelectedItem(item);
                        try {
                          const res = await quickMenuApi.detail(item.id);
                          if (res.statusCode === 200 && res.data) {
                            const bo = res.data as QuickMenuItemBO;
                            let content: QuickMenuContent | null = null;
                            try { content = bo.content ? JSON.parse(bo.content) : null; } catch { content = null; }
                            const label = content?.name || { zh: '', en: '', ja: '' };
                            const message = content?.message || { zh: '', en: '', ja: '' };
                            setSelectedItem({ id: bo.id, icon: bo.icon || 'HelpCircle', label, message, level: 1, children: [] });
                          }
                        } catch {
                          // ignore, 保持列表数据
                        }
                      }}
                      className={`bg-gray-50 rounded-lg p-4 cursor-move hover:bg-gray-100 transition-colors ${
                        item.level > 1 ? 'ml-8' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <GripVertical className="text-gray-400 mr-3" size={16} />
                          {IconComponent && <IconComponent className="text-gray-600 mr-3" size={16} />}
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{item.label.zh}</span>
                            <span className="text-sm text-gray-500 ml-2">({item.label.en})</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editItem(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => requestDeleteItem(item)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* 子菜单 */}
                      {item.children && item.children.length > 0 && (
                        <div className="mt-3 ml-6 space-y-2">
                          {item.children.map((child) => (
                            <div key={child.id} className="bg-white rounded p-3 flex items-center justify-between">
                              <span className="text-sm text-gray-700 text-left">{child.label.zh}</span>
                              <div className="flex items-center space-x-1">
                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded text-sm">
                                  <Edit size={14} />
                                </button>
                                <button className="p-1 text-red-600 hover:bg-red-50 rounded text-sm">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 添加新菜单项 */}
              <button
                onClick={addNewItem}
                data-testid="add-menu-item"
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center"
              >
                <Plus className="mr-2" size={16} />
                添加菜单项
              </button>
            </div>
          </div>
        </div>

        {/* 右侧详情（常驻） */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow sticky top-0">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">菜单详情</h3>
            </div>
            <div className="p-6 space-y-5">
              {!selectedItem ? (
                <div className="text-center text-gray-500 py-12">
                  请选择左侧的一个菜单项查看详情
                </div>
              ) : (
                <>
                  {/* 标题与图标 */}
                  <div className="flex items-center space-x-3">
                    {(() => { const Icon = iconMap[selectedItem.icon as keyof typeof iconMap]; return Icon ? <Icon className="text-gray-700" /> : null; })()}
                    <div>
                      <div className="text-gray-800 font-medium">{selectedItem.label.zh || '未命名'}</div>
                      <div className="text-gray-400 text-sm">{selectedItem.label.en}</div>
                    </div>
                  </div>

                  {/* 语言切换 */}
                  <div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['zh','en','ja'] as const).map(lang => (
                        <button
                          key={lang}
                          onClick={() => setDetailLang(lang)}
                          className={`py-2 rounded-lg transition-colors ${detailLang === lang ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          {lang === 'zh' ? '简体中文' : lang === 'en' ? 'English' : '日本語'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 名称与消息卡片化展示 */}
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg">
                      <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-500">名称</div>
                      <div className="px-4 py-3 text-gray-800 break-words min-h-[28px]">{selectedItem.label[detailLang] || '—'}</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg">
                      <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-500">消息</div>
                      <div className="px-4 py-3 text-gray-800 whitespace-pre-wrap break-words min-h-[56px]">{selectedItem.message[detailLang] || '—'}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 text-left">
            <h2 className="text-2xl font-bold mb-6">编辑菜单</h2>
            <div className="p-6 space-y-5">
              {/* 图标选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图标</label>
                <div className="grid grid-cols-8 gap-2">
                  {availableIcons.map((icon) => {
                    const IconComponent = iconMap[icon as keyof typeof iconMap];
                    return (
                      <button
                        key={icon}
                        onClick={() => setEditingItem(prev => prev ? { ...prev, icon } : prev)}
                        className={`p-3 border-2 rounded-lg hover:border-blue-400 transition-colors ${
                          editingItem!.icon === icon ? 'bg-blue-100 border-blue-600' : 'bg-white border-gray-300'
                        }`}
                        title={icon}
                      >
                        {IconComponent && <IconComponent className="text-xl" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 多语言切换按钮 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">编辑语言</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['zh','en','ja'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setEditLang(lang)}
                      className={`py-2 rounded-lg transition-colors ${editLang === lang ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {lang === 'zh' ? '简体中文' : lang === 'en' ? 'English' : '日本語'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 当前语言的名称与消息 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">名称（{editLang === 'zh' ? '中文' : editLang === 'en' ? 'English' : '日本語'}）</label>
                  <input
                    type="text"
                    value={editingItem!.label[editLang]}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, label: { ...prev.label, [editLang]: e.target.value } } : prev)}
                    placeholder={editLang === 'zh' ? '中文' : editLang === 'en' ? 'English' : '日本語'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">消息（{editLang === 'zh' ? '中文' : editLang === 'en' ? 'English' : '日本語'}）</label>
                  <textarea
                    value={editingItem!.message[editLang]}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, message: { ...prev.message, [editLang]: e.target.value } } : prev)}
                    rows={4}
                    placeholder={editLang === 'zh' ? '中文消息' : editLang === 'en' ? 'English message' : '日本語のメッセージ'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={saveItemEdit}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 固定详情已移至右侧常驻栏位 */}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除菜单 "${itemToDelete?.label.zh || ''}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteItem}
        onCancel={cancelDeleteItem}
        type="danger"
      />
    </div>
  );
};

export default MenuConfig;
