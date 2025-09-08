# 用户选择组件 - 当前部门成员支持

## 功能概述
在部门管理中选择领导时，允许选择当前部门的成员作为部门领导，解决了"用户已加入部门但就是当前部门"的场景需求。

## 问题背景
之前的逻辑是：如果用户已经加入任何部门，就不能被选择。
但在选择部门领导的场景中，如果用户已经加入的部门就是当前正在编辑的部门，那么该用户应该可以被选为领导。

## 解决方案

### 1. 新增组件参数

#### UserSelectorModalProps 接口扩展
```typescript
interface UserSelectorModalProps {
  // ... 原有参数
  allowCurrentDeptMembers?: boolean; // 是否允许选择当前部门的成员（用于选择领导场景）
  currentDeptId?: number; // 当前部门ID（用于判断是否为当前部门成员）
}
```

#### 参数说明
- `allowCurrentDeptMembers`: 控制是否允许选择当前部门成员
- `currentDeptId`: 当前部门ID，用于判断用户是否为当前部门成员

### 2. 选择逻辑优化

#### 用户选择验证
```typescript
const toggleUserSelection = (user: User) => {
  const hasDepartment = user.departmentId && user.departmentId > 0;
  
  // 如果允许选择当前部门成员，且用户是当前部门的成员，则允许选择
  if (hasDepartment && allowCurrentDeptMembers && currentDeptId && user.departmentId === currentDeptId) {
    // 允许选择当前部门的成员（用于选择领导场景）
  } else if (hasDepartment) {
    showError(`用户 "${user.name}" 已加入部门 "${user.department}"，不可重复分配`);
    return;
  }
  
  // ... 其他选择逻辑
};
```

#### 禁用状态判断
```typescript
// 判断是否为当前部门成员
const isCurrentDeptMember = allowCurrentDeptMembers && currentDeptId && user.departmentId === currentDeptId;

// 禁用逻辑：如果用户有部门但不是当前部门成员，或者达到最大选择数量限制
const isDisabled = (hasDepartment && !isCurrentDeptMember) || (maxSelection > 0 && selectedUsers.length >= maxSelection && !isSelected);
```

### 3. 界面显示优化

#### 部门标签样式区分
```typescript
{hasDepartment && (
  <span className={`ml-2 text-xs px-2 py-1 rounded ${
    isCurrentDeptMember 
      ? 'bg-green-100 text-green-600' 
      : 'bg-orange-100 text-orange-600'
  }`}>
    {user.department}
    {isCurrentDeptMember && ' (当前部门)'}
  </span>
)}
```

#### 状态文本区分
```typescript
{hasDepartment && ` · ${isCurrentDeptMember ? '当前部门成员' : '已加入部门'}`}
```

### 4. 部门管理集成

#### DeptForm 接口扩展
```typescript
interface DeptForm {
  id?: number; // 部门ID，编辑时使用
  deptName: string;
  leaderId: number;
}
```

#### 编辑部门时设置ID
```typescript
const editDept = (dept: Dept) => {
  setEditingDept(dept);
  setSelectedLeader({
    id: dept.leaderId,
    name: dept.manager
  });
  setDeptForm({
    id: dept.id, // 设置部门ID
    deptName: dept.name,
    leaderId: dept.leaderId
  });
  setShowDeptModal(true);
};
```

#### 领导选择弹窗配置
```typescript
<UserSelectorModal
  isOpen={showLeaderSelector}
  onClose={() => setShowLeaderSelector(false)}
  onConfirm={handleLeaderSelection}
  title="选择部门领导"
  confirmText="确认选择"
  excludeUserIds={[]}
  maxSelection={1}
  selectionMode="single"
  allowCurrentDeptMembers={true}  // 允许选择当前部门成员
  currentDeptId={deptForm.id}     // 传递当前部门ID
/>
```

## 使用场景

### 1. 添加部门成员（多选模式）
```typescript
<UserSelectorModal
  // ... 其他配置
  selectionMode="multiple"
  allowCurrentDeptMembers={false} // 不允许选择已有部门的用户
  // 不传递 currentDeptId
/>
```
- 不允许选择任何已有部门的用户
- 显示橙色部门标签
- 显示"已加入部门"状态

### 2. 选择部门领导（单选模式）
```typescript
<UserSelectorModal
  // ... 其他配置
  selectionMode="single"
  allowCurrentDeptMembers={true}  // 允许选择当前部门成员
  currentDeptId={deptForm.id}     // 传递当前部门ID
/>
```
- 允许选择当前部门的成员
- 当前部门成员显示绿色标签和"(当前部门)"标识
- 其他部门成员仍显示橙色标签且不可选择

## 视觉效果

### 1. 当前部门成员
- **标签颜色**: 绿色 (`bg-green-100 text-green-600`)
- **标签文本**: "部门名称 (当前部门)"
- **状态文本**: "当前部门成员"
- **可选择**: ✅ 可以选择

### 2. 其他部门成员
- **标签颜色**: 橙色 (`bg-orange-100 text-orange-600`)
- **标签文本**: "部门名称"
- **状态文本**: "已加入部门"
- **可选择**: ❌ 不可选择

### 3. 无部门用户
- **标签**: 无
- **状态文本**: 无
- **可选择**: ✅ 可以选择

## 技术实现细节

### 1. 条件判断逻辑
```typescript
// 判断是否为当前部门成员
const isCurrentDeptMember = allowCurrentDeptMembers && currentDeptId && user.departmentId === currentDeptId;

// 选择验证
if (hasDepartment && allowCurrentDeptMembers && currentDeptId && user.departmentId === currentDeptId) {
  // 允许选择
} else if (hasDepartment) {
  // 不允许选择
}
```

### 2. 样式动态应用
```typescript
className={`ml-2 text-xs px-2 py-1 rounded ${
  isCurrentDeptMember 
    ? 'bg-green-100 text-green-600' 
    : 'bg-orange-100 text-orange-600'
}`}
```

### 3. 文本动态显示
```typescript
{isCurrentDeptMember ? '当前部门成员' : '已加入部门'}
{isCurrentDeptMember && ' (当前部门)'}
```

## 测试场景

### 1. 功能测试
- [x] 当前部门成员可以选择
- [x] 其他部门成员不可选择
- [x] 无部门用户可以选择
- [x] 标签颜色正确显示
- [x] 状态文本正确显示

### 2. 边界测试
- [x] currentDeptId 为 undefined 时的处理
- [x] allowCurrentDeptMembers 为 false 时的行为
- [x] 用户 departmentId 为 null 时的处理

### 3. 用户体验测试
- [x] 视觉区分清晰
- [x] 操作逻辑符合预期
- [x] 错误提示准确

## 相关功能

### 1. 部门管理
- 创建部门时选择领导
- 编辑部门时更换领导
- 部门成员管理

### 2. 用户管理
- 用户部门分配
- 用户状态显示
- 用户选择限制

### 3. 权限控制
- 部门领导权限
- 成员操作限制
- 数据一致性保证

## 注意事项

1. **数据一致性**: 确保 `currentDeptId` 和 `user.departmentId` 的数据类型一致
2. **参数传递**: 在编辑部门时必须正确传递 `currentDeptId`
3. **向后兼容**: 新参数都有默认值，不影响现有功能
4. **性能优化**: 条件判断在渲染时进行，避免重复计算

## 未来优化

1. **权限管理**: 根据用户权限控制操作
2. **批量操作**: 支持批量选择领导
3. **操作日志**: 记录领导变更历史
4. **通知机制**: 领导变更时通知相关人员
