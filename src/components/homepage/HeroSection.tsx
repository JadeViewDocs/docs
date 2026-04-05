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
      <div className="jv-feature-card__cta">
        <span>了解更多</span>
        <span className="jv-feature-card__cta-arrow" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}

export default function HeroSection() {
  return (
    <div className="jv-home-hero">
      <section className="jv-home-hero__intro no-underline-links">
        <div className="jv-home-hero__inner jv-home-hero__inner--enter">
          <p className="jv-home-hero__eyebrow">Rust · WebView2 · C 语言 API</p>
          <h1 className="jv-hero__title">JadeView</h1>
          <p className="jv-hero__subtitle">
            面向 Windows 的通用 WebView 宿主库：轻量、高性能、接口清晰。
            <span className="jv-hero__subtitle-break">
              用熟悉的前端技术做出流畅、现代的桌面界面。
            </span>
          </p>
          <div className="jv-hero__actions">
            <a
              href="https://github.com/JadeViewDocs/library"
              target="_blank"
              rel="noopener noreferrer"
              className="jv-cta-button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="jv-hero__btn-icon"
                aria-hidden
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              GitHub 获取源码
            </a>
            <a
              href="https://gitee.com/ilinxuan/JadeView_library"
              target="_blank"
              rel="noopener noreferrer"
              className="jv-btn-secondary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="jv-hero__btn-icon"
                aria-hidden
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Gitee 镜像
            </a>
          </div>
        </div>
      </section>

      <section
        className="jv-home-hero__features jv-home-hero__features--enter"
        aria-labelledby="jv-home-features-heading"
      >
        <div className="jv-home-hero__features-head">
          <h2 id="jv-home-features-heading" className="jv-home-section-label">
            核心能力
          </h2>
          <p className="jv-home-hero__features-desc">
            窗口、事件与样式一站集成，文档与示例对齐维护。
          </p>
        </div>
        <div className="jv-home-hero__features-grid">
          {PRODUCTS.map((product) => (
            <HeroProduct {...product} key={product.title} />
          ))}
        </div>
      </section>
    </div>
  );
}
