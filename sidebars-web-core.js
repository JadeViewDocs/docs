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
  webCoreSidebar: [
    'index',
    'Introduction',
    'quickstart',
    'release-notes',
    'room-metadata',
    'stage',
    'upgrade',
    'livestreaming',
    'recording',
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/advance',
      ],
    },
    {
      type: 'category',
      label: 'Chat',
      items: [
        'chat/introduction',
        'chat/sending-a-chat-message',
        'chat/receiving-chat-messages',
        'chat/edit-chat-messages',
        'chat/other-chat-functions',
      ],
    },
    {
      type: 'category',
      label: 'Error Codes',
      items: [
        'error-codes/error-code',
        'error-codes/error-code-zero-ten',
      ],
    },
    {
      type: 'category',
      label: 'Local User',
      items: [
        'local-user/introduction',
        'local-user/events',
        'local-user/extras',
        'local-user/manage-media-devices',
        'local-user/media-permission-errors',
      ],
    },
    {
      type: 'category',
      label: 'Participants',
      items: [
        'participants/participant-object',
        'participants/events',
        'participants/permissions',
        'participants/pip',
        'participants/remote-participants',
      ],
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'plugins/introduction',
        'plugins/enable-plugin',
        'plugins/disable-plugin',
        'plugins/extra',
      ],
    },
    {
      type: 'category',
      label: 'Polls',
      items: [
        'polls/introduction',
        'polls/creating-a-poll',
        'polls/voting-on-a-poll',
        'polls/other-poll-functions',
      ],
    },
    {
      type: 'category',
      label: 'Pre-call',
      items: [
        'pre-call/media-preview',
        'pre-call/handling-permissions',
        'pre-call/virtual-bg',
        'pre-call/meeting-meta',
        'pre-call/waiting-room',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/DyteAi',
        'reference/DyteChat',
        'reference/DyteClient',
        'reference/DyteConnectedMeetings',
        'reference/DyteLivestream',
        'reference/DyteMeta',
        'reference/DyteParticipant',
        'reference/DyteParticipantMap',
        'reference/DyteParticipants',
        'reference/DytePermissionsPreset',
        'reference/DytePlugin',
        'reference/DytePluginMap',
        'reference/DytePlugins',
        'reference/DytePolls',
        'reference/DyteRecording',
        'reference/DyteSelf',
        'reference/DyteStage',
        'reference/DyteThemePreset',
      ],
    },
  ],
};

module.exports = sidebars;
