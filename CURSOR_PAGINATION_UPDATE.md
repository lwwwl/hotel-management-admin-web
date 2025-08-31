# 游标分页功能更新说明

## 概述

根据UserManagementAPI.json契约的调整，本次更新实现了游标分页功能，并调整了时间字段类型为long类型（时间戳）。

## 主要更新内容

### 1. 游标分页实现

#### 分页机制
- **第一页请求**: `lastCreateTime` 和 `lastUserId` 字段传 `null`
- **后续页面**: 传入上一页最后一行数据的 `lastCreateTime` 和 `lastUserId`
- **分页状态管理**: 前端维护分页状态，支持无限滚动加载

#### 分页状态
```typescript
const [hasMore, setHasMore] = useState(false);
const [lastCreateTime, setLastCreateTime] = useState<number | null>(null);
const [lastUserId, setLastUserId] = useState<number | null>(null);
const [pageSize] = useState(20);
```

### 2. 时间字段类型调整

#### 请求参数
- `lastCreateTime`: `number | null` (时间戳格式)
- 第一页传 `null`，后续页面传上一页最后记录的时间戳

#### 响应数据
- `lastCreateTime`: `number` (时间戳格式)
- 用于下次分页请求的游标

### 3. 搜索和筛选功能增强

#### 搜索功能
- 支持关键词搜索（用户名、姓名、工号）
- 回车键触发搜索
- 搜索时自动重置分页状态

#### 筛选功能
- 部门筛选：根据部门名称筛选用户
- 状态筛选：启用/禁用状态筛选
- 筛选时自动重置分页状态

#### 搜索参数构建
```typescript
const buildSearchParams = () => {
  const params = {
    size: pageSize,
    lastCreateTime: null,
    lastUserId: null,
    keyword?: string,      // 搜索关键词
    deptId?: number,       // 部门ID
    active?: number        // 用户状态（1-激活，0-锁定）
  };
  return params;
};
```

### 4. 用户体验优化

#### 加载状态
- 首次加载显示加载动画
- 加载更多时不显示全屏加载动画
- 按钮状态管理，防止重复操作

#### 分页控制
- 自动检测是否有更多数据
- 显示"加载更多"按钮
- 支持无限滚动加载

## 技术实现细节

### 1. API调用流程

```typescript
// 首次加载或搜索/筛选
const loadUsers = async (reset: boolean = true) => {
  if (reset) {
    setLastCreateTime(null);
    setLastUserId(null);
    setUsers([]);
  }
  
  const searchParams = reset ? buildSearchParams() : {
    size: pageSize,
    lastCreateTime: lastCreateTime,
    lastUserId: lastUserId
  };
  
  const response = await userApi.searchUsers(searchParams);
  // 处理响应...
};

// 加载更多
const loadMoreUsers = async () => {
  if (!hasMore || loading) return;
  await loadUsers(false);
};
```

### 2. 状态管理

- **用户列表**: 支持追加模式，避免重复加载
- **分页状态**: 维护游标信息，支持连续分页
- **加载状态**: 区分首次加载和加载更多
- **错误处理**: 统一的错误处理和用户提示

### 3. 数据转换

- 保持API响应数据结构不变
- 前端组件使用统一的User类型
- 支持模拟数据降级处理

## 使用说明

### 1. 基本分页

```typescript
// 首次加载
useEffect(() => {
  loadUsers(true);
}, []);

// 加载更多
<button onClick={loadMoreUsers}>加载更多</button>
```

### 2. 搜索和筛选

```typescript
// 搜索
<input 
  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

// 筛选
<select onChange={(e) => setFilterDepartment(e.target.value)}>
  <option value="">所有部门</option>
  {departments.map(dept => (
    <option key={dept.id} value={dept.name}>{dept.name}</option>
  ))}
</select>
```

### 3. 分页状态监控

```typescript
// 检查是否有更多数据
{hasMore && (
  <div className="mt-6 text-center">
    <button onClick={loadMoreUsers}>
      {loading ? '加载中...' : '加载更多'}
    </button>
  </div>
)}
```

## 注意事项

1. **时间戳格式**: 所有时间相关字段使用毫秒时间戳
2. **分页重置**: 搜索或筛选时会自动重置分页状态
3. **状态同步**: 分页状态与用户列表状态保持同步
4. **错误处理**: API失败时自动降级到模拟数据
5. **性能优化**: 避免重复加载，支持增量更新

## 测试建议

1. **分页功能**: 测试多页数据的加载和显示
2. **搜索功能**: 测试关键词搜索和结果分页
3. **筛选功能**: 测试不同筛选条件的组合
4. **状态管理**: 测试分页状态的正确性
5. **错误处理**: 测试API失败时的降级处理
6. **用户体验**: 测试加载状态和交互反馈

## 后续优化

1. **虚拟滚动**: 对于大量数据，可以考虑实现虚拟滚动
2. **缓存机制**: 添加请求结果缓存，提升性能
3. **预加载**: 实现智能预加载，提升用户体验
4. **搜索建议**: 添加搜索历史和建议功能
5. **高级筛选**: 支持更复杂的筛选条件组合
