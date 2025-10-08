import { useState } from 'react';
import { 
  MessageSquare, 
  ClipboardList, 
  Clock, 
  Award, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Mock数据
const MOCK_ALERTS = [
  { id: 1, level: 'critical', time: '10:45', type: 'SLA违规', description: '房间305工单超时15分钟未处理', resolved: false },
  { id: 2, level: 'warning', time: '10:30', type: '响应延迟', description: 'Webhook响应时间超过3秒', resolved: true },
  { id: 3, level: 'info', time: '10:15', type: '翻译限额', description: '本月翻译字符使用已达80%', resolved: false },
  { id: 4, level: 'warning', time: '09:50', type: '并发高峰', description: '当前在线会话数达到85个', resolved: true },
  { id: 5, level: 'critical', time: '09:30', type: '服务异常', description: 'Kanboard API连接失败', resolved: true }
];

const Dashboard = () => {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  // KPI数据
  const kpi = {
    conversations: 156,
    activeTasks: 42,
    avgResponseTime: '2.3分钟',
    slaRate: 96.5
  };

  // 获取告警级别文本
  const getLevelText = (level: string) => {
    const levels: Record<string, string> = {
      'critical': '严重',
      'warning': '警告',
      'info': '信息'
    };
    return levels[level] || level;
  };

  // 筛选指标
  const filterBy = (metric: string) => {
    console.log('筛选指标:', metric);
    alert(`显示 ${metric} 详细数据`);
  };

  // 跳转到SLA
  const goToSLA = () => {
    console.log('跳转到 /admin/sla-board');
    alert('跳转到SLA面板');
  };

  // 刷新告警
  const refreshAlerts = () => {
    console.log('刷新告警列表');
    // 模拟 API 调用: GET /admin/metrics/summary
    setAlerts([...MOCK_ALERTS].sort(() => Math.random() - 0.5));
    alert('告警列表已刷新');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 text-left mb-8">
        <h1 className="text-3xl font-bold text-gray-800">数据看板</h1>
        <p className="mt-2 text-gray-600">实时概览酒店的核心运营指标。</p>
      </div>

      {/* KPI Cards */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 今日会话 */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => filterBy('conversations')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-blue-600 text-xl" size={24} />
            </div>
            <span className="text-sm text-green-600 font-medium flex items-center">
              <TrendingUp className="text-xs mr-1" size={12} />
              12.5%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 text-left">{kpi.conversations}</h3>
          <p className="text-sm text-gray-600 mt-1 text-left">今日会话</p>
        </div>

        {/* 活跃工单 */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => filterBy('tasks')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="text-orange-600 text-xl" size={24} />
            </div>
            <span className="text-sm text-red-600 font-medium flex items-center">
              <TrendingDown className="text-xs mr-1" size={12} />
              3.2%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 text-left">{kpi.activeTasks}</h3>
          <p className="text-sm text-gray-600 mt-1 text-left">活跃工单</p>
        </div>

        {/* 平均响应时间 */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => filterBy('response')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="text-green-600 text-xl" size={24} />
            </div>
            <span className="text-sm text-green-600 font-medium flex items-center">
              <TrendingUp className="text-xs mr-1" size={12} />
              优秀
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 text-left">{kpi.avgResponseTime}</h3>
          <p className="text-sm text-gray-600 mt-1 text-left">平均响应时间</p>
        </div>

        {/* SLA达成率 */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={goToSLA}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="text-purple-600 text-xl" size={24} />
            </div>
            <span className="text-sm text-gray-600 font-medium text-left">
              本月
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 text-left">{kpi.slaRate}%</h3>
          <p className="text-sm text-gray-600 mt-1 text-left">SLA达成率</p>
        </div>
      </div>

      {/* 最近告警 */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">最近告警</h3>
          <button
            onClick={refreshAlerts}
            data-testid="refresh-alerts"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <RefreshCw className="mr-1" size={16} />
            刷新
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">级别</th>
                  <th className="pb-3 font-medium">时间</th>
                  <th className="pb-3 font-medium">类型</th>
                  <th className="pb-3 font-medium">描述</th>
                  <th className="pb-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.level === 'critical' ? 'bg-red-100 text-red-600' :
                          alert.level === 'warning' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {getLevelText(alert.level)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{alert.time}</td>
                    <td className="py-3 text-gray-800">{alert.type}</td>
                    <td className="py-3 text-gray-800">{alert.description}</td>
                    <td className="py-3">
                      <span
                        className={`flex items-center text-sm ${
                          alert.resolved ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {alert.resolved ? (
                          <CheckCircle className="mr-1" size={16} />
                        ) : (
                          <AlertCircle className="mr-1" size={16} />
                        )}
                        <span>{alert.resolved ? '已解决' : '待处理'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
