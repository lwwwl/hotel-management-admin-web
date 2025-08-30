import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import MenuConfig from '../pages/MenuConfig';
import UserManagement from '../pages/UserManagement';
import SystemSettings from '../pages/SystemSettings';

// 菜单配置数据
export const menuItems = [
  {
    id: 'dashboard',
    name: '仪表板',
    path: '/',
    icon: 'Dashboard',
    active: true
  },
  {
    id: 'menu-config',
    name: '菜单配置',
    path: '/menu-config',
    icon: 'List',
    active: false
  },
  {
    id: 'user-management',
    name: '用户管理',
    path: '/user-management',
    icon: 'Users',
    active: false
  },
  {
    id: 'system-settings',
    name: '系统设置',
    path: '/system-settings',
    icon: 'Settings',
    active: false
  }
];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'menu-config',
        element: <MenuConfig />
      },
      {
        path: 'user-management',
        element: <UserManagement />
      },
      {
        path: 'system-settings',
        element: <SystemSettings />
      }
    ]
  }
]);
