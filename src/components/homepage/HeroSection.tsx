import React from 'react';
import Link from '@docusaurus/Link';
import {
  WindowRegular,
  CodeRegular,
  PaintBrushRegular,
} from '@fluentui/react-icons';
import clsx from 'clsx';

const PRODUCTS = [
  {
    title: '窗口管理',
    link: '/guides/window-api',
    icon: WindowRegular,
    text: '轻松创建、管理和控制 WebView 窗口，支持自定义标题栏、窗口样式和多种窗口操作',
  },
  {
    title: '事件系统',
    link: '/guides/event-types',
    icon: CodeRegular,
    text: '完善的事件处理机制，支持窗口事件、导航事件和自定义事件，实现灵活的交互控制',
  },
  {
    title: '窗口样式',
    link: '/guides/window-styling',
    icon: PaintBrushRegular,
    text: '丰富的样式配置选项，支持自定义窗口大小、位置、标题栏、主题等各种属性',
  },
];

function HeroProduct({
  link,
  title,
  icon: Icon,
  text,
}: (typeof PRODUCTS)[0]) {
  return (
    <Link
      to={link}
      className={clsx(
        'jv-feature-card group cursor-pointer text-inherit hover:no-underline',
        'w-full sm:w-[340px] lg:w-[380px]'
      )}
    >
      <div className="jv-feature-card__icon">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="jv-feature-card__title group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="jv-feature-card__description">{text}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        了解更多 <span className="ml-1">→</span>
      </div>
    </Link>
  );
}

export default function HeroSection() {
  return (
    <div className="pb-14">
      <section className="no-underline-links px-4 pt-16 lg:py-0">
        <div className="flex flex-col items-center justify-between py-14">
          <h1 className="jv-hero__title mb-6">
            JadeView
          </h1>
          <p className="max-w-2xl text-center text-lg text-text-400">
            一个通用 Webview 库，专为 Web 界面而生：轻量、高性能、接口简单。
            <br />
            让程序流畅又美观，开发效率直线提升。
          </p>
          <div className="jv-hero__actions mt-8">
            <a 
              href="https://github.com/JadeViewDocs/library" 
              target="_blank" 
              rel="noopener noreferrer"
              className="jv-cta-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              获取 (GitHub)
            </a>
            <a 
              href="https://gitee.com/ilinxuan/JadeView_library" 
              target="_blank" 
              rel="noopener noreferrer"
              className="jv-btn-secondary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              获取 (Gitee)
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-wrap justify-center gap-6 px-4">
        {PRODUCTS.map((product) => (
          <HeroProduct {...product} key={product.title} />
        ))}
      </section>
    </div>
  );
}
