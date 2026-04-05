import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import HeroSection from '@site/src/components/homepage/HeroSection';
import SDKs from '@site/src/components/homepage/SDKs';
import APIReferenceSection from '@site/src/components/homepage/APIReferenceSection';

/** 首页背景柔光（轻量漂移动效，见 custom.css，尊重 prefers-reduced-motion） */
function AmbientBackground() {
  return <div className="jv-ambient-bg" aria-hidden />;
}

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

      <div className="homepage-wrapper">
        <AmbientBackground />
        
        <div className="homepage-content-wrapper">
          {/* Hero Section - 产品特性展示 */}
          <HeroSection />
          
          {/* SDKs Section - SDK 选择 */}
          <SDKs />

          
          {/* API Reference Section - API 文档 */}
          <APIReferenceSection />
          

          
          {/* Help Section - 帮助 */}

        </div>
      </div>

    </Layout>
  );
}
