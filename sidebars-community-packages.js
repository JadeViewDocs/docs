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
  communityPackagesSidebar: [
    'index',
    {
      type: 'category',
      label: 'Device Emulator',
      items: [
        'device-emulator/intro',
        'device-emulator/examples',
      ],
    },
    {
      type: 'category',
      label: 'Socket IO Client',
      items: [
        'socketio-client/intro',
        'socketio-client/initialization',
        'socketio-client/emitting',
      ],
    },
  ],
};

module.exports = sidebars;
