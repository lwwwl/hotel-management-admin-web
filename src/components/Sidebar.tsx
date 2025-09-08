import { useLocation, useNavigate } from 'react-router-dom';
import { Building, BarChart3, List, Users, Settings, Shield } from 'lucide-react';
import { menuItems } from '../router';

// 图标映射
const iconMap = {
  Dashboard: BarChart3,
  List: List,
  Users: Users,
  Building: Building,
  Shield: Shield,
  Settings: Settings
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Building className="mr-2 text-blue-600" size={24} />
          酒店管理系统
        </h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
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
    </aside>
  );
};

export default Sidebar;
