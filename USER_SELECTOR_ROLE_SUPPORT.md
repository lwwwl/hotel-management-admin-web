# UserSelectorModal 角色管理支持更新

## 更新概述

UserSelectorModal 组件已更新以支持角色管理场景，现在可以同时支持部门管理和角色管理两种模式。

## 新增功能

### 1. 模式支持
- **部门管理模式** (`mode: 'department'`)：原有的部门管理逻辑
- **角色管理模式** (`mode: 'role'`)：新的角色管理逻辑

### 2. 角色管理特性
- **多角色支持**：用户可以同时加入多个角色
- **角色冲突检查**：已加入当前角色的用户不能再被选择
- **部门信息显示**：在角色管理模式下仍显示用户的部门信息

## 新增 Props

```typescript
interface UserSelectorModalProps {
  // ... 原有属性
  
  // 新增属性
  mode?: 'department' | 'role'; // 选择模式：部门管理或角色管理
  currentRoleId?: number; // 当前角色ID（用于角色管理场景）
}
```

## 使用方式

### 部门管理场景（原有方式）
```tsx
<UserSelectorModal
  isOpen={showUserSelector}
  onClose={() => setShowUserSelector(false)}
  onConfirm={handleUserSelection}
  title="添加部门成员"
  confirmText="添加成员"
  excludeUserIds={excludeUserIds}
  maxSelection={0}
  selectionMode="multiple"
  mode="department" // 默认值
  currentDeptId={currentDeptId}
/>
```

### 角色管理场景（新增方式）
```tsx
<UserSelectorModal
  isOpen={showUserSelector}
  onClose={() => setShowUserSelector(false)}
  onConfirm={handleUserSelection}
  title="添加角色用户"
  confirmText="添加用户"
  excludeUserIds={roleForm.userIdList || []}
  maxSelection={0}
  selectionMode="multiple"
  mode="role" // 角色管理模式
  currentRoleId={selectedRole?.roleId}
/>
```

## 行为差异

### 部门管理模式
- 检查用户是否已有部门
- 有部门的用户不能重复分配到其他部门
- 支持选择当前部门的成员（用于选择领导场景）
- 显示部门分配状态

### 角色管理模式
- 不检查部门限制
- 用户可以同时加入多个角色
- 只检查是否已加入当前角色
- 显示角色分配状态
- 仍显示用户的部门信息

## 用户界面更新

### 状态标签
- **部门模式**：显示"已分配"、"当前部门成员"等标签
- **角色模式**：显示"已加入角色"、"已加入当前角色"等标签

### 禁用逻辑
- **部门模式**：有部门且非当前部门成员的用户被禁用
- **角色模式**：已加入当前角色的用户被禁用

### 错误提示
- **部门模式**：提示用户已加入其他部门
- **角色模式**：提示用户已加入当前角色

## 向后兼容性

- 所有原有功能保持不变
- 默认模式为 `department`，确保现有代码正常工作
- 新增属性都是可选的，不会影响现有使用

## 扩展性

该设计为将来的功能扩展预留了空间：
- 可以轻松添加更多模式（如权限管理）
- 支持更复杂的用户关联逻辑
- 可以集成更细粒度的权限控制
