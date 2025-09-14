# 用户管理模块 API 集成说明

## 概述

本模块已成功集成了酒店管理系统的用户管理相关接口，实现了完整的用户CRUD操作。

## 已集成的接口

### 1. 用户详情查询
- **接口**: `POST /user/detail`
- **功能**: 根据用户ID获取用户详细信息
- **请求头**: `X-Id-UserId: 1`

### 2. 用户创建
- **接口**: `POST /user/create`
- **功能**: 创建新用户
- **请求头**: `X-Id-UserId: 1`

### 3. 用户信息更新
- **接口**: `POST /user/update`
- **功能**: 更新指定用户信息
- **请求头**: `X-Id-UserId: 1`

### 4. 用户删除
- **接口**: `POST /user/delete`
- **功能**: 删除指定用户
- **请求头**: `X-Id-UserId: 1`

### 5. 用户锁定/解锁
- **接口**: `POST /user/lock`
- **功能**: 切换用户锁定状态
- **请求头**: `X-Id-UserId: 1`

### 6. 用户搜索
- **接口**: `POST /user/search`
- **功能**: 根据条件搜索用户，支持分页
- **请求头**: `X-Id-UserId: 1`

## 文件结构

```
src/
├── api/
│   ├── axiosConfig.ts      # Axios配置，包含请求拦截器
│   ├── types.ts            # API类型定义
│   ├── userApi.ts          # 用户管理API接口
│   └── index.ts            # API统一导出
├── utils/
│   └── userDataTransform.ts # 数据转换工具
└── pages/
    └── UserManagement.tsx  # 用户管理页面组件
```

## 主要特性

### 1. 自动请求头注入
- 所有API请求自动添加 `X-Id-UserId: 1` 请求头
- 通过axios拦截器实现，无需手动设置

### 2. 错误处理
- 全局错误拦截和处理
- 用户友好的错误提示
- API失败时的降级处理（使用模拟数据）

### 3. 加载状态管理
- 统一的加载状态显示
- 防止重复操作
- 用户体验优化

### 4. 数据转换
- 后端字段与前端字段的映射
- 保持数据结构一致性
- 支持扩展和自定义

## 使用方法

### 1. 在组件中使用API

```typescript
import { userApi } from '../api';

// 搜索用户
const searchUsers = async () => {
  try {
    const response = await userApi.searchUsers({
      keyword: 'admin',
      size: 500
    });
    
    if (response.statusCode === 200) {
      // 处理成功响应
      console.log(response.data);
    }
  } catch (error) {
    // 处理错误
    console.error('API调用失败:', error);
  }
};
```

### 2. 错误处理

```typescript
// 组件中显示错误信息
{error && (
  <div className="error-message">
    {error}
    <button onClick={() => setError(null)}>关闭</button>
  </div>
)}
```

### 3. 加载状态

```typescript
// 在按钮上显示加载状态
<button disabled={loading}>
  {loading ? '加载中...' : '保存'}
</button>
```

## 配置说明

### 1. API基础URL
- 当前配置: `http://111.223.37.162:7788`
- 可在 `src/api/axiosConfig.ts` 中修改

### 2. 请求头配置
- 当前用户ID: `1` (硬编码)
- 可在 `src/api/axiosConfig.ts` 中修改

### 3. 超时设置
- 默认无超时限制
- 可在axios配置中添加timeout设置

## 注意事项

1. **依赖安装**: 需要安装 `axios` 依赖
   ```bash
   npm install axios
   ```

2. **类型安全**: 所有API调用都有完整的TypeScript类型支持

3. **错误降级**: 当API调用失败时，会自动使用模拟数据，确保页面正常显示

4. **状态管理**: 使用React hooks管理组件状态，包括加载状态和错误状态

## 扩展建议

1. **认证机制**: 可以添加JWT token支持
2. **请求缓存**: 可以添加请求结果缓存机制
3. **重试机制**: 可以添加失败重试逻辑
4. **离线支持**: 可以添加离线数据同步功能

## 测试

建议在以下场景下测试API集成：

1. 正常网络环境下的API调用
2. 网络延迟情况下的用户体验
3. 网络错误情况下的错误处理
4. 不同数据状态下的UI显示
5. 并发操作的处理
