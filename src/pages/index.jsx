import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

function CardSection({
  id,
  title,
  children,
  description,
  className,
  hasSubSections = false,
  HeadingTag = 'h3',
}) {
  return (
    <div
      className={clsx(
        'homepage-section',
        hasSubSections && 'has-sub-sections',
        className,
      )}
    >
      {title && <HeadingTag id={id}>{title}</HeadingTag>}
      {description && <p className="section-description">{description}</p>}
      <div className="section-content">{children}</div>
    </div>
  );
}

function Card({
  id,
  icon,
  title,
  description,
  to,
  tag,
  className,
}) {
  return (
    <Link to={to} className={clsx('homepage-card', className)}>
      {icon && <div className="icon">{icon}</div>}
      <div className="card-content">
        <div className="title" id={id}>
          {title}
        </div>
        {description && <div className="description">{description}</div>}
      </div>
      {tag && (
        <div className="tag absolute right-0 top-0 h-16 w-16">
          <span
            className="absolute right-[-28px] top-[-2px] w-[80px] rotate-45 transform bg-gray-600 py-1 text-center font-semibold text-white"
            style={{ backgroundColor: tag.color }}
            title={tag.description}
          >
            {tag.label}
          </span>
        </div>
      )}
    </Link>
  );
}

const JSIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const PythonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M8 12l2 2 4-4" />
  </svg>
);

const ReactIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);



const APIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const GuideCard = ({ title, text, icon: Icon, link }) => (
  <Link
    to={link}
    className="group flex cursor-pointer items-start gap-2 rounded-lg border-2 border-transparent p-3 text-inherit transition-colors hover:border-primary hover:text-primary"
  >
    <Icon className="h-6 w-6" />
    <div className="flex flex-col">
      <h4 className="mb-1 font-semibold">{title}</h4>
      <p className="mb-0 text-sm text-text-400">{text}</p>
    </div>
  </Link>
);

const guides = [
  {
    title: '快速开始',
    icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    text: '快速上手 JadeView，了解基本概念和功能',
    link: '/spec/quickstart',
  },
  {
    title: '窗口管理',
    icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M9 9h6v6" /></svg>,
    text: '学习如何创建、关闭和管理窗口',
    link: '/guides/window-api',
  },
  {
    title: '事件系统',
    icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
    text: '了解事件处理机制和回调函数',
    link: '/guides/event-types',
  },
];

