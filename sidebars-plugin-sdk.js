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
  pluginSdkSidebar: [
    'introduction',
    'quickstart',
    'frequently-asked-questions',
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/exchange-data-between-plugin-and-meeting',
        'guides/how-to-work-with-plugin-stores',
      ],
    },
    {
      type: 'category',
      label: 'Setup',
      items: [
        'usage/installation',
        'setup/create',
        'setup/customize',
        'setup/develop',
        'setup/manage',
        'setup/publish',
      ],
    },
    {
      type: 'category',
      label: 'Usage',
      items: [
        'usage/basic/initialize',
        'usage/basic/events',
        'usage/basic/methods',
        'usage/rooms-api/events',
        'usage/rooms-api/methods',
        'usage/stores-api/introduction',
        'usage/stores-api/manage-stores',
      ],
    },
  ],
};

module.exports = sidebars;
