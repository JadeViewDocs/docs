import React from 'react';

export default function HomeFooter({ className }) {
  return (
    <footer className={`jv-home-footer ${className || ''}`}>
      <div className="jv-home-footer__inner">
        <div className="jv-home-footer__top">
          <a href="/" className="jv-home-footer__brand">
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--jv-text-primary)' }}>JadeView</span>
          </a>
          <p className="jv-home-footer__tagline">Windows WebView 宿主 · Rust 与 WebView2 · C 语言 API</p>
        </div>

        <div className="jv-home-footer__grid">
          <div>
            <h4 className="jv-home-footer__col-title">文档</h4>
            <div className="jv-home-footer__nav">
              <a href="/spec/quickstart" className="jv-home-footer__link">快速开始</a>
              <a href="/v2api" className="jv-home-footer__link">API 参考</a>
              <a href="/releases/" className="jv-home-footer__link">更新日志</a>
            </div>
          </div>
          <div>
            <h4 className="jv-home-footer__col-title">SDK</h4>
            <div className="jv-home-footer__nav">
              <a href="/web-sdk" className="jv-home-footer__link">Web SDK</a>
              <a href="/python-sdk" className="jv-home-footer__link">Python SDK</a>
              <a href="/easy-language-sdk" className="jv-home-footer__link">易语言 SDK</a>
            </div>
          </div>
          <div>
            <h4 className="jv-home-footer__col-title">社区</h4>
            <div className="jv-home-footer__nav">
              <a href="https://qm.qq.com/q/MVsl5VWokC" className="jv-home-footer__link">QQ群: 703623743</a>
              <a href="https://github.com/JadeViewDocs/JadeView/issues" className="jv-home-footer__link">GitHub Issues</a>
              <a href="mailto:tuyang@jade.run" className="jv-home-footer__link">邮箱</a>
            </div>
          </div>
        </div>

        <hr className="jv-home-footer__divider" />

        <div className="jv-home-footer__bottom">
          <p className="jv-home-footer__copy">2025 JadeView. 保留所有权利。</p>
          <div className="jv-home-footer__social">
            <a href="https://github.com/JadeViewDocs/JadeView" className="jv-home-footer__social-btn" aria-label="GitHub">
              <svg className="jv-home-footer__social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://gitee.com/ilinxuan/JadeView_library" className="jv-home-footer__social-btn" aria-label="Gitee">
              <svg className="jv-home-footer__social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.592a.593.593 0 0 1 1.185 0v.593a2.965 2.965 0 0 1-2.963 2.963H8.593A2.965 2.965 0 0 1 5.63 14.223V9.778a2.965 2.965 0 0 1 2.963-2.964h9.482z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}