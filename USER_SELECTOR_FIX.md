# UserSelectorModal 死循环问题修复

## 问题描述
在打开用户选择弹窗时，出现了 `searchUser` API 的无限循环调用问题。

## 问题原因
在 `UserSelectorModal` 组件中，`loadUsers` 函数的 `useCallback` 依赖项包含了 `lastCreateTime` 和 `lastUserId` 状态：

```typescript
const loadUsers = useCallback(async (reset: boolean = true) => {
  // ... 函数内部会更新 lastCreateTime 和 lastUserId
}, [excludeUserIds, pageSize, lastCreateTime, lastUserId]); // 这里包含了会变化的状态
```

这导致了以下循环：
1. `loadUsers` 函数执行
2. 函数内部更新 `lastCreateTime` 和 `lastUserId` 状态
3. 状态更新导致 `loadUsers` 函数重新创建（因为依赖项变化）
4. 函数重新创建触发 `useEffect` 重新执行
5. 回到步骤1，形成无限循环

## 解决方案
使用 `useRef` 来存储分页状态，避免在 `useCallback` 依赖项中包含会变化的状态：

### 1. 使用 useRef 替代状态
```typescript
// 使用 ref 来避免闭包问题
const lastCreateTimeRef = useRef<number | null>(null);
const lastUserIdRef = useRef<number | null>(null);
```

### 2. 修改 loadUsers 函数
```typescript
const loadUsers = useCallback(async (reset: boolean = true) => {
  // 使用 ref 而不是状态
  if (reset) {
    lastCreateTimeRef.current = null;
    lastUserIdRef.current = null;
    setUsers([]);
  }
  
  const searchParams = reset ? {
    size: pageSize,
    lastCreateTime: null,
    lastUserId: null
  } : {
    size: pageSize,
    lastCreateTime: lastCreateTimeRef.current,
    lastUserId: lastUserIdRef.current
  };
  
  // ... API 调用和状态更新
  
  // 更新 ref 而不是状态
  if (filteredUsers.length > 0) {
    const lastUser = response.data.users[response.data.users.length - 1];
    lastCreateTimeRef.current = lastUser.createTime;
    lastUserIdRef.current = lastUser.userId;
  }
}, [excludeUserIds, pageSize]); // 移除了 lastCreateTime 和 lastUserId
```

### 3. 修复类型问题
同时修复了类型不匹配的问题：
- `UserSelectorModal` 的 `onConfirm` 回调现在使用内部的 `User` 类型
- 更新了部门管理页面中的类型处理

## 修复结果
- ✅ 解决了无限循环调用问题
- ✅ 保持了分页功能的正常工作
- ✅ 修复了类型错误
- ✅ 保持了组件的所有功能

## 测试验证
1. 打开部门管理页面
2. 点击"添加成员"按钮
3. 验证用户选择弹窗正常打开
4. 验证用户列表正常加载，没有无限循环
5. 验证搜索功能正常工作
6. 验证分页加载更多功能正常工作
7. 验证用户选择功能正常工作

## 经验总结
在使用 `useCallback` 时，需要注意：
1. 避免在依赖项中包含会在函数内部更新的状态
2. 对于不需要触发重新渲染的值，使用 `useRef` 而不是 `useState`
3. 仔细检查依赖项，确保不会导致意外的重新创建
