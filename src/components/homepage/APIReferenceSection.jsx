import React from 'react';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import ThemedImage from '@theme/ThemedImage';

export default function APIReferenceSection() {
  return (
    <section className="jv-api-spotlight-wrap no-underline-links px-4 sm:px-6">
      <Head>
        <link rel="prefetch" href="/static/landing-page/api-ref-light.png" />
        <link rel="prefetch" href="/static/landing-page/api-ref-dark.png" />
      </Head>

      <div className="jv-api-spotlight">
        <Link
          to="/v2api"
          aria-label="打开 API 文档"
          className="jv-api-spotlight__external"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </Link>

        <div className="jv-api-spotlight__main">
          <p className="jv-home-section__eyebrow">API</p>
          <h2 className="jv-api-spotlight__title">C 语言兼容的宿主接口</h2>
          <p className="jv-api-spotlight__lead">
            简洁的初始化、窗口与事件模型，可在多种语言与框架中嵌入调用。
          </p>
          <Link to="/v2api" className="jv-api-spotlight__primary">
            浏览 API 文档
            <span className="jv-api-spotlight__primary-arrow" aria-hidden>
              →
            </span>
          </Link>

          <ul className="jv-api-spotlight__list">
            <li>
              <Link
                to="/v2api/window-api#创建窗口"
                className="jv-api-spotlight__row"
              >
                <span className="jv-api-spotlight__row-title">创建窗口</span>
                <span className="jv-api-spotlight__row-hint">create_webview_window 与新 frame_style</span>
              </Link>
            </li>
            <li>
              <Link
                to="/v2api/window-api#标题位置大小显示"
                className="jv-api-spotlight__row"
              >
                <span className="jv-api-spotlight__row-title">窗口配置</span>
                <span className="jv-api-spotlight__row-hint">标题、位置、大小、显示/隐藏</span>
              </Link>
            </li>
            <li>
              <Link
                to="/v2api/event-types"
                className="jv-api-spotlight__row"
              >
                <span className="jv-api-spotlight__row-title">事件系统</span>
                <span className="jv-api-spotlight__row-hint">jade_on 事件回调与返回值拦截</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="jv-api-spotlight__figure">
          <ThemedImage
            sources={{
              light: '/static/landing-page/api-ref-light.png',
              dark: '/static/landing-page/api-ref-dark.png',
            }}
            alt="API 文档界面预览"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
