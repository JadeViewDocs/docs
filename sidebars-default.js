/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: '快速开始',
      items: [
        'index',
        'quickstart',
        'webview2-installation',
      ],
    },
    {
      type: 'category',
      label: '核心 API',
      items: [
        'core/initialization',
        'core/message-loop',
        'core/cleanup',
      ],
    },
    {
      type: 'category',
      label: '窗口管理',
      items: [
        'window-management/create-window',
        'window-management/close-window',
        'window-management/event-handlers',
        'window-management/custom-titlebar',
      ],
    },
    {
      type: 'category',
      label: '窗口属性',
      items: [
        'window-properties/title',
        'window-properties/size',
        'window-properties/position',
        'window-properties/visibility',
      ],
    },
    {
      type: 'category',
      label: '窗口状态',
      items: [
        'window-state/minimize',
        'window-state/maximize',
        'window-state/always-on-top',
      ],
    },
    {
      type: 'category',
      label: 'WebView 功能',
      items: [
        'webview/navigation',
        'webview/javascript',
      ],
    },
    {
      type: 'category',
      label: '事件系统',
      items: [
        'events/register-events',
        'events/event-types',
      ],
    },
    {
      type: 'category',
      label: '主题外观',
      items: [
        'theme/set-theme',
        'theme/backdrop',
      ],
    },
    {
      type: 'category',
      label: 'IPC 通信',
      items: [
        'ipc/send-message',
        'ipc/register-handler',
      ],
    },
    {
      type: 'category',
      label: '本地服务器',
      items: [
        'local-server/create-server',
      ],
    },
    {
      type: 'category',
      label: 'API 参考',
      items: [
        'reference/data-structures',
        'reference/c-api',
      ],
    },
  ],
};

module.exports = sidebars;
