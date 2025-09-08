# UserSelectorModal 多选和单选模式

## 功能概述
`UserSelectorModal` 组件现在支持两种选择模式：
- **多选模式**：用于添加部门成员
- **单选模式**：用于选择部门领导

## 新增属性

### selectionMode
- **类型**: `'single' | 'multiple'`
- **默认值**: `'multiple'`
- **说明**: 控制选择模式

```typescript
interface UserSelectorModalProps {
  // ... 其他属性
  selectionMode?: 'single' | 'multiple'; // 新增：选择模式
}
```

## 使用示例

### 1. 多选模式 - 添加部门成员
```typescript
<UserSelectorModal
  isOpen={showUserSelector}
  onClose={() => setShowUserSelector(false)}
  onConfirm={handleUserSelection}
  title="添加部门成员"
  confirmText="添加成员"
  excludeUserIds={selectedDept?.memberList.map(member => member.userId) || []}
  maxSelection={0} // 无限制
  selectionMode="multiple" // 多选模式
/>
```

### 2. 单选模式 - 选择部门领导
```typescript
<UserSelectorModal
  isOpen={showLeaderSelector}
  onClose={() => setShowLeaderSelector(false)}
  onConfirm={handleLeaderSelection}
  title="选择部门领导"
  confirmText="确认选择"
  excludeUserIds={[]}
  maxSelection={1}
  selectionMode="single" // 单选模式
/>
```

## 界面差异

### 多选模式
- 使用方形复选框 (☐/☑)
- 头部显示："已选择 X 个用户"
- 按钮显示："添加成员 (X)"
- 支持同时选择多个用户

### 单选模式
- 使用圆形单选按钮 (○/●)
- 头部显示："已选择：用户名"
- 按钮显示："确认选择"
- 只能选择一个用户

## 交互逻辑

### 多选模式
1. 点击用户切换选择状态
2. 可以同时选择多个用户
3. 受 `maxSelection` 限制
4. 已加入部门的用户不可选择

### 单选模式
1. 点击用户直接选择（替换之前的选择）
2. 只能选择一个用户
3. 忽略 `maxSelection` 限制
4. 已加入部门的用户不可选择

## 技术实现

### 选择逻辑
```typescript
const toggleUserSelection = (user: User) => {
  // 检查用户是否已有部门
  const hasDepartment = user.departmentId && user.departmentId > 0;
  if (hasDepartment) {
    showError(`用户 "${user.name}" 已加入部门 "${user.department}"，不可重复分配`);
    return;
  }
  
  // 单选模式：如果已选择其他用户，先清空
  if (selectionMode === 'single') {
    const isSelected = selectedUsers.find(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([user]);
    }
    return;
  }
  
  // 多选模式：原有的多选逻辑
  // ...
};
```

### 界面渲染
```typescript
{/* 选择指示器 */}
<div className="mr-3">
  {selectionMode === 'single' ? (
    // 单选模式：使用圆形单选按钮
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
      isSelected 
        ? 'border-blue-500 bg-blue-500' 
        : 'border-gray-300'
    }`}>
      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-white"></div>
      )}
    </div>
  ) : (
    // 多选模式：使用方形复选框
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
      isSelected 
        ? 'border-blue-500 bg-blue-500' 
        : 'border-gray-300'
    }`}>
      {isSelected && (
        <Check className="text-white" size={12} />
      )}
    </div>
  )}
</div>
```

## 部门管理集成

### 添加成员（多选）
- 打开用户选择弹窗
- 显示所有用户，已加入部门的用户置灰
- 支持多选添加成员

### 选择领导（单选）
- 在部门创建/编辑表单中
- 点击"选择领导"按钮
- 单选模式选择部门负责人
- 显示选中领导的姓名

## 用户体验优化

### 视觉区分
- 单选和多选使用不同的图标样式
- 头部显示不同的选择状态信息
- 按钮文本根据模式调整

### 操作反馈
- 单选模式点击后立即替换选择
- 多选模式支持累积选择
- 清晰的错误提示和状态反馈

### 数据一致性
- 两种模式都遵循相同的业务规则
- 已加入部门的用户不可选择
- 支持用户搜索和分页

## 测试场景

### 多选模式测试
- [x] 可以同时选择多个用户
- [x] 受 maxSelection 限制
- [x] 已加入部门的用户不可选择
- [x] 搜索功能正常工作
- [x] 分页功能正常工作

### 单选模式测试
- [x] 只能选择一个用户
- [x] 选择新用户时替换之前的选择
- [x] 已加入部门的用户不可选择
- [x] 界面显示正确的单选按钮样式
- [x] 头部显示选中的用户名

### 集成测试
- [x] 部门添加成员使用多选模式
- [x] 部门选择领导使用单选模式
- [x] 两种模式切换正常
- [x] 数据传递正确

## 注意事项

1. **向后兼容**：默认使用多选模式，不影响现有功能
2. **性能优化**：两种模式使用相同的组件，避免重复渲染
3. **类型安全**：TypeScript 类型定义完整
4. **错误处理**：统一的错误提示和处理逻辑

## 未来扩展

1. **自定义样式**：支持自定义选择器样式
2. **键盘导航**：支持键盘操作
3. **批量操作**：支持全选/取消全选
4. **拖拽选择**：支持拖拽多选