export default function Homepage() {
  return (
    <Layout
      title="JadeView Documentation"
      wrapperClassName="homepage flex flex-col"
    >
      <Head>
        <title>JadeView Documentation - 基于 Rust 的 WebView 窗口库</title>
        <meta
          name="description"
          content="JadeView 是一个基于 Rust 开发的 WebView 窗口库，提供了 C 语言兼容的 API 接口。"
        />
      </Head>

      <div className="noise-bg pb-14">
        <section className="no-underline-links px-4 pt-16 lg:py-0">
          <div className="flex flex-col items-center justify-between py-14">
            <h2 className="mb-4 font-jakarta text-5xl font-bold">
              JadeView
            </h2>
            <p className="max-w-xl text-center text-text-400">
           一个通用Webview库，专为 Web界面而生：轻量、高敏率、接口简单。让程序流畅又美观，开发效率直线提升。
            </p>
            <div className="mt-8 flex gap-4">
              <a 
                href="https://github.com/JadeViewDocs/library" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 font-medium transition-colors"
              >
                获取(GitHub)
              </a>
              <a 
                href="https://gitee.com/ilinxuan/JadeView_library" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 font-medium transition-colors"
              >
                获取 (Gitee)
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto my-40 flex w-full max-w-5xl flex-col gap-10 p-4 py-0 md:flex-row md:gap-0">
          <div className="flex-1">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="m-0">快速入门指南</h3>
              <Link to="/guides" className="font-jakarta text-sm font-semibold">
                查看更多指南 &rarr;
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {guides.map((guide) => (
                <GuideCard {...guide} key={guide.title} icon={guide.icon} />
              ))}
            </div>
          </div>

          <div className="mx-8 block flex-shrink-0 bg-gradient-to-b from-transparent via-secondary-700 to-transparent hidden w-px md:block" />

          <div className="w-full md:max-w-sm">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="m-0">文档导航</h3>
              <Link to="/guides" className="font-jakarta text-sm font-semibold">
                全部文档 &rarr;
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                to="/guides"
                className="group flex cursor-pointer items-start gap-2 rounded-lg border-2 border-transparent p-3 text-inherit transition-colors hover:border-primary hover:text-primary"
              >
                <JSIcon />
                <div className="flex flex-col">
                  <h4 className="mb-1 font-semibold">核心 API</h4>
                  <p className="mb-0 text-sm text-text-400">初始化、消息循环、清理</p>
                </div>
              </Link>
              <Link
                to="/spec/local-web-resources"
                className="group flex cursor-pointer items-start gap-2 rounded-lg border-2 border-transparent p-3 text-inherit transition-colors hover:border-primary hover:text-primary"
              >
                <APIIcon />
                <div className="flex flex-col">
                  <h4 className="mb-1 font-semibold">核心设计</h4>
                  <p className="mb-0 text-sm text-text-400">快速了解基本设计理念</p>
                </div>
              </Link>
              <Link
                to="/spec/contributing-sdk"
                className="group flex cursor-pointer items-start gap-2 rounded-lg border-2 border-transparent p-3 text-inherit transition-colors hover:border-primary hover:text-primary"
              >
                <ReactIcon />
                <div className="flex flex-col">
                  <h4 className="mb-1 font-semibold">贡献Sdk</h4>
                  <p className="mb-0 text-sm text-text-400">指导您如何贡献您的SDK</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-32 flex w-full max-w-5xl flex-col p-4 py-0">
          <span className="mb-2 uppercase tracking-wider text-text-400">
            SDK 文档
          </span>

          <h3 className="mb-12 text-4xl">
            选择你需要的 SDK
          </h3>

          <div className="mb-10">
            <h4 className="mb-2 text-2xl">Web SDK</h4>

            <p className="mb-6 text-text-400">
              JadeView 提供了完整的 JavaScript/TypeScript SDK，方便开发者快速集成
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link
                to="/web-sdk"
                className="flex cursor-pointer items-center rounded-lg border border-secondary-700 p-2.5 text-inherit hover:border-primary hover:text-primary hover:no-underline"
              >
                <div className="mr-2 h-7 w-7 flex items-center justify-center rounded bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                  <JSIcon />
                </div>
                <span className="font-medium">Web SDK</span>
              </Link>
            </div>
          </div>

          <div className="mb-10">
            <h4 className="mb-2 text-2xl">易语言 SDK</h4>

            <p className="mb-6 text-text-400">
              JadeView 提供了易语言 SDK，方便易语言开发者快速集成和使用
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link
                to="/easy-language-sdk"
                className="flex cursor-pointer items-center rounded-lg border border-secondary-700 p-2.5 text-inherit hover:border-primary hover:text-primary hover:no-underline"
              >
                <div className="mr-2 h-7 w-7 flex items-center justify-center rounded bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <APIIcon />
                </div>
                <span className="font-medium">易语言 SDK</span>
              </Link>
            </div>
          </div>

          <div className="mb-10">
            <h4 className="mb-2 text-2xl">Python SDK</h4>

            <p className="mb-6 text-text-400">
              JadeView 提供了 Python SDK，使用 Python 创建桌面应用，提供窗口管理、IPC 通信和路由系统
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link
                to="/python-sdk"
                className="flex cursor-pointer items-center rounded-lg border border-secondary-700 p-2.5 text-inherit hover:border-primary hover:text-primary hover:no-underline"
              >
                <div className="mr-2 h-7 w-7 flex items-center justify-center rounded bg-gradient-to-br from-blue-500 to-green-500 text-white">
                  <PythonIcon />
                </div>
                <span className="font-medium">Python SDK</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Plus+Jakarta+Sans:wght@200..800&display=swap');

        .homepage {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .font-jakarta {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .noise-bg {
          background-image: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.6)
          ),
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0);
          background-size: 100% 100%, 20px 20px;
        }

        html[data-theme='dark'] .noise-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 20px 20px;
        }

        .text-text-400 {
          color: var(--ifm-color-secondary);
        }

        .homepage-section {
          margin: 3rem 0;
        }

        .homepage-section h3 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--ifm-color-primary);
        }

        .section-description {
          font-size: 1.125rem;
          color: var(--ifm-color-secondary);
          margin-bottom: 2rem;
          max-width: 800px;
        }

        .section-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .homepage-card {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          background: var(--ifm-background-surface-color);
          border: 1px solid var(--ifm-color-emphasis-300);
          border-radius: 1rem;
          text-decoration: none;
          color: var(--ifm-color-content);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .homepage-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border-color: var(--ifm-color-primary);
          text-decoration: none;
        }

        .homepage-card .icon {
          width: 48px;
          height: 48px;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #2160fd 0%, #1a90ff 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .homepage-card .card-content {
          flex: 1;
        }

        .homepage-card .title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--ifm-color-primary);
        }

        .homepage-card .description {
          font-size: 0.875rem;
          color: var(--ifm-color-secondary);
          line-height: 1.6;
        }

        .homepage-card .tag {
          position: absolute;
          right: 0;
          top: 0;
          width: 64px;
          height: 64px;
          overflow: hidden;
        }

        .homepage-card .tag span {
          position: absolute;
          right: -28px;
          top: -2px;
          width: 80px;
          transform: rotate(45deg);
          background: #2160fd;
          color: white;
          padding: 2px 0;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .section-content {
            grid-template-columns: 1fr;
          }

          .homepage-section h3 {
            font-size: 1.5rem;
          }

          .section-description {
            font-size: 1rem;
          }
        }

        .no-underline-links a {
          text-decoration: none !important;
        }

        .no-underline-links a:hover {
          text-decoration: none !important;
        }

        .no-underline-links a * {
          text-decoration: none !important;
        }

        .no-underline-links a:hover * {
          text-decoration: none !important;
        }

        .border-secondary-700 {
          border-color: var(--ifm-color-emphasis-300);
        }

        .border-primary {
          border-color: var(--ifm-color-primary);
        }

        .bg-gradient-to-b {
          background: linear-gradient(to bottom, transparent, var(--ifm-color-emphasis-300), transparent);
        }

        .via-secondary-700 {
          --tw-gradient-to: transparent;
          --tw-gradient-stops: var(--tw-gradient-from), var(--ifm-color-emphasis-300), var(--tw-gradient-to);
        }

        /* 浅色主题适配 */
        [data-theme='light'] .noise-bg {
          background-image: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.02)
          ),
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0);
          background-size: 100% 100%, 20px 20px;
        }

        [data-theme='light'] .text-text-400 {
          color: #6b7280;
        }

        [data-theme='light'] h2,
        [data-theme='light'] h3,
        [data-theme='light'] h4 {
          color: #111827;
        }

        [data-theme='light'] .homepage-card {
          background: #ffffff;
          border-color: #e5e7eb;
          color: #111827;
        }

        [data-theme='light'] .homepage-card .title {
          color: #111827;
        }

        [data-theme='light'] .homepage-card .description {
          color: #6b7280;
        }

        [data-theme='light'] .border-secondary-700 {
          border-color: #e5e7eb;
        }

        [data-theme='light'] .border-primary {
          border-color: #2160fd;
        }

        [data-theme='light'] .bg-gradient-to-b {
          background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
        }

        /* 深色主题适配 */
        [data-theme='dark'] .noise-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 20px 20px;
        }

        [data-theme='dark'] .text-text-400 {
          color: #9ca3af;
        }

        [data-theme='dark'] h2,
        [data-theme='dark'] h3,
        [data-theme='dark'] h4 {
          color: #e5e7eb;
        }

        [data-theme='dark'] .homepage-card {
          background: #1f2937;
          border-color: #374151;
          color: #e5e7eb;
        }

        [data-theme='dark'] .homepage-card .title {
          color: #e5e7eb;
        }

        [data-theme='dark'] .homepage-card .description {
          color: #9ca3af;
        }

        [data-theme='dark'] .border-secondary-700 {
          border-color: #374151;
        }

        [data-theme='dark'] .border-primary {
          border-color: #2160fd;
        }

        [data-theme='dark'] .bg-gradient-to-b {
          background: linear-gradient(to bottom, transparent, #374151, transparent);
        }

        /* 移除所有链接的下划线 */
        a {
          text-decoration: none !important;
        }

        a:hover {
          text-decoration: none !important;
        }

        a * {
          text-decoration: none !important;
        }

        a:hover * {
          text-decoration: none !important;
        }
      `}</style>
      <div className="lantern">
        <div className="lantern-left">
          <div className="lantern-container">
            <div className="lantern-top-rope"></div>
            <div className="lantern-top"></div>
            <div className="lantern-center">
              <div className="lantern-line">
                <div className="lantern-text-wrap">
                  <div className="lantern-text">一马当先</div>
                </div>
              </div>
            </div>
            <div className="lantern-bottom"></div>
            <div className="lantern-bottom-rope"></div>
          </div>
        </div>
        <div className="lantern-right">
          <div className="lantern-container">
            <div className="lantern-top-rope"></div>
            <div className="lantern-top"></div>
            <div className="lantern-center">
              <div className="lantern-line">
                <div className="lantern-text-wrap">
                  <div className="lantern-text">代码如仙</div>
                </div>
              </div>
            </div>
            <div className="lantern-bottom"></div>
            <div className="lantern-bottom-rope"></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
