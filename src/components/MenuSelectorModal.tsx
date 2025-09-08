import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { menuApi } from '../api/menuApi';
import type { MenuListItem } from '../api/types';

interface MenuSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selected: MenuListItem[]) => void;
  initialSelectedIds?: number[];
}

const MenuSelectorModal: React.FC<MenuSelectorModalProps> = ({ isOpen, onClose, onConfirm, initialSelectedIds = [] }) => {
  const [menus, setMenus] = useState<MenuListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialSelectedIds));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoading(true);
        const res = await menuApi.listMenus();
        if (res.statusCode === 200) {
          setMenus(res.data.menus);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    setSelectedIds(new Set(initialSelectedIds));
  }, [initialSelectedIds]);

  const toggle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const confirm = () => {
    const selected = menus.filter(m => selectedIds.has(m.menuId));
    onConfirm(selected);
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <div className="w-6" />;
    const Cmp = (Icons as any)[iconName];
    return Cmp ? <Cmp className="w-4 h-4 text-gray-600" /> : <div className="w-6" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">选择菜单</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500">加载中...</div>
          ) : (
            <div className="space-y-2">
              {menus.map(menu => (
                <label key={menu.menuId} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(menu.menuId)}
                    onChange={() => toggle(menu.menuId)}
                  />
                  <div className="w-6 flex items-center justify-center">{renderIcon(menu.icon)}</div>
                  <span className="text-gray-900">{menu.menuName}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">取消</button>
          <button onClick={confirm} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">更新菜单</button>
        </div>
      </div>
    </div>
  );
};

export default MenuSelectorModal;


