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
    id: 'voldp-sdk',
    path: 'docs/voldp-sdk',
    routeBasePath: 'voldp-sdk',
    sidebarPath: require.resolve('./sidebars-voldp-sdk.js'),
  },
  {
    id: 'python-sdk2',
    path: 'docs/python-sdk2',
    routeBasePath: 'python-sdk2',
    sidebarPath: require.resolve('./sidebars-python-sdk2.js'),
  },
  {
    id: 'spec',
    path: 'docs/spec',
    routeBasePath: 'spec',
    sidebarPath: require.resolve('./sidebars-spec.js'),
  },
  {
    id: 'v2api',
    path: 'docs/v2api',
    routeBasePath: 'v2api',
    sidebarPath: require.resolve('./sidebars-v2api.js'),
  },
];

/** @type {import('@docusaurus/plugin-content-docs').Options} */
const defaultSettings = {
  breadcrumbs: true,
  editUrl: 'https://github.com/JadeViewDocs/docs/tree/main/',
  showLastUpdateTime: false,
  sidebarCollapsible: true,
  remarkPlugins: [
    [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
  ],
  sidebarPath: require.resolve('./sidebars-v1api.js'),
};

/**
 * Create a section
 * @param {import('@docusaurus/plugin-content-docs').Options} options
 */
function create_doc_plugin({
  sidebarPath = require.resolve('./sidebars-v1api.js'),
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

const plugins = [tailwindPlugin, ...docs_plugins, webpackPlugin];

// 移除本地搜索插件，使用Algolia DocSearch

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...meta,
  plugins,
  future: {
    v4: true,
  },

  // 禁用断链检查，因为文档是从 Dyte fork 而来，包含大量 Dyte 特定链接
  onBrokenLinks: 'ignore',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'ignore',
    },
  },
  trailingSlash: false,
  themes: ['@docusaurus/theme-live-codeblock', '@docusaurus/theme-mermaid'],
  clientModules: [
    require.resolve('./src/client/define-ui-kit.js'),
    require.resolve('./src/client/set-framework.js'),
    require.resolve('./src/client/add-contributors-to-all-docs.js'),
    // 移除更新日志角标脚本，不再动态获取
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
          path: 'docs/v1api',
          id: 'default',
          routeBasePath: 'v1api',
          sidebarPath: require.resolve('./sidebars-v1api.js'),
          ...defaultSettings,
        },
        blog: false,
        // 禁用搜索功能
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            require.resolve('./src/css/api-reference.css'),
            require.resolve('./src/css/sdks-dropdown.css'),
            require.resolve('./src/css/homepage.css'),
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

  plugins: [
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: '/img/dyte-docs-card.png',
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
          hideable: true,
        },
      },
      // 添加Algolia DocSearch配置
      algolia: {
        appId: 'G6A6UH3R1R',
        apiKey: '9ed559408f34f517fc1a70f9d24dbbb7',
        indexName: 'JadeView',
        // AI搜索配置
        insights: true,
      },
      navbar: {
        logo: {
          href: '/',
          src: '/logo/light.svg',
          srcDark: '/logo/dark.svg',
          alt: 'JadeView',
          height: '36px',
          width: '110px',
        },
        items: [
          {
            label: '文档指南',
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
            label: 'SDK 下载',
            to: '/sdks',
          },
          {
            to: '/v2api',
            label: 'API',
            activeBasePath: '/v2api',
          },
           {
            to: '/v1api',
            label: 'API v1',
            activeBasePath: '/v1api',
          },
          {
            label: '案例',
            to: '/showcase',
          },
          {
            type: 'search',
            position: 'right',
          },
          {
            label: '发行版本',
            to: '/releases/',
            className:
              'get-button bg-primary text-white rounded-md hover:bg-primary/90 font-medium',
            position: 'right',
          },
        ],
      },
      footer: {
        logo: {
          href: '/',
          src: '/logo/light.svg',
          srcDark: '/logo/dark.svg',
          alt: 'JadeView',
          height: '32px',
        },
        links: [
          {
            title: '文档',
            items: [
              {
                label: '快速开始',
                to: '/spec/quickstart',
              },
              {
                label: 'API 参考',
                to: '/v2api',
              },
              {
                label: '更新日志',
                to: '/releases/',
              },
            ],
          },
          {
            title: 'SDK',
            items: [
              {
                label: 'Web SDK',
                to: '/web-sdk',
              },
              {
                label: 'Python SDK',
                to: '/python-sdk',
              },
              {
                label: '易语言 SDK',
                to: '/easy-language-sdk',
              },
              {
                label: '火山 SDK',
                to: '/voldp-sdk',
              },
            ],
          },
          {
            title: '社区',
            items: [
              {
                label: 'QQ群: 703623743',
                href: 'https://qm.qq.com/q/MVsl5VWokC',
              },
              {
                label: 'GitHub Issues',
                href: 'https://github.com/JadeViewDocs/JadeView/issues',
              },
              {
                label: 'Gitee',
                href: 'https://gitee.com/ilinxuan/JadeView_library',
              },
              {
                label: '邮箱',
                href: 'mailto:ihanlong@qq.com',
              },
            ],
          },
          {
            title: '友情链接',
            items: [
              {
                label: '镜芯API',
                href: 'https://api2.wer.plus/',
              },
              {
                label: '小维API',
                href: 'https://openapi.52vmy.cn/',
              },
              {
                label: '科利特尔网',
                href: 'https://www.colithel.com/',
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
