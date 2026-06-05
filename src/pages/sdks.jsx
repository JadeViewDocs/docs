import React, { useState, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { useColorMode } from '@docusaurus/theme-common';
import ReactMarkdown from 'react-markdown';

const GITHUB_API = 'https://api.github.com/repos/JadeViewDocs/JadeView/contents/SDK';
const GITEE_API = 'https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/SDK';
const TIMEOUT_MS = 6000;

// 带超时的 fetch
function fetchWithTimeout(url, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

// ---- macOS 风格版本下拉组件 ----
function VersionDropdown({ versions, selected, onChange, isDark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pillBg = isDark ? '#2C2C2E' : '#F5F5F7';
  const pillText = isDark ? '#F5F5F7' : '#1D1D1F';
  const menuBg = isDark ? '#2C2C2E' : '#FFFFFF';

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-11 flex items-center justify-between px-4 rounded-full text-[15px] font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0 focus:border-none"
        style={{ backgroundColor: pillBg, color: pillText, border: 'none', outline: 'none', boxShadow: 'none' }}
      >
        <span className="font-mono">v{selected}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="#86868B" strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden z-50 shadow-xl"
          style={{
            backgroundColor: menuBg,
            backdropFilter: 'blur(12px)',
            border: 'none'
          }}
        >
          <div className="p-1">
            {versions.map((v) => (
              <button
                key={v}
                onClick={() => { onChange(v); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium transition-all duration-200"
                style={{
                  color: v === selected ? '#007AFF' : (isDark ? '#F5F5F7' : '#1D1D1F'),
                  backgroundColor: v === selected ? (isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.08)') : 'transparent',
                   border: 'none',
                   borderRadius: '15px'
                }}
              >
                <span className="font-mono">v{v}</span>
                {v === selected && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#007AFF" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 折叠面板（changelog / SDK 介绍统一风格） ----
function PillAccordion({ items, isDark }) {
  const [openIndex, setOpenIndex] = useState(null);
  const pillBg = isDark ? '#2C2C2E' : '#F5F5F7';
  const pillText = isDark ? '#F5F5F7' : '#1D1D1F';

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full h-11 flex items-center justify-between px-4 rounded-full text-left"
            style={{ backgroundColor: pillBg, color: pillText, border: 'none' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: pillText,
                }}
              >
                {item.label}
              </span>
              <span className="text-xs" style={{ color: '#86868B' }}>{item.meta}</span>
            </div>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 10 6" stroke="#86868B" strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 1L5 5L9 1" />
            </svg>
          </button>
          {openIndex === i && (
            <div className="pt-3 pb-1 px-1 text-[13px] leading-relaxed" style={{ color: '#86868B' }}>
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- SDK 介绍折叠 ----
function SdkIntroToggle({ readme, isDark }) {
  const [show, setShow] = useState(false);
  const pillBg = isDark ? '#2C2C2E' : '#F5F5F7';
  const pillText = isDark ? '#F5F5F7' : '#1D1D1F';

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="w-full h-11 flex items-center justify-between px-4 rounded-full text-left"
        style={{ backgroundColor: pillBg, color: pillText, border: 'none' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#8E8E93' }}>
          SDK 介绍
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${show ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 10 6" stroke="#86868B" strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1L5 5L9 1" />
        </svg>
      </button>
      {show && (
        <div
          className="pt-3 pb-1 px-1 text-[13px] leading-relaxed font-normal max-w-none [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-[13px] [&_code]:text-[11px] [&_ul]:text-[13px] [&_li]:text-[13px]"
          style={{ color: '#86868B' }}
        >
          <ReactMarkdown>{readme}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function SdkCard({ sdk, isDark }) {
  if (!sdk.info) return null;

  const { info, allFiles } = sdk;
  const [selectedVersion, setSelectedVersion] = useState(info.version);
  const [downloading, setDownloading] = useState(false);

  const versions = [info.version];
  if (info.changelog) {
    info.changelog.forEach((c) => {
      if (!versions.includes(c.version)) versions.push(c.version);
    });
  }

  // 根据选中版本匹配文件：文件名包含版本号则匹配，否则回退第一个
  const matchedFile = React.useMemo(() => {
    if (!allFiles || allFiles.length === 0) return null;
    if (allFiles.length === 1) return allFiles[0];
    const found = allFiles.find((f) => f.name.includes(selectedVersion));
    return found || allFiles[0];
  }, [allFiles, selectedVersion]);

  const downloadName = matchedFile ? matchedFile.name.replace(/^['"]+|['"]+$/g, '') : null;
  const giteeFilePath = matchedFile ? `SDK/${sdk.dirName}/SDK/${matchedFile.name}` : null;
  const downloadUrl = matchedFile ? (matchedFile.download_url || null) : null;

  const changelogItems = (info.changelog || []).map((c) => ({
    label: `v${c.version}`,
    meta: c.updateTime,
    content: c.content,
  }));

  // 通过 Gitee API 获取文件并触发下载（避免直链文件名带引号）
  const handleGiteeDownload = async () => {
    if (!giteeFilePath || !downloadName) return;
    setDownloading(true);
    try {
      const res = await fetchWithTimeout(
        `https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/${giteeFilePath}`
      );
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      if (!data.content) throw new Error('No content');
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // API 获取失败，尝试直链回退
      if (downloadUrl) window.open(downloadUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="group rounded-2xl md:rounded-[2rem] p-4 md:p-5 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-400 ease-out flex flex-col justify-between"
      style={{
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      {/* 顶栏 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: isDark ? '#F5F5F7' : '#1D1D1F' }}>
            {info.title}
          </h2>
          <p className="text-sm font-mono" style={{ color: '#86868B' }}>{info.name}</p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-3"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#F5F5F7' : '#1D1D1F',
          }}
        >
          v{info.version}
        </span>
      </div>

      {/* 属性行 */}
      <div className="space-y-2 mb-5 text-sm" style={{ color: '#86868B' }}>
        {info.platform.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium shrink-0" style={{ color: isDark ? '#8E8E93' : '#8E8E93' }}>平台</span>
            <div className="flex flex-wrap gap-1.5">
              {info.platform.map((p) => (
                <span
                  key={p}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.1)',
                    color: '#007AFF',
                  }}
                >{p}</span>
              ))}
            </div>
          </div>
        )}
        {info.chipArch.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium shrink-0" style={{ color: isDark ? '#8E8E93' : '#8E8E93' }}>架构</span>
            <div className="flex flex-wrap gap-1.5">
              {info.chipArch.map((a) => (
                <span
                  key={a}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.1)',
                    color: '#34C759',
                  }}
                >{a}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium shrink-0" style={{ color: isDark ? '#8E8E93' : '#8E8E93' }}>作者</span>
          <span className="text-sm" style={{ color: isDark ? '#F5F5F7' : '#1D1D1F' }}>{info.author}</span>
        </div>
        {info.compatibleVersion && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium shrink-0" style={{ color: isDark ? '#8E8E93' : '#8E8E93' }}>兼容JadeView版本</span>
            <span className="text-sm" style={{ color: isDark ? '#F5F5F7' : '#1D1D1F' }}>{info.compatibleVersion}</span>
          </div>
        )}
      </div>

      {/* 版本选择 + 下载 */}
      <div className="mb-5">
        {(downloadUrl || giteeFilePath) ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <VersionDropdown
              versions={versions}
              selected={selectedVersion}
              onChange={setSelectedVersion}
              isDark={isDark}
            />
            <button
              onClick={() => {
                if (giteeFilePath) {
                  handleGiteeDownload();
                } else if (downloadUrl) {
                  window.open(downloadUrl, '_blank');
                }
              }}
              disabled={downloading}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-[#007AFF] hover:bg-[#0066CC] text-white text-[15px] font-medium rounded-full transition-colors duration-200 disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloading ? '获取中...' : '下载'}
            </button>
          </div>
        ) : (
          <div
            className="w-full h-11 inline-flex items-center justify-center text-[15px] font-medium rounded-full"
            style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7', color: '#86868B' }}
          >
            暂无下载文件
          </div>
        )}
      </div>

      {/* changelog */}
      {changelogItems.length > 0 && (
        <div className="pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#8E8E93' }}>更新日志</p>
          <PillAccordion items={changelogItems} isDark={isDark} />
        </div>
      )}

      {/* SDK 介绍 */}
      {sdk.readme && (
        <div className="pt-4 mt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <SdkIntroToggle readme={sdk.readme} isDark={isDark} />
        </div>
      )}
    </div>
  );
}

function SkeletonCard({ isDark }) {
  return (
    <div
      className="rounded-[2rem] p-5 md:p-6 animate-pulse flex flex-col"
      style={{
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex justify-between mb-5">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
          <div className="h-4 w-24 rounded" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
        </div>
        <div className="h-7 w-16 rounded-full" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
      </div>
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
          <div className="h-5 w-16 rounded-full" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
          <div className="h-5 w-12 rounded-full" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-11 flex-1 rounded-full" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
        <div className="h-11 flex-1 rounded-full" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }} />
      </div>
    </div>
  );
}

function SdksContent() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [sdks, setSdks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSdks() {
      // 封装 fetch JSON，检查响应状态
      const fetchJson = async (url) => {
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      };
      const fetchText = async (url) => {
        const res = await fetchWithTimeout(url);
        if (!res.ok) return null;
        return res.text();
      };

      // 通过 Gitee API 获取文件内容（避免 CORS），返回解析后的对象
      const fetchGiteeFile = async (filePath) => {
        const res = await fetchWithTimeout(`https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/${filePath}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.content) return null;
        const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder('utf-8').decode(bytes));
      };
      // 通过 Gitee API 获取文件文本内容
      const fetchGiteeText = async (filePath) => {
        const res = await fetchWithTimeout(`https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/${filePath}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.content) return null;
        const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
      };

      async function fetchFromGithub() {
        const dirsRes = await fetchWithTimeout(GITHUB_API);
        const dirs = await dirsRes.json();
        if (!Array.isArray(dirs)) return [];

        const sdkDirs = dirs.filter((d) => d.type === 'dir');
        const results = await Promise.all(
          sdkDirs.map(async (dir) => {
            const dirName = dir.name;
            const baseRaw = `https://raw.githubusercontent.com/JadeViewDocs/JadeView/main/SDK/${dirName}`;
            const filesApi = `https://api.github.com/repos/JadeViewDocs/JadeView/contents/SDK/${dirName}/SDK`;

            try {
              const [infoRes, readmeRes, sdkFilesRes] = await Promise.allSettled([
                fetchJson(`${baseRaw}/Info.json`),
                fetchText(`${baseRaw}/README.md`),
                fetchJson(filesApi),
              ]);

              const info = infoRes.status === 'fulfilled' ? infoRes.value : null;
              const readme = readmeRes.status === 'fulfilled' ? readmeRes.value : null;

              const allFiles = (sdkFilesRes.status === 'fulfilled' && Array.isArray(sdkFilesRes.value))
                ? sdkFilesRes.value.filter((f) => f.type === 'file')
                : [];
              let downloadUrl = null;
              let downloadName = null;
              let giteeFilePath = null;
              if (allFiles.length > 0) {
                downloadName = allFiles[0].name.replace(/^['"]+|['"]+$/g, '');
                downloadUrl = allFiles[0].download_url || null;
                // 下载默认走 Gitee API，避免直链文件名带引号问题
                giteeFilePath = `SDK/${dirName}/SDK/${allFiles[0].name}`;
              }

              return { dirName, info, readme, downloadUrl, downloadName, giteeFilePath, allFiles };
            } catch {
              return { dirName, info: null, readme: null, downloadUrl: null, downloadName: null, giteeFilePath: null, allFiles: [] };
            }
          })
        );
        return results;
      }

      async function fetchFromGitee() {
        const dirsRes = await fetchWithTimeout(GITEE_API);
        const dirs = await dirsRes.json();
        if (!Array.isArray(dirs)) return [];

        const sdkDirs = dirs.filter((d) => d.type === 'dir');
        const results = await Promise.all(
          sdkDirs.map(async (dir) => {
            const dirName = dir.name;

            try {
              const [infoRes, readmeRes, sdkFilesRes] = await Promise.allSettled([
                fetchGiteeFile(`SDK/${dirName}/Info.json`),
                fetchGiteeText(`SDK/${dirName}/README.md`),
                fetchJson(`https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/SDK/${dirName}/SDK`),
              ]);

              const info = infoRes.status === 'fulfilled' ? infoRes.value : null;
              const readme = readmeRes.status === 'fulfilled' ? readmeRes.value : null;

              const allFiles = (sdkFilesRes.status === 'fulfilled' && Array.isArray(sdkFilesRes.value))
                ? sdkFilesRes.value.filter((f) => f.type === 'file')
                : [];
              let downloadUrl = null;
              let downloadName = null;
              let giteeFilePath = null;
              if (allFiles.length > 0) {
                downloadName = allFiles[0].name.replace(/^['"]+|['"]+$/g, '');
                // Gitee 走 API 下载，避免直链文件名带引号问题
                giteeFilePath = `SDK/${dirName}/SDK/${allFiles[0].name}`;
              }

              return { dirName, info, readme, downloadUrl, downloadName, giteeFilePath, allFiles };
            } catch {
              return { dirName, info: null, readme: null, downloadUrl: null, downloadName: null, giteeFilePath: null, allFiles: [] };
            }
          })
        );
        return results;
      }

      try {
        // 先从 GitHub 获取数据，Gitee 作为回退（下载统一走 Gitee API）
        let sdkResults = [];
        try {
          sdkResults = await fetchFromGithub();
        } catch {
          // GitHub 请求失败，静默降级
        }

        // GitHub 结果为空则回退 Gitee
        const hasValidSdks = sdkResults.some((s) => s.info);
        if (!hasValidSdks) {
          try {
            sdkResults = await fetchFromGitee();
          } catch {
            // Gitee 请求失败，静默降级
          }
        }

        setSdks(sdkResults);
      } catch {
        // 静默降级
      } finally {
        setLoading(false);
      }
    }

    fetchSdks();
  }, []);

  const activeSdks = sdks.filter((s) => s.info);

  return (
    <div
      className="min-h-screen p-6 sm:p-10 md:p-16 font-sans transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#000000' : '#F5F5F7',
        color: isDark ? '#F5F5F7' : '#1D1D1F',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="max-w-[1600px] mx-auto mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-center md:text-left mb-4">
          SDK 下载中心
        </h1>
        <p
          className="text-lg md:text-xl lg:text-2xl font-medium tracking-tight text-center md:text-left"
          style={{ color: '#86868B' }}
        >
          选择对应平台的 SDK 模块进行下载，每个 SDK 均包含完整的 API 封装与示例代码。
        </p>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-8 items-start">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)
          : activeSdks.map((sdk) => <SdkCard key={sdk.dirName} sdk={sdk} isDark={isDark} />)}
      </div>

      {!loading && activeSdks.length === 0 && (
        <div className="text-center py-20" style={{ color: '#86868B' }}>
          <p className="text-lg font-medium">暂无 SDK 信息</p>
          <p className="text-sm mt-2">请稍后重试</p>
        </div>
      )}
    </div>
  );
}

export default function SdksPage() {
  return (
    <Layout title="SDK 下载" wrapperClassName="sdks-page">
      <Head>
        <title>SDK 下载 | JadeView</title>
        <meta
          name="description"
          content="JadeView SDK 下载中心 — 火山视窗、易语言等多平台 SDK 模块下载。"
        />
      </Head>
      <SdksContent />
    </Layout>
  );
}