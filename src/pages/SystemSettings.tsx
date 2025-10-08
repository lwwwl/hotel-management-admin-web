import { useState } from 'react';
import { 
  Cog, 
  Database, 
  Bot, 
  Mail, 
  Languages, 
  Shield, 
  CloudDownload
} from 'lucide-react';


interface Settings {
  general: {
    hotelName: string;
    timezone: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
  };
  pms: {
    enabled: boolean;
    apiEndpoint: string;
    apiKey: string;
  };
  bot: {
    whatsapp: {
      enabled: boolean;
      token: string;
    };
    line: {
      enabled: boolean;
      channelSecret: string;
      accessToken: string;
    };
  };
  smtp: {
    host: string;
    port: number;
    encryption: string;
    username: string;
    password: string;
    fromEmail: string;
  };
  translation: {
    google: {
      enabled: boolean;
      apiKey: string;
    };
    openai: {
      enabled: boolean;
      apiKey: string;
    };
    monthlyLimit: number;
  };
  security: {
    sessionTimeout: number;
    minPasswordLength: number;
    requireMFA: boolean;
    ipWhitelist: boolean;
    allowedIPs: string;
  };
  backup: {
    autoBackup: boolean;
    frequency: string;
    retentionDays: number;
  };
}


const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState<'general' | 'pms' | 'bot' | 'smtp' | 'translation' | 'security' | 'backup'>('general');
  
  const [settings, setSettings] = useState<Settings>({
    general: {
      hotelName: '豪华国际酒店',
      timezone: 'Asia/Shanghai',
      defaultLanguage: 'zh-CN',
      maintenanceMode: false
    },
    pms: {
      enabled: true,
      apiEndpoint: 'https://pms.hotel.com/api',
      apiKey: ''
    },
    bot: {
      whatsapp: {
        enabled: false,
        token: ''
      },
      line: {
        enabled: false,
        channelSecret: '',
        accessToken: ''
      }
    },
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      encryption: 'tls',
      username: '',
      password: '',
      fromEmail: 'noreply@hotel.com'
    },
    translation: {
      google: {
        enabled: true,
        apiKey: ''
      },
      openai: {
        enabled: false,
        apiKey: ''
      },
      monthlyLimit: 500000
    },
    security: {
      sessionTimeout: 30,
      minPasswordLength: 8,
      requireMFA: false,
      ipWhitelist: false,
      allowedIPs: ''
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      retentionDays: 30
    }
  });

  // 保存设置
  const saveSettings = (section: keyof Settings) => {
    console.log(`保存${getSectionName(section)}设置:`, settings[section]);
    alert(`${getSectionName(section)}设置已保存！`);
  };

  // 获取设置分类名称
  const getSectionName = (section: string) => {
    const names: Record<string, string> = {
      'general': '常规',
      'pms': 'PMS集成',
      'bot': 'Bot配置',
      'smtp': '邮件服务',
      'translation': '翻译服务',
      'security': '安全',
      'backup': '备份'
    };
    return names[section] || section;
  };

  // 更新设置
  const updateSettings = (section: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };


  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 text-left mb-8">
        <h1 className="text-3xl font-bold text-gray-800">系统设置</h1>
        <p className="mt-2 text-gray-600">管理系统的各项配置参数。</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 overflow-y-auto text-left">
        {/* 左侧菜单 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow sticky top-0">
            <nav className="p-4">
              <button
                onClick={() => setActiveSection('general')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                  activeSection === 'general' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Cog className="mr-3" size={20} />
                常规设置
              </button>
              <button
                onClick={() => setActiveSection('pms')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                  activeSection === 'pms' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Database className="mr-3" size={20} />
                PMS集成
              </button>
              <button
                onClick={() => setActiveSection('bot')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                  activeSection === 'bot' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bot className="mr-3" size={20} />
                Bot配置
              </button>
              <button
                onClick={() => setActiveSection('smtp')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                  activeSection === 'smtp' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Mail className="mr-3" size={20} />
                邮件服务
              </button>
              <button
                onClick={() => setActiveSection('translation')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                  activeSection === 'translation' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Languages className="mr-3" size={20} />
                翻译服务
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                  activeSection === 'security' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="mr-3" size={20} />
                安全设置
              </button>
              <button
                onClick={() => setActiveSection('backup')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeSection === 'backup' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CloudDownload className="mr-3" size={20} />
                备份恢复
              </button>
            </nav>
          </div>
        </div>

        {/* 右侧设置内容 */}
        <div className="lg:col-span-2">
          {/* 常规设置 */}
          {activeSection === 'general' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">常规设置</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">酒店名称</label>
                  <input
                    type="text"
                    value={settings.general.hotelName}
                    onChange={(e) => updateSettings('general', 'hotelName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">系统时区</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general.maintenanceMode}
                      onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                      className="mr-2 rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">维护模式</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">启用后客人将无法访问系统</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => saveSettings('general')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存设置
                </button>
              </div>
            </div>
          )}

          {/* 其他设置内容将在后续添加 */}
          {activeSection !== 'general' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">{getSectionName(activeSection)}</h3>
              <p className="text-gray-600">此功能正在开发中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
