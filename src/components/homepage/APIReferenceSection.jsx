import React from 'react';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import ThemedImage from '@theme/ThemedImage';

export default function APIReferenceSection() {
  return (
    <section className="no-underline-links relative px-6">
      <Head>
        <link rel="prefetch" href="/static/landing-page/api-ref-light.png" />
        <link rel="prefetch" href="/static/landing-page/api-ref-dark.png" />
      </Head>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-10 rounded-2xl bg-gradient-to-r from-black to-zinc-800 px-6 py-20 text-center text-white dark:from-zinc-100/90 dark:to-white dark:text-black lg:flex-row lg:p-20 lg:text-left">
        <Link
          href="/guides"
          aria-label="API Reference"
          className="absolute top-8 right-8 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-600 bg-zinc-600/40 transition-colors hover:border-primary hover:bg-primary/20 dark:border-zinc-300 dark:bg-transparent dark:hover:border-primary"
        >
          <svg className="h-6 w-6 text-zinc-400 transition-colors hover:text-primary dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="text-4xl">API 参考</h2>
          <p className="text-zinc-400">
            JadeView 提供简洁易用的 C 语言兼容 API，
            让你能够轻松地在各种编程语言和框架中集成 WebView 功能。
          </p>
          <Link
            href="/spec"
            className="inline-block rounded-lg border border-primary bg-primary/10 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            开始使用 JadeView API &rarr;
          </Link>
          <ul className="mt-10 flex list-none flex-col gap-4 text-left lg:pl-0">
            <li className="flex flex-col gap-1">
              <Link
                href="/api/#create-window"
                className="group inline-flex w-fit items-center rounded-lg border border-transparent px-3 py-2 font-jakarta font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10"
              >
                创建窗口
                <span className="ml-2 opacity-0 transition group-hover:translate-x-2 group-hover:opacity-100">
                  &rarr;
                </span>
              </Link>
              <div className="text-zinc-400">
                创建一个新的 WebView 窗口实例
              </div>
            </li>
            <li className="flex flex-col gap-1">
              <Link
                href="/api/#window-config"
                className="group inline-flex w-fit items-center rounded-lg border border-transparent px-3 py-2 font-jakarta font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10"
              >
                窗口配置
                <span className="ml-2 opacity-0 transition group-hover:translate-x-2 group-hover:opacity-100">
                  &rarr;
                </span>
              </Link>
              <div className="text-zinc-400">
                配置窗口大小、位置、标题栏等属性
              </div>
            </li>
            <li className="flex flex-col gap-1">
              <Link
                href="/api/#event-handling"
                className="group inline-flex w-fit items-center rounded-lg border border-transparent px-3 py-2 font-jakarta font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10"
              >
                事件处理
                <span className="ml-2 opacity-0 transition group-hover:translate-x-2 group-hover:opacity-100">
                  &rarr;
                </span>
              </Link>
              <div className="text-zinc-400">
                处理窗口事件和自定义事件回调
              </div>
            </li>
          </ul>
        </div>
        <div className="flex flex-1 justify-end">
          <ThemedImage
            sources={{
              light: '/static/landing-page/api-ref-light.png',
              dark: '/static/landing-page/api-ref-dark.png',
            }}
            alt="API Reference Preview"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
