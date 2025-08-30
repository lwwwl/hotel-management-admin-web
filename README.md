# 酒店管理系统管理后台

这是一个基于React + TypeScript + Tailwind CSS构建的酒店管理系统管理后台Web应用。

## 功能特性

- 🏨 **运营仪表板** - 实时监控酒店客服系统运营状态，包括KPI指标和告警信息
- ⚙️ **菜单配置** - 配置客人聊天界面的快捷菜单，支持拖拽排序和多语言
- 👥 **用户管理** - 管理员工账号、角色权限和部门结构
- 🔧 **系统设置** - 配置系统集成、Bot通知、邮件服务、翻译服务等

## 技术栈

- **前端框架**: React 19 + TypeScript
- **路由管理**: React Router v6
- **样式框架**: Tailwind CSS
- **图标库**: Lucide React
- **构建工具**: Vite
- **代码规范**: ESLint

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── Layout.tsx      # 主布局组件
│   └── Sidebar.tsx     # 侧边栏导航组件
├── pages/              # 页面组件
│   ├── Dashboard.tsx   # 仪表板页面
│   ├── MenuConfig.tsx  # 菜单配置页面
│   ├── UserManagement.tsx # 用户管理页面
│   └── SystemSettings.tsx # 系统设置页面
├── router/             # 路由配置
│   └── index.tsx       # 路由定义
├── App.tsx             # 应用入口
└── index.css           # 全局样式
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 页面说明

### 1. 运营仪表板 (`/`)
- 显示关键KPI指标：今日会话、活跃工单、平均响应时间、SLA达成率
- 实时告警列表，支持刷新和筛选
- 响应式设计，支持不同屏幕尺寸

### 2. 菜单配置 (`/menu-config`)
- 拖拽式菜单排序
- 多语言支持（中文、英文、日文）
- 图标选择和快捷消息模板配置
- 实时预览功能

### 3. 用户管理 (`/user-management`)
- 用户列表、角色管理、部门管理三个标签页
- 支持搜索、筛选和分页
- 用户状态管理（启用/禁用）
- 角色权限分配

### 4. 系统设置 (`/system-settings`)
- 常规设置：酒店名称、时区、语言等
- PMS集成配置
- Bot通知配置（WhatsApp、Line）
- 邮件服务配置
- 翻译服务配置
- 安全设置
- 备份恢复

## 设计特点

- **响应式设计**: 支持桌面端和移动端
- **现代化UI**: 使用Tailwind CSS构建美观的界面
- **组件化架构**: 高度可复用的组件设计
- **TypeScript支持**: 完整的类型定义和类型安全
- **路由扩展性**: 为未来菜单扩展预留了架构空间

## 开发说明

### 添加新页面
1. 在`src/pages/`目录下创建新的页面组件
2. 在`src/router/index.tsx`中添加路由配置
3. 在`src/components/Sidebar.tsx`中添加导航菜单项

### 样式定制
- 使用Tailwind CSS类名进行样式定制
- 在`tailwind.config.js`中扩展主题配置
- 在`src/index.css`中添加全局样式

### 状态管理
- 当前使用React Hooks进行本地状态管理
- 可根据需要集成Redux、Zustand等状态管理库

## 注意事项

- 当前版本使用Mock数据进行演示，实际使用时需要替换为真实的API调用
- 所有文本和提示信息使用中文，符合国内用户使用习惯
- 组件设计考虑了未来的权限控制和动态菜单需求

## 许可证

MIT License
