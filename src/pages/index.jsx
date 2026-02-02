import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import HomeFooter from '@site/src/components/homepage/HomeFooter';
import HeroSection from '@site/src/components/homepage/HeroSection';
import SDKs from '@site/src/components/homepage/SDKs';
import GuidesAndSamples from '@site/src/components/homepage/GuidesAndSamples';
import APIReferenceSection from '@site/src/components/homepage/APIReferenceSection';
import ResourcesSection from '@site/src/components/homepage/ResourcesSection';
import CommunitySection from '@site/src/components/homepage/CommunitySection';
import HelpSection from '@site/src/components/homepage/HelpSection';

// Ambient Background Blobs Component - Enhanced with more visual interest
function AmbientBackground() {
  return (
    <div className="jv-ambient-bg">
      <div className="jv-blob jv-blob-1" />
      <div className="jv-blob jv-blob-2" />
      <div className="jv-blob jv-blob-3" />
      <div className="jv-blob jv-blob-4" />
      <div className="jv-blob jv-blob-5" />
      {/* Grid pattern overlay */}
      <div className="jv-grid-overlay" />
    </div>
  );
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

      {/* Lantern Effect */}
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
