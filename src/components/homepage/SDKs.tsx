import React from 'react';
import Link from '@docusaurus/Link';

interface SDKItem {
  name: string;
  to?: string;
  icon: React.ReactNode;
  bgColor: string;
}

function SDK({ icon, to, name, bgColor }: SDKItem) {
  return (
    <Link
      to={to}
      className="flex cursor-pointer items-center rounded-lg border border-secondary-700 p-2.5 text-inherit hover:border-primary hover:text-primary hover:no-underline"
    >
      <div 
        className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: bgColor }}
      >
        {icon}
      </div>
      <span className="font-medium">{name}</span>
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
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      bgColor: '#10B981',
    },
    {
      name: 'IPC 通信',
      to: '/guides/ipc-api',
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
      bgColor: '#8B5CF6',
    },
    {
      name: '更新日志',
      to: '/spec/changelog',
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      bgColor: '#06B6D4',
    },
  ];

  return (
    <section className="mx-auto mb-32 flex w-full max-w-5xl flex-col p-4 py-0">
      <span className="mb-2 uppercase tracking-wider text-text-400">
        SDK 文档
      </span>

      <h3 className="mb-12 text-4xl">
        选择你需要的 SDK，开始构建应用
      </h3>

      <div className="mb-10">
        <h4 className="mb-2 text-2xl">核心 SDK</h4>

        <p className="mb-6 text-text-400">
          JadeView 提供多语言 SDK 支持，方便不同技术栈的开发者集成
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {coreSDKs.map((sdk) => (
            <SDK key={sdk.name} {...sdk} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-2xl">快速开始</h4>

        <p className="mb-6 text-text-400">
          查看快速入门指南，了解如何在项目中使用 JadeView
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {quickStart.map((sdk) => (
            <SDK key={sdk.name} {...sdk} />
          ))}
        </div>
      </div>
    </section>
  );
}
