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
  specSidebar: [
    // 概览分组
    {
      type: 'category',
      label: '概览',
      collapsed: false,
      items: [
        'index',
        'behavior',
        'compatibility',
        'changelog/index'
      ]
    },
    {
      type: 'category',
      label: '教程',
      collapsed: false,
      items: [
        'quickstart',
        'webview2-installation',
        'custom-titlebar'
      ]
    },
    {
      type: 'category',
      label: '核心设计',
      collapsed: false,
      items: [
        'local-web-resources',
        'ipc-communication',
        'javascript-execution'
      ]
    },
    {
      type: 'category',
      label: '发行行为',
      collapsed: false,
      items: [
        'release-behavior'
      ]
    }
  ]
};

module.exports = sidebars;