/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 *
 * The sidebars can be generated from the filesystem, or explicitly defined here.
 *
 * Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
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
      items: ['local-server-api', 'notification', 'dialog-api'],
    },
    {
      type: 'category',
      label: '前端API',
      items: ['JavaScript-API', 'window-styling', 'dialog-frontend-api'],
    },
  ],
};

module.exports = sidebars;
