import React from 'react';
import Link from '@docusaurus/Link';
import { Github } from '@styled-icons/boxicons-logos';
import ThemedImage from '@theme/ThemedImage';

const products = [
  { name: '镜芯API', href: 'https://api2.wer.plus' },
  { name: '小维API', href: 'https://openapi.52vmy.cn' },
  { name: '科利特尔网', href: 'https://www.colithel.com' },
];

const developers = [
  { name: '文档', href: '/guides' },
  { name: '更新日志', href: '/spec/changelog' },
  { name: '快速开始', href: '/spec/quickstart' },
];

const community = [
  { name: 'QQ群: 703623743', href: 'https://qm.qq.com/q/MVsl5VWokC' },
  { name: 'issues', href: 'https://github.com/JadeViewDocs/library/issues' },
  { name: '邮箱', href: 'mailto:ihanlong@qq.com' },
];

function FooterLink({ name, href }) {
  const isInternal = href.startsWith('/') && !href.startsWith('//');
  const className = 'jv-home-footer__link';
  if (isInternal) {
    return (
      <Link to={href} className={className}>
        {name}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      {...(href.startsWith('http')
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      {name}
    </a>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div className="jv-home-footer__col">
      <h3 className="jv-home-footer__col-title">{title}</h3>
      <nav className="jv-home-footer__nav" aria-label={title}>
        {links.map((item) => (
          <FooterLink key={item.name} {...item} />
        ))}
      </nav>
    </div>
  );
}

export default function HomeFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="jv-home-footer">
      <div className="jv-home-footer__accent" aria-hidden />
      <div className="jv-home-footer__inner">
        <div className="jv-home-footer__top">
          <Link to="/" className="jv-home-footer__brand">
            <ThemedImage
              alt="JadeView"
              className="jv-home-footer__logo"
              sources={{
                light: '/logo/light.svg',
                dark: '/logo/dark.svg',
              }}
            />
          </Link>
          <p className="jv-home-footer__tagline">
            Windows WebView 宿主 · Rust 与 WebView2 · C 语言 API
          </p>
        </div>

        <div className="jv-home-footer__grid">
          <FooterColumn title="友情链接" links={products} />
          <FooterColumn title="开发者" links={developers} />
          <FooterColumn title="社群" links={community} />
        </div>

        <div className="jv-home-footer__divider" role="presentation" />

        <div className="jv-home-footer__bottom">
          <p className="jv-home-footer__copy">
            &copy; {year} JadeView. 保留所有权利。
          </p>
          <div className="jv-home-footer__social">
            <Link
              href="https://github.com/JadeViewDocs/docs"
              className="jv-home-footer__social-btn"
              aria-label="JadeView 文档仓库 GitHub"
            >
              <Github className="jv-home-footer__social-icon" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
