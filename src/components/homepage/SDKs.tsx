import React from 'react';
import Link from '@docusaurus/Link';

interface SDKItem {
  name: string;
  to?: string;
  icon: React.ReactNode;
  bgColor: string;
}

function SDK({ icon, to, name, bgColor }: SDKItem) {
  const iconFg =
    bgColor === '#F7DF1E' ? '#0f172a' : '#ffffff';
  return (
    <Link to={to} className="jv-home-tile">
      <div
        className="jv-home-tile__icon"
        style={{ backgroundColor: bgColor, color: iconFg }}
      >
        {icon}
      </div>
      <span className="jv-home-tile__name">{name}</span>
    </Link>
  );
}

export default function SDKs() {
  const coreSDKs: SDKItem[] = [
    {
      name: 'Web SDK',
      to: '/web-sdk',
      icon: 'JS',
      bgColor: '#F7DF1E',
    },
    {
      name: 'Python SDK',
      to: '/python-sdk',
      icon: 'Py',
      bgColor: '#3776AB',
    },
    {
      name: '易语言 SDK',
      to: '/easy-language-sdk',
      icon: '易',
      bgColor: '#E74C3C',
    },
  ];

  const quickStart: SDKItem[] = [
    {
      name: '快速开始',
      to: '/spec/quickstart',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      bgColor: '#3b82f6',
    },
    {
      name: 'IPC 通信',
      to: '/guides/ipc-api',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      bgColor: '#2563eb',
    },
    {
      name: '更新日志',
      to: '/spec/changelog',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: '#1d4ed8',
    },
  ];

  return (
    <section className="jv-home-section" aria-labelledby="jv-home-sdk-heading">
      <header className="jv-home-section__header">
        <p className="jv-home-section__eyebrow">文档</p>
        <h2 id="jv-home-sdk-heading" className="jv-home-section__title">
          选择 SDK，开始集成
        </h2>
        <p className="jv-home-section__lead">
          多语言封装共享同一套原生能力，按你的技术栈选型即可。
        </p>
      </header>

      <div className="jv-home-subsection">
        <h3 className="jv-home-subsection__title">核心 SDK</h3>
        <p className="jv-home-subsection__desc">
          面向脚本与桌面应用的官方封装与示例。
        </p>
        <div className="jv-home-tile-grid">
          {coreSDKs.map((sdk) => (
            <SDK key={sdk.name} {...sdk} />
          ))}
        </div>
      </div>

      <div className="jv-home-subsection">
        <h3 className="jv-home-subsection__title">指南与动态</h3>
        <p className="jv-home-subsection__desc">
          入门路径、通信方式与版本变更，按需查阅。
        </p>
        <div className="jv-home-tile-grid">
          {quickStart.map((sdk) => (
            <SDK key={sdk.name} {...sdk} />
          ))}
        </div>
      </div>
    </section>
  );
}
