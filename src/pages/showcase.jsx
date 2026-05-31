import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { useColorMode } from '@docusaurus/theme-common';



function FloatingPanel({ isDark, className }) {
  return (
    <div
      className={`absolute top-7 right-7 w-36 md:w-48 rounded-[1.29rem] py-2 px-4 shadow-2xl z-10
                 transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 pointer-events-none ${className || ''}`}
      style={{
        background: isDark ? 'rgba(44, 44, 46, 0.7)' : 'rgba(255, 255, 255, 0.6)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 items-center">
          <p className="text-xs font-semibold text-[#007AFF] mb-0">社区生态</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium mb-0" style={{ color: isDark ? '#F5F5F7' : '#1D1D1F' }}>与 JadeView 形成互补</p>
  
        </div>
     
      </div>
    </div>
  );
}

const showcaseItems = [
  {
    id: 1,
    name: 'Electron asar Gui工具',
    description: '一款简洁易用的 Electron asar 文件打包/解包工具。',
    link: 'https://github.com/HyJunYaa/Electron-asar-Gui-Tool',
    image: '/img/Electron_asar.jpg',
    hasOverlay: true,
  },
  
];

function ShowcaseContent() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <div
      className="min-h-screen p-6 sm:p-10 md:p-16 font-sans transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#000000' : '#F5F5F7',
        color: isDark ? '#F5F5F7' : '#1D1D1F',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* 页面头部：保持宽屏对齐 */}
      <div className="max-w-[1600px] mx-auto mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-center md:text-left mb-4">
          Built with JadeView.
        </h1>
        <p
          className="text-lg md:text-xl lg:text-2xl font-medium tracking-tight text-center md:text-left"
          style={{ color: '#86868B' }}
        >
          卓越的高性能应用，汇聚现代原生美学。
        </p>
      </div>

      {/* 案例网格：自适应多列高密度布局 */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-8">
        {showcaseItems.map((item) => (
          <div
            key={item.id}
            className="group rounded-[2rem] p-5 md:p-6 shadow-sm hover:shadow-lg transition-all duration-400 ease-out relative overflow-visible flex flex-col justify-between"
            style={{
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.02)'
            }}
          >
            {/* 上部核心内容区 */}
            <div className="flex flex-col flex-grow">
              {/* 主图容器：圆角微调至 1.5rem 以匹配更紧凑的卡片 */}
              <div
                className="w-full aspect-video rounded-[1.5rem] overflow-hidden mb-2 relative z-0 shadow-inner"
                style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                />
              </div>

              {/* 文本排版 */}
              <div className="px-1 mb-2 flex-grow">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
                  {item.name}
                </h2>
                <p
                  className="text-[15px] leading-relaxed font-normal"
                  style={{ color: '#86868B' }}
                >
                  {item.description}
                </p>
              </div>
            </div>

            {/* 下部独立操作按钮区：确保底部在多列平铺时绝对对齐 */}
            <div className="px-1 pt-2 w-full">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center bg-[#007AFF] hover:bg-[#0066CC] text-white hover:text-white !no-underline text-[15px] font-medium py-3 rounded-full transition-colors duration-200"
              >
                获取应用
              </a>
            </div>

            {/* 智能缩放的悬浮控制面板：仅桌面端显示 */}
            {item.hasOverlay && <FloatingPanel isDark={isDark} className="hidden md:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <Layout title="产品案例" wrapperClassName="showcase-page">
      <Head>
        <title>产品案例 | JadeView - Built with JadeView</title>
        <meta
          name="description"
          content="JadeView 产品案例展示 — 强大的桌面端应用，优雅的原生悬浮界面。"
        />
      </Head>
      <ShowcaseContent />
    </Layout>
  );
}