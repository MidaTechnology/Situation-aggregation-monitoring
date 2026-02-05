# 置顶与取消置顶逻辑分析

## 数据来源

- **`settings.order`**：面板的显示顺序（数组，与 `PANEL_ORDER` 一致或用户拖拽/置顶后的顺序）。
- **`settings.pinned`**：当前被置顶的面板 ID 列表，**按置顶先后**排列（先置顶的在前面）。
- **`displayOrder`**（页面派生）：`$settings.order.filter(id => $settings.enabled[id])`，即只包含「已启用」面板的 order，用于瀑布流和拖拽。

展示时：按 `displayOrder` 顺序渲染；某个面板是否「置顶」由 `$settings.pinned.includes(panelId)` 决定（仅影响样式，如边框/图标）。

---

## 置顶（Pin）

**入口**：Panel 标题栏的 📍/📌 按钮 → `settings.togglePin(panelId)`。

**逻辑**（`settings.ts` 中 `togglePin`）：

1. `idx = state.pinned.indexOf(panelId)`：
   - `idx === -1` → 当前**未置顶**，执行「置顶」。
   - `idx !== -1` → 当前**已置顶**，执行「取消置顶」。
2. **置顶时**（`idx === -1`）：
   - **pinned**：`newPinned = [panelId, ...state.pinned]`，把该面板放到置顶列表**最前**（新置顶的在最前）。
   - **order**：`newOrder = [panelId, ...state.order.filter(id => id !== panelId)]`，把该面板移到**全局 order 的最前面**。
3. 持久化：`saveToStorage('order', newOrder)`、`saveToStorage('pinned', newPinned)`。

**效果**：点击置顶后，该面板会排到**整页顺序的第一位**，并进入 `pinned` 列表，显示为「已置顶」样式。

---

## 取消置顶（Unpin）

**入口**：同一按钮，在已置顶面板上再点一次 → 仍调用 `settings.togglePin(panelId)`。

**逻辑**（同一函数中 `idx !== -1` 分支）：

1. **pinned**：`newPinned = state.pinned.filter(id => id !== panelId)`，从置顶列表中移除该面板。
2. **order**：将该面板从当前顺序中移除，再插入到**「当前仍置顶的面板」之后**（即最后一个 pinned 的后面），保证置顶行始终在取消置顶的面板之上。
   - `without = state.order.filter(id => id !== panelId)`
   - 在 `without` 中找到最后一个仍在 `newPinned` 中的位置 `insertIndex`
   - `newOrder = [...without.slice(0, insertIndex), panelId, ...without.slice(insertIndex)]`

**效果**：该面板不再在 `pinned` 里，样式上不再是「置顶」；在列表中的位置会移到「所有仍置顶面板」的下方，避免出现「取消置顶的面板还在置顶面板上面」的情况。

---

## 与拖拽的联动（updateOrder）

**入口**：长按面板标题拖拽松手后，在 `handlePointerUp` 里调用 `settings.updateOrder([...visibleOrder, ...disabled])`。

**逻辑**（`settings.ts` 中 `updateOrder`）：

1. 传入的 `newOrder` = 当前可见顺序（displayOrder 拖拽后的结果）+ 未启用面板在原有 order 里的顺序。
2. **pinned**：`newPinned = newOrder.filter(id => state.pinned.includes(id))`。  
   即：新的置顶列表 = **新 order 里仍然出现在 pinned 里的那些 ID，且顺序按 newOrder 中的出现顺序**。
3. **order**：直接使用 `newOrder`。
4. 持久化：order 和 pinned 都按上述结果写入。

**效果**：

- 拖拽会改变 `order`，从而改变 `displayOrder`。
- 置顶状态会**跟随新顺序**：谁在新 order 里且原来在 pinned 里，谁就继续算置顶；顺序以新 order 为准。  
  例如：把已置顶的 A 拖到第二格，则 A 仍在 pinned 里，但 pinned 列表顺序会变成 [B, A, ...]（若 B 也在 pinned 且在新 order 里更靠前）。

---

## 小结表

| 操作           | order 变化                         | pinned 变化                          |
|----------------|------------------------------------|--------------------------------------|
| **置顶**       | 该面板移到 order 最前              | 该面板加入 pinned 最前               |
| **取消置顶**   | 该面板移到「最后一个置顶」后面     | 该面板从 pinned 移除                 |
| **拖拽松手**   | 按拖拽结果更新 order               | pinned = 新 order 中仍在原 pinned 的 ID，按新 order 顺序 |

**当前取消置顶的语义**：取消「置顶」标记与样式，并将该面板在 order 中移到「当前仍置顶的面板」之后，保证置顶行始终在取消置顶的面板之上。
