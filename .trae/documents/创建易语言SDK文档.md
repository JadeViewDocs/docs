# 创建易语言SDK文档

## 一、文档结构

### 目录结构

```
docs/
├── easy-language-sdk/            # 易语言SDK文档
│   ├── index.mdx                 # 主页面
│   ├── introduction.mdx          # 介绍
│   ├── quickstart.mdx           # 快速开始
│   └── reference/                # API参考
│       ├── _category_.json
│       ├── constants.mdx         # 常量定义
│       └── data-types.mdx        # 数据类型定义
```

## 二、内容规划

### 1. index.mdx (主页面)

- 易语言SDK介绍
- 主要功能
- 快速开始链接
- API参考链接

### 2. introduction.mdx (介绍)

- 什么是易语言SDK
- 主要特性
- 适用场景

### 3. quickstart.mdx (快速开始)

- 环境要求
- SDK导入步骤
- 简单示例代码（创建一个WebView窗口，使用公开的数据类型和常量）

### 4. reference/constants.mdx (常量)

包含 `常量.e.txt` 中的所有公开常量：

- 主题_亮色
- 主题_暗色
- 主题_自动

### 5. reference/data-types.mdx (数据类型)

包含 `自定义类型.e.txt` 中的所有公开数据类型：

- JadeView窗口设置
- JadeView视窗设置
- JadeRgb结构

## 三、配置更新

### 1. docusaurus.config.js

添加易语言SDK文档配置：

```javascript
const docs = [
  // ... 现有配置
  {
    id: 'easy-language-sdk',
    path: 'docs/easy-language-sdk',
    routeBasePath: 'easy-language-sdk',
    sidebarPath: require.resolve('./sidebars-easy-language-sdk.js'),
  },
];
```

### 2. 创建侧边栏配置文件

创建 `sidebars-easy-language-sdk.js` 文件，配置易语言SDK的侧边栏结构。

## 四、内容来源

所有内容严格基于 `D:\nodejsApp\JadeView\dist\JadeView.代码` 目录下的源码文件中公开的内容：

- `常量.e.txt`：常量定义（所有常量均为公开）
- `自定义类型.e.txt`：数据类型定义（所有数据类型均为公开）

## 五、文档风格

- 使用中文编写
- 遵循现有SDK文档风格
- 每个常量和数据类型包含：
  - 定义
  - 功能描述
  - 成员/值说明
  - 示例代码（如果适用）
- 使用表格展示成员和值
- 使用易语言代码示例

## 六、实现步骤

1. 创建易语言SDK文档目录结构
2. 编写文档内容，仅包含源码中公开的常量和数据类型
3. 更新docusaurus.config.js配置
4. 创建侧边栏配置文件
5. 测试文档构建和访问

