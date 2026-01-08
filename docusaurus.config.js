const { themes } = require('prism-react-renderer');
const fs = require('fs');

// 读取 SDKs 下拉菜单的 HTML 内容
const sdksHTML = fs.readFileSync('./src/snippets/sdks.html', 'utf-8');

const code_themes = {
  light: themes.github,
  dark: themes.dracula,
};

/** @type {import('@docusaurus/types').Config} */
const meta = {
  title: 'JadeView Docs',
  tagline: '基于 Rust 的 WebView 窗口库 API 文档',
  // 自定义域名配置
  url: 'http://jade.run', // 自定义域名
  baseUrl: '/', // 基础路径
  // 自定义域名已配置
  favicon: '/favicon.png',
  // 部署配置
  organizationName: 'JadeViewDocs', // GitHub 用户名
  projectName: 'docs', // 仓库名称
  deploymentBranch: 'gh-pages', // GitHub Pages 部署分支
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh'],
  },
};

/** @type {import('@docusaurus/plugin-content-docs').Options} */
const docs = [
  {
    id: 'web-sdk',
    path: 'docs/web-sdk',
    routeBasePath: 'web-sdk',
    sidebarPath: require.resolve('./sidebars-web-sdk.js'),
  },
  {
    id: 'python-sdk',
    path: 'docs/python-sdk',
    routeBasePath: 'python-sdk',
    sidebarPath: require.resolve('./sidebars-python-sdk.js'),
  },
  {
    id: 'easy-language-sdk',
    path: 'docs/easy-language-sdk',
    routeBasePath: 'easy-language-sdk',
    sidebarPath: require.resolve('./sidebars-easy-language-sdk.js'),
  },
  {
    id: 'changelog',
    path: 'docs/changelog',
    routeBasePath: 'changelog',
    sidebarPath: false,
  },
  {
    id: 'spec',
    path: 'docs/spec',
    routeBasePath: 'spec',
    sidebarPath: require.resolve('./sidebars-spec.js'),
  },
];

