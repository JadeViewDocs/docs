/**
 * api-2-preview 文档侧栏。
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  api2PreviewSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: '核心Api',
    },
    {
      type: 'doc',
      id: 'tools-api',
      label: '工具Api',
    },
    {
      type: 'category',
      label: '窗口相关',
      items: ['window-api', 'theme-management'],
    },
    {
      type: 'doc',
      label: 'WebView 相关',
      id: 'webview-api',
    },
    {
      type: 'category',
      label: '通信与事件',
      items: ['ipc-api', 'event-types'],
    },
    {
      type: 'category',
      label: '插件',
      items: ['local-server-api', 'plugin-system-api', 'tray-api', 'notification', 'dialog-api'],
    },
    {
      type: 'category',
      label: '前端API',
      items: ['JavaScript-API', 'window-styling', 'dialog-frontend-api'],
    },
  ],
};

module.exports = sidebars;
