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
  uiKitSidebar: [
    'index',
    'introduction',
    'quickstart',
    'release-notes',
    {
      type: 'category',
      label: 'Basics',
      items: [
        'basics/pre-requisite',
        'basics/components-basics',
      ],
    },
    {
      type: 'category',
      label: 'Components',
      items: [
        'components/dyte-audio-visualizer',
        'components/dyte-avatar',
        'components/dyte-button',
        'components/dyte-camera-toggle',
        'components/dyte-chat-toggle',
        'components/dyte-chat',
        'components/dyte-clock',
        'components/dyte-confirmation-modal',
        'components/dyte-controlbar-button',
        'components/dyte-controlbar',
        'components/dyte-dialog-manager',
        'components/dyte-dialog',
        'components/dyte-emoji-picker',
        'components/dyte-ended-screen',
        'components/dyte-file-message',
        'components/dyte-fullscreen-toggle',
        'components/dyte-grid-pagination',
        'components/dyte-grid',
        'components/dyte-header',
        'components/dyte-icon',
        'components/dyte-idle-screen',
        'components/dyte-image-message',
        'components/dyte-image-viewer',
        'components/dyte-leave-button',
        'components/dyte-leave-meeting',
        'components/dyte-logo',
        'components/dyte-meeting-title',
        'components/dyte-meeting',
        'components/dyte-menu-item',
        'components/dyte-menu-list',
        'components/dyte-menu',
        'components/dyte-mic-toggle',
        'components/dyte-mixed-grid',
        'components/dyte-more-toggle',
        'components/dyte-name-tag',
        'components/dyte-network-indicator',
        'components/dyte-notification',
        'components/dyte-notifications',
        'components/dyte-overlay-modal',
        'components/dyte-participant-count',
        'components/dyte-participant-tile',
        'components/dyte-participant',
        'components/dyte-participants-audio',
        'components/dyte-participants-stage-list',
        'components/dyte-participants-toggle',
        'components/dyte-participants',
        'components/dyte-permissions-message',
        'components/dyte-plugin-main',
        'components/dyte-plugins-toggle',
        'components/dyte-plugins',
        'components/dyte-poll-form',
        'components/dyte-poll',
        'components/dyte-polls-toggle',
        'components/dyte-polls',
        'components/dyte-recording-indicator',
        'components/dyte-recording-toggle',
        'components/dyte-remote-access-manager',
        'components/dyte-screen-share-toggle',
        'components/dyte-screenshare-view',
        'components/dyte-settings-audio',
        'components/dyte-settings-toggle',
        'components/dyte-settings-video',
        'components/dyte-settings',
        'components/dyte-setup-screen',
        'components/dyte-sidebar',
        'components/dyte-simple-grid',
        'components/dyte-spinner',
        'components/dyte-spotlight-grid',
        'components/dyte-stage',
        'components/dyte-switch',
        'components/dyte-text-field',
        'components/dyte-text-message',
        'components/dyte-tooltip',
        'components/dyte-viewer-count',
      ],
    },
    {
      type: 'category',
      label: 'Customizations',
      items: [
        'customizations/custom-iconpack',
        'customizations/custom-locale',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/reference',
      ],
    },
  ],
};

module.exports = sidebars;
