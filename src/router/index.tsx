import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import MenuConfig from '../pages/MenuConfig';
import UserManagement from '../pages/UserManagement';
import DeptManagement from '../pages/DeptManagement';
import RoleManagement from '../pages/RoleManagement';
import SystemSettings from '../pages/SystemSettings';
import RoomManagement from '../pages/RoomManagement';

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
    id: 'room-management',
    name: '房间管理',
    path: '/room-management',
    icon: 'List',
    active: false
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
    id: 'dept-management',
    name: '部门管理',
    path: '/dept-management',
    icon: 'Building',
    active: false
  },
  {
    id: 'role-management',
    name: '角色管理',
    path: '/role-management',
    icon: 'Shield',
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
        path: 'dept-management',
        element: <DeptManagement />
      },
      {
        path: 'role-management',
        element: <RoleManagement />
      },
      {
        path: 'system-settings',
        element: <SystemSettings />
      }
      ,
      {
        path: 'room-management',
        element: <RoomManagement />
      }
    ]
  }
]);
