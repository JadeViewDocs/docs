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
      type: 'doc',
      label: '通信与服务',
      id: 'communication-api',
    },
    {
      type: 'doc',
      label: '创建本地服务',
      id: 'local-server-api',
    },
  ],
};

module.exports = sidebars;
