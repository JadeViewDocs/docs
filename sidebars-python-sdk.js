/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 *
 * The sidebars can be generated from filesystem, or explicitly defined here.
 *
 * Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  pythonSdkSidebar: [
    'index',
    'quickstart',
    {
      type: 'category',
      label: 'API 参考',
      items: [
        'reference/methods',
      ],
    },
  ],
};

module.exports = sidebars;

