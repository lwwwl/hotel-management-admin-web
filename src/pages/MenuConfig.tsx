import { useState } from 'react';
import { 
  Eye, 
  Save, 
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

// Mock数据
const MOCK_MENU = [
  {
    id: 1,
    label: { zh: '客房服务', en: 'Room Service', ja: 'ルームサービス' },
    icon: 'Bed',
    template: '我需要客房服务',
    level: 1,
    children: []
  },
  {
    id: 2,
    label: { zh: '餐饮服务', en: 'Dining', ja: 'ダイニング' },
    icon: 'Utensils',
    template: '我想点餐',
    level: 1,
    children: []
  },
  {
    id: 3,
    label: { zh: '清洁服务', en: 'Housekeeping', ja: 'ハウスキーピング' },
    icon: 'Brush',
    template: '请打扫房间',
    level: 1,
    children: []
  },
  {
    id: 4,
    label: { zh: '其他帮助', en: 'Other Help', ja: 'その他' },
    icon: 'HelpCircle',
    template: '我需要其他帮助',
    level: 1,
    children: []
  }
];

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
  id: number;
  label: { zh: string; en: string; ja: string };
  icon: string;
  template: string;
  level: number;
  children: MenuItem[];
}

const MenuConfig = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([...MOCK_MENU]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewLang, setPreviewLang] = useState<'zh' | 'en' | 'ja'>('zh');

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
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newMenuItems = [...menuItems];
      const draggedItem = newMenuItems[draggedIndex];
      newMenuItems.splice(draggedIndex, 1);
      newMenuItems.splice(dropIndex, 0, draggedItem);
      setMenuItems(newMenuItems);
      setHasChanges(true);
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
  };

  // 保存编辑
  const saveItemEdit = () => {
    if (editingItem) {
      const index = menuItems.findIndex(item => item.id === editingItem.id);
      if (index !== -1) {
        const newMenuItems = [...menuItems];
        newMenuItems[index] = { ...editingItem };
        setMenuItems(newMenuItems);
        setHasChanges(true);
      }
      setEditingItem(null);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingItem(null);
  };

  // 删除菜单项
  const deleteItem = (id: number) => {
    if (confirm('确定要删除这个菜单项吗？')) {
      setMenuItems(menuItems.filter(item => item.id !== id));
      setHasChanges(true);
    }
  };

  // 添加新菜单项
  const addNewItem = () => {
    const newItem: MenuItem = {
      id: Date.now(),
      label: { zh: '新菜单项', en: 'New Item', ja: '新しい項目' },
      icon: 'HelpCircle',
      template: '',
      level: 1,
      children: []
    };
    setMenuItems([...menuItems, newItem]);
    setEditingItem(newItem);
    setHasChanges(true);
  };

  // 保存菜单配置
  const saveMenu = () => {
    console.log('保存菜单配置');
    // 模拟 API 调用: PUT /config/menu
    console.log('PUT /config/menu', menuItems);
    setHasChanges(false);
    alert('菜单配置已保存！');
  };

  // 预览菜单
  const previewMenu = () => {
    console.log('预览菜单');
    alert('预览功能正在开发中...');
  };

  return (
    <>
      {/* 顶部标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">菜单配置</h2>
          <p className="text-gray-600 mt-2">配置客人聊天界面的快捷菜单</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={previewMenu}
            data-testid="preview-button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
          >
            <Eye className="mr-2" size={16} />
            预览
          </button>
          <button
            onClick={saveMenu}
            data-testid="save-button"
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="mr-2" size={16} />
            保存配置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            onClick={() => deleteItem(item.id)}
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

        {/* 编辑面板 */}
        <div>
          {editingItem && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">编辑菜单项</h3>
              </div>
              <div className="p-6 space-y-4">
                {/* 图标选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图标</label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableIcons.map((icon) => {
                      const IconComponent = iconMap[icon as keyof typeof iconMap];
                      return (
                        <button
                          key={icon}
                          onClick={() => setEditingItem({ ...editingItem, icon })}
                          className={`p-3 border-2 rounded-lg hover:border-blue-400 transition-colors ${
                            editingItem.icon === icon ? 'bg-blue-100 border-blue-600' : 'bg-white border-gray-300'
                          }`}
                        >
                          {IconComponent && <IconComponent className="text-xl" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 多语言标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签文本</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingItem.label.zh}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        label: { ...editingItem.label, zh: e.target.value }
                      })}
                      placeholder="中文"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editingItem.label.en}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        label: { ...editingItem.label, en: e.target.value }
                      })}
                      placeholder="English"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editingItem.label.ja}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        label: { ...editingItem.label, ja: e.target.value }
                      })}
                      placeholder="日本語"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 模板消息 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">快捷消息模板</label>
                  <textarea
                    value={editingItem.template}
                    onChange={(e) => setEditingItem({ ...editingItem, template: e.target.value })}
                    rows={3}
                    placeholder="点击菜单时发送的消息内容"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3">
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
          )}

          {/* 语言切换预览 */}
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">语言预览</h3>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <button
                  onClick={() => setPreviewLang('zh')}
                  className={`w-full py-2 rounded-lg transition-colors ${
                    previewLang === 'zh' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  简体中文
                </button>
                <button
                  onClick={() => setPreviewLang('en')}
                  className={`w-full py-2 rounded-lg transition-colors ${
                    previewLang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setPreviewLang('ja')}
                  className={`w-full py-2 rounded-lg transition-colors ${
                    previewLang === 'ja' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  日本語
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuConfig;