/** @type {import('@docusaurus/plugin-content-docs').Options} */
const defaultSettings = {
  breadcrumbs: true,
  editUrl: 'https://github.com/JadeViewDocs/docs/tree/main/',
  showLastUpdateTime: true,
  sidebarCollapsible: true,
  remarkPlugins: [
    [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
  ],
  sidebarPath: require.resolve('./sidebars-default.js'),
};

/**
 * Create a section
 * @param {import('@docusaurus/plugin-content-docs').Options} options
 */
function create_doc_plugin({
  sidebarPath = require.resolve('./sidebars-default.js'),
  ...options
}) {
  return [
    '@docusaurus/plugin-content-docs',
    /** @type {import('@docusaurus/plugin-content-docs').Options} */
    ({
      ...defaultSettings,
      sidebarPath,
      ...options,
    }),
  ];
}

const { webpackPlugin } = require('./plugins/webpack-plugin.cjs');
const tailwindPlugin = require('./plugins/tailwind-plugin.cjs');
const docs_plugins = docs.map((doc) => create_doc_plugin(doc));

const plugins = [
  tailwindPlugin,
  ...docs_plugins,
  webpackPlugin,
  // 添加本地搜索插件，替代Dyte AI搜索
  [
    '@easyops-cn/docusaurus-search-local',
    {
      hashed: true,
      language: ['zh'],
      highlightSearchTermsOnTargetPage: true,
      explicitSearchResultPath: true,
      docsRouteBasePath: [
        'guides',
        'changelog',
        'easy-language-sdk',
        'python-sdk',
        'web-sdk',
        'spec',
      ],
    },
  ],
];

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...meta,
  plugins,
  future: {
    experimental_faster: true,
  },

  // 禁用断链检查，因为文档是从 Dyte fork 而来，包含大量 Dyte 特定链接
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'ignore',
  trailingSlash: false,
  themes: ['@docusaurus/theme-live-codeblock', '@docusaurus/theme-mermaid'],
  clientModules: [
    require.resolve('./src/client/define-ui-kit.js'),
    require.resolve('./src/client/set-framework.js'),
    require.resolve('./src/client/add-contributors-to-all-docs.js'),
    require.resolve('./src/client/update-changelog-badge.js'),
  ],
  scripts: [{ src: 'https://cdn.statuspage.io/se-v2.js', async: true }],
  markdown: {
    mermaid: true,
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs/guides',
          id: 'default',
          routeBasePath: 'guides',
          sidebarPath: require.resolve('./sidebars-default.js'),
          ...defaultSettings,
        },
        blog: false,
        // 禁用搜索功能
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            require.resolve('./src/css/api-reference.css'),
            require.resolve('./src/css/sdks-dropdown.css'),
          ],
        },
        sitemap: {
          ignorePatterns: ['**/tags/**', '/api/*'],
        },
        googleTagManager: {
          containerId: 'GTM-5FDFFSS',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: '/img/dyte-docs-card.png',
      colorMode: {
        defaultMode: 'light',
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
          hideable: true,
        },
      },
      navbar: {
        logo: {
          href: '/',
          src: '/logo/light.svg',
          srcDark: '/logo/dark.svg',
          alt: 'JadeView Documentation',
          height: '40px',
          width: '101px',
        },
        items: [
          {
            label: '设计',
            to: '/spec',
          },

          {
            label: 'SDKs',
            type: 'dropdown',
            className: 'dyte-dropdown',
            items: [
              {
                type: 'html',
                value: sdksHTML,
                className: 'dyte-dropdown',
              },
            ],
          },
          {
            label: 'Api',
            to: 'guides',
            className: 'guides-top-header',
          },
          {
            label: 'FAQ',
            to: '/faq',
          },
          {
            label: '更新日志',
            to: '/changelog',
            className: 'changelog-nav-item',
          },
          {
            type: 'search',
            position: 'right',
          },
        ],
      },
      footer: {
        logo: {
          href: '/',
          src: '/logo/light.svg',
          srcDark: '/logo/dark.svg',
          alt: 'JadeView Documentation',
          height: '36px',
        },
        links: [
          {
            title: '产品',
            items: [
              {
                label: '文档',
                href: '/guides',
              },
              {
                label: 'SDKs',
                href: '/web-sdk',
              },
              {
                label: '更新日志',
                href: '/changelog',
              },
            ],
          },
          {
            title: '公司',
            items: [
              {
                label: '关于我们',
                href: '#',
              },
              {
                label: '联系我们',
                href: '#',
              },
              {
                label: '隐私政策',
                href: '#',
              },
            ],
          },
          {
            title: '资源',
            items: [
              {
                label: 'GitHub',
                href: '#',
              },
              {
                label: '博客',
                href: '#',
              },
            ],
          },
        ],
        copyright: 'Copyright © JadeView since 2025. All rights reserved.',
      },
      prism: {
        theme: code_themes.light,
        darkTheme: code_themes.dark,
        additionalLanguages: [
          'dart',
          'ruby',
          'groovy',
          'kotlin',
          'java',
          'swift',
          'objectivec',
          'json',
          'bash',
        ],
        magicComments: [
          {
            className: 'theme-code-block-highlighted-line',
            line: 'highlight-next-line',
            block: { start: 'highlight-start', end: 'highlight-end' },
          },
          {
            className: 'code-block-error-line',
            line: 'highlight-next-line-error',
          },
        ],
      },
    }),

  // webpack: {
  //   jsLoader: (isServer) => ({
  //     loader: require.resolve('swc-loader'),
  //     options: {
  //       jsc: {
  //         parser: {
  //           syntax: 'typescript',
  //           tsx: true,
  //         },
  //         target: 'es2017',
  //       },
  //       module: {
  //         type: isServer ? 'commonjs' : 'es6',
  //       },
  //     },
  //   }),
  // },
};

module.exports = config;
