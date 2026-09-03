---
title: 对话框前端 API
order: 1
group:
  title: 前端 API
  order: 2
---

# 对话框前端 API

**用途**：在 **HTML/JS** 里弹系统原生文件框、保存框、提示框，而不自己用 div 画。通过 **`jade.dialog`** 上的方法调用，返回 **Promise**，结果里是路径或用户点了哪个按钮。

方法形态接近 **Electron `dialog` 模块**（Promise、options 对象）；C 侧对应结构体见 [对话框 API](/docs/api/dialog-api)。

---

## 常用方法一览

| 方法 | 干什么 |
|------|--------|
| `jade.dialog.showOpenDialog(options)` | 让用户**选一个或多个文件**。 |
| `jade.dialog.showSaveDialog(options)` | 让用户选**保存路径和文件名**。 |
| `jade.dialog.showMessageBox(options)` | **提示 / 确认**（多按钮、图标类型等）。 |
| `jade.dialog.showErrorBox(title, content)` | **简单错误框**，只有确认。 |

---

## showOpenDialog

显示打开文件对话框，用于选择一个或多个文件。

**参数** — `options` (Object):

- `title` — 对话框标题
- `defaultPath` — 默认打开路径
- `buttonLabel` — 确认按钮的自定义标签
- `filters` — 文件过滤器数组，格式 `[{ name: string, extensions: string[] }]`
- `properties` — 字符串数组，可选值见下方
- `blocking` — 对话框期间是否禁用父窗口，默认 `true`（不影响 JS：invoke 总是立即返回，结果经 Promise 异步回传）

**返回值** — `Promise<Object>`:

- `canceled` — 是否取消
- `filePaths` — 选择的文件路径数组

**示例**：

```javascript
const result = await jade.dialog.showOpenDialog({
  title: '选择图片',
  filters: [
    { name: 'Images', extensions: ['jpg', 'png'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  properties: ['openFile', 'multiSelections']
});

if (!result.canceled) {
  console.log('选择的文件:', result.filePaths);
}
```

---

## showSaveDialog

显示保存文件对话框。

**参数** — `options` (Object):

- `title` — 对话框标题
- `defaultPath` — 默认保存路径
- `buttonLabel` — 确认按钮的自定义标签
- `filters` — 文件过滤器数组
- `blocking` — 对话框期间是否禁用父窗口，默认 `true`（不影响 JS：invoke 总是立即返回，结果经 Promise 异步回传）

**返回值** — `Promise<Object>`:

- `canceled` — 是否取消
- `filePath` — 选择的保存文件路径

**示例**：

```javascript
const result = await jade.dialog.showSaveDialog({
  title: '保存文件',
  defaultPath: 'document.txt'
});

if (!result.canceled) {
  console.log('保存路径:', result.filePath);
}
```

---

## showMessageBox

显示消息框，用于信息提示、警告或用户确认。

**参数** — `options` (Object):

- `title` — 消息框标题
- `message` — 消息框内容
- `detail` — 详细信息
- `buttons` — 按钮文本数组，如 `['确定', '取消']`。**注意**：底层当前只支持「确定」或「确定 + 取消」两种形态——数组中包含「取消」（或英文 `cancel`）才显示「确定 + 取消」，否则只显示「确定」；自定义文字与第 3 个及以后的按钮均不生效
- `defaultId` — 默认选中的按钮索引（0-based）
- `cancelId` — 取消按钮的索引
- `type` — 图标类型，可选值见下方
- `blocking` — 对话框期间是否禁用父窗口，默认 `true`（不影响 JS：invoke 总是立即返回，结果经 Promise 异步回传）

**返回值** — `Promise<Object>`:

- `response` — 用户点击的按钮：`0` = 确定，`1` = 取消，`-1` = 关闭/异常（受上面 `buttons` 限制，不会出现 `2` 及更大的索引）

**示例**：

```javascript
const result = await jade.dialog.showMessageBox({
  title: '确认操作',
  message: '确定要删除此文件吗？',
  detail: '此操作不可撤销',
  buttons: ['确定', '取消'],
  defaultId: 1,
  cancelId: 1,
  type: 'warning'
});

if (result.response === 0) {
  console.log('用户确认了');
}
```

---

## showErrorBox

显示错误框。

**参数**：

- `title` — 错误框标题
- `content` — 错误信息内容

**返回值** — `Promise<void>`

```javascript
await jade.dialog.showErrorBox('操作失败', '无法连接到服务器');
```

---

## 选项参考

### type 图标类型

| 值 | 说明 |
|----|------|
| `'none'` | 无图标 |
| `'info'` | 信息 |
| `'error'` | 错误 |
| `'warning'` | 警告 |
| `'question'` | 询问确认 |

### properties 对话框特性

| 属性值 | 说明 |
|--------|------|
| `'openFile'` | 允许选择文件（默认） |
| `'openDirectory'` | 允许选择文件夹 |
| `'multiSelections'` | 允许多选 |
| `'showHiddenFiles'` | 显示隐藏文件 **（当前未实现，忽略）** |
| `'promptToCreate'` | 文件不存在时提示创建 **（当前未实现，忽略）** |

---

## 完整示例

```javascript
async function openFile() {
  const result = await jade.dialog.showOpenDialog({
    title: '选择文件',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    console.log('选择的文件:', result.filePaths);
  }
}

async function saveFile() {
  const result = await jade.dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: 'document.txt'
  });

  if (!result.canceled) {
    console.log('保存路径:', result.filePath);
  }
}

async function showConfirm() {
  const result = await jade.dialog.showMessageBox({
    title: '确认操作',
    message: '确定要删除吗？',
    buttons: ['确定', '取消'],
    type: 'warning'
  });

  console.log('用户选择:', result.response);
}

jade.dialog.showErrorBox('错误', '操作失败，请重试');
```

---

## 事件

对话框操作完成后触发对应事件，可通过 `jade.on` 监听：

| 事件名 | 触发时机 | 事件数据 |
|--------|----------|----------|
| `dialog-open-file-completed` | 打开文件对话框关闭 | `{ canceled, filePaths }` |
| `dialog-save-file-completed` | 保存文件对话框关闭 | `{ canceled, filePath }` |
| `dialog-message-box-completed` | 消息框关闭 | `{ response }` |
| `dialog-error-box-completed` | 错误框关闭 | 无 |

```javascript
jade.on('dialog-open-file-completed', (result) => {
  if (!result.canceled) {
    console.log('用户选择了:', result.filePaths);
  }
});
```

---

## 注意事项

1. **阻塞选项**：`blocking` 只决定对话框弹出期间是否禁用父窗口；它**不会**阻塞 JS——前端 invoke 总是立即返回，结果通过 Promise（及对应完成事件）异步回传。
2. **过滤器格式**：`extensions` 数组不包含点号，如 `png` 而不是 `.png`。
3. **路径格式**：Windows 路径使用反斜杠 `\\` 或正斜杠 `/`。
4. **properties 组合**：`openFile` 和 `openDirectory` 可同时使用；`multiSelections` 可与任意属性组合。
5. **type 选择**：警告用 `warning`，确认用 `question`，错误用 `error`，无图标用 `none`。

## 故障排除

### 对话框不显示
检查是否在非 UI 线程中调用了对话框 API。

### 事件不触发
确保在对话框显示前已注册 `jade.on` 监听器。

### 过滤器不生效
确保 `extensions` 数组中不含点号（如 `png` 而非 `.png`）。

### 返回 undefined
方法返回的是 Promise，需 `await` 或 `.then` 获取结果；并检查控制台是否有错误。
