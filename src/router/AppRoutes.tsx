import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import MenuConfig from '../pages/MenuConfig';
import UserManagement from '../pages/UserManagement';
import DeptManagement from '../pages/DeptManagement';
import RoleManagement from '../pages/RoleManagement';
import SystemSettings from '../pages/SystemSettings';
import RoomManagement from '../pages/RoomManagement';
import UserProfile from '../pages/UserProfile';
import { useAppContext } from '../components/AppContext';

const componentMap: { [key: string]: React.ComponentType } = {
    'Dashboard': Dashboard,
    'MenuConfig': MenuConfig,
    'UserManagement': UserManagement,
    'DeptManagement': DeptManagement,
    'RoleManagement': RoleManagement,
    'SystemSettings': SystemSettings,
    'RoomManagement': RoomManagement,
    'UserProfile': UserProfile,
};

const AppRoutes = () => {
    const { userInfo, routers, loading } = useAppContext();

    if (loading) {
        return (
            <Layout>
                <div>Loading...</div>
            </Layout>
        );
    }

    if (!userInfo) {
        return (
            <Layout>
                <div>Error loading user information.</div>
            </Layout>
        );
    }
    
    const userPermissions = new Set(userInfo.permissions);
    
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                {/* Dynamically generated routes */}
                {routers
                    .filter(route => userPermissions.has(route.perms) && route.active)
                    .map(route => {
                        const Component = componentMap[route.component];
                        if (!Component) return null;

                        // Handle index route separately
                        if (route.path === '/') {
                            return <Route key="index" index element={<Component />} />;
                        }

                        const routePath = route.path.startsWith('/') ? route.path.substring(1) : route.path;
                        return <Route key={routePath} path={routePath} element={<Component />} />;
                    })}

                {/* Manually add the user profile route, as it's not part of the main menu */}
                <Route path="/profile" element={<UserProfile />} />
                
                {/* Optional: Add a catch-all 404 route within the layout */}
                <Route path="*" element={<div>Page Not Found</div>} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
