import { useLocation, useNavigate } from 'react-router-dom';
import { Building, BarChart3, List, Users, Settings, Shield, MoreHorizontal, User, LogOut } from 'lucide-react';
import { useAppContext } from './AppContext';
import { useMemo, useState, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

// Icon mapping
const iconMap: { [key: string]: React.ElementType } = {
  Dashboard: BarChart3,
  List: List,
  Users: Users,
  Building: Building,
  Shield: Shield,
  Settings: Settings,
};

// A simple component to generate a text-based avatar
const UserAvatar = ({ displayName }: { displayName: string }) => {
  const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
  
  // Simple hash function to get a color from a string
  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 75%, 60%)`;
    return color;
  };

  const avatarColor = getColor(displayName || '');

  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ backgroundColor: avatarColor }}
    >
      {firstLetter}
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo, routers, loading } = useAppContext();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef, () => {
    if (isUserMenuOpen) {
      setIsUserMenuOpen(false);
    }
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const visibleMenuItems = useMemo(() => {
    if (!userInfo || !routers) {
      return [];
    }
    const userPermissions = new Set(userInfo.permissions);
    return routers
        .filter(route => userPermissions.has(route.perms) && route.active)
        .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [userInfo, routers]);

  if (loading) {
    return (
      <aside className="w-64 bg-white shadow-lg flex items-center justify-center">
        <div>Loading...</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col justify-between">
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Building className="mr-2 text-blue-600" size={24} />
            酒店管理系统
          </h1>
        </div>
        <nav className="mt-6">
          {visibleMenuItems.map((item) => {
            const IconComponent = iconMap[item.icon] || BarChart3;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="mr-3" size={20} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-gray-200">
        {userInfo?.user && (
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center p-2 rounded-md hover:bg-gray-100"
            >
              <UserAvatar displayName={userInfo.user.displayName} />
              <span className="font-semibold text-gray-700 ml-2 text-sm">{userInfo.user.displayName}</span>
              <MoreHorizontal className="ml-auto text-gray-500" size={18} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute bottom-full mb-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <User size={16} className="mr-2" />
                  查看详情
                </button>
                <button 
                  onClick={() => { window.location.href = 'https://kefu.5ok.co/logout?rd=https://kefu.5ok.co/admin/'; }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  登出
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
