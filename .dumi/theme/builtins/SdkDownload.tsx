// SDK 下载中心（从旧站 src/pages/sdks.jsx 迁移；布局按「宽行列表」重做，新站 lobehub 风格）。
// 数据源：AtomGit（ituyang/JadeView）优先，取不到有效数据时回退 GitHub。
//   选 AtomGit 是实测结论：api.atomgit.com 的 v5 接口对公开仓库免认证，且回显任意 Origin
//   （预检 204、Allow-Credentials: true）；raw 支持 Range 并原样返回二进制，所以列表与文件都能由浏览器直连。
//   注意必须用 api.atomgit.com 域名，atomgit.com/api/v5 不带任何 Access-Control-* 头，跨域会被拦。
// 布局：每个 SDK 一整行 —— 左侧字徽 + 标题/名称/平台架构作者，右侧版本下拉 + 下载按钮，下方更新日志/介绍可展开。
import { Select, Skeleton, Tag } from '@lobehub/ui';
import { Segmented, theme as antdTheme } from 'antd';
import { createStyles } from 'antd-style';
import { Download } from 'lucide-react';
import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../locales/strings';

// Markdown（@lobehub/ui）内部静态依赖 katex/shiki，builtins 又是静态注册的，
// 会拖进所有页面的首屏 chunk。lazy 化后只在展开 SDK 介绍时加载。
const Markdown = lazy(() => import('@lobehub/ui').then((m) => ({ default: m.Markdown })));

// 主源：AtomGit。公开仓库免认证，raw 可直接取二进制。
const ATOMGIT_REPO = 'ituyang/JadeView';
const ATOMGIT_REF = 'main';
const ATOMGIT_API = `https://api.atomgit.com/api/v5/repos/${ATOMGIT_REPO}`;
const ATOMGIT_RAW = `${ATOMGIT_API}/raw`;
const ATOMGIT_CONTENTS = `${ATOMGIT_API}/contents`;

// 兜底源：GitHub（api 走 contents，文件走 raw）。
const GITHUB_API = 'https://api.github.com/repos/JadeViewDocs/JadeView/contents/SDK';
const GITHUB_RAW = 'https://raw.githubusercontent.com/JadeViewDocs/JadeView/main';

const TIMEOUT_MS = 8000;
// 下载不能只卡「总时长」：慢网下 15MB 可能要几分钟，但断流后挂死更糟。
// 改成停滞超时 —— 只要还有字节到达就续命，连续 STALL 无进展才中断并回退直链。
const DOWNLOAD_STALL_MS = 90_000;
const BRAND = '#F97316';
// 字徽配色（按序轮换；与 SDK 下拉里 易/火 徽章同系）
const PALETTE = ['#F97316', '#e8533f', '#FBBF24', '#00b8a3', '#f59e0b'];

function fetchWithTimeout(url: string, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

type SdkSource = 'atomgit' | 'github';
type SdkFile = { name: string; type?: string };
type Changelog = { version: string; updateTime?: string; content?: string };
type SdkInfo = {
  title: string;
  name: string;
  version: string;
  platform?: string[];
  chipArch?: string[];
  author?: string;
  compatibleVersion?: string;
  changelog?: Changelog[];
};
type Sdk = {
  dirName: string;
  source: SdkSource;
  info: SdkInfo | null;
  readme: string | null;
  allFiles: SdkFile[];
};

/** 逐段编码，保留路径分隔符（文件名可能含中文/空格）。 */
function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/** 仓库内路径 → 可直接 GET 的地址。 */
function rawUrl(source: SdkSource, path: string) {
  const p = encodePath(path);
  if (source === 'atomgit') return `${ATOMGIT_RAW}/${p}?ref=${ATOMGIT_REF}`;
  return `${GITHUB_RAW}/${p}`;
}

/**
 * 带进度地读完整个响应体。
 * AtomGit 的 raw 是 chunked 传输、不给 content-length，所以总长可能为 0；
 * 此时仍然走流式读取，让调用方按已接收字节数展示进度。
 */
async function readBlobWithProgress(
  res: Response,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Blob> {
  const total = Number(res.headers.get('content-length') || 0);
  if (!res.body) return res.blob();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress?.(received, total);
    }
  }
  return new Blob(chunks as unknown as BlobPart[], { type: 'application/octet-stream' });
}

/**
 * 取回 SDK 文件并产出 blob。
 * 两个源都直接返回二进制，读流的同时汇报进度，保证按钮上能看到下载百分比。
 * 超时是「停滞」语义：每次收到数据都重置计时器，避免慢网误杀、又能从断流中脱身。
 */
async function fetchSdkBlob(
  source: SdkSource,
  path: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Blob> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), DOWNLOAD_STALL_MS);
  };
  arm();
  try {
    const res = await fetch(rawUrl(source, path), { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await readBlobWithProgress(res, (loaded, total) => {
      arm();
      onProgress?.(loaded, total);
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const useStyles = createStyles(({ css, token, responsive }) => ({
  root: css`
    width: 100%;
  `,
  header: css`
    margin-bottom: 28px;
  `,
  title: css`
    margin: 0 0 8px;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    color: ${token.colorText};

    ${responsive.mobile} {
      font-size: 26px;
    }
  `,
  subtitle: css`
    margin: 0;
    font-size: 16px;
    color: ${token.colorTextSecondary};
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: 14px;
  `,
  row: css`
    padding: 18px 20px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};

    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: ${token.colorBorder};
      box-shadow: ${token.boxShadowTertiary};
    }
  `,
  main: css`
    display: flex;
    gap: 16px;
    align-items: center;

    ${responsive.mobile} {
      flex-wrap: wrap;
    }
  `,
  icon: css`
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 46px;
    height: 46px;
    border-radius: 12px;

    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
  `,
  info: css`
    overflow: hidden;
    flex: 1;
    min-width: 0;
  `,
  titleLine: css`
    display: flex;
    align-items: center;
    gap: 10px;
  `,
  name: css`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  pkg: css`
    font-family: ${token.fontFamilyCode};
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
  verBadge: css`
    flex-shrink: 0;

    padding: 2px 9px;
    border-radius: 9999px;

    font-family: ${token.fontFamilyCode};
    font-size: 11px;
    font-weight: 600;
    color: ${token.colorText};

    background: ${token.colorFillSecondary};
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    align-items: center;

    margin-top: 8px;

    font-size: 13px;
    color: ${token.colorTextSecondary};
  `,
  metaText: css`
    color: ${token.colorTextSecondary};
  `,
  actions: css`
    display: flex;
    flex-shrink: 0;
    gap: 10px;
    align-items: center;

    ${responsive.mobile} {
      flex-basis: 100%;
      margin-top: 4px;
    }
  `,
  select: css`
    width: 120px;

    ${responsive.mobile} {
      flex: 1;
    }
  `,
  downloadBtn: css`
    cursor: pointer;

    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;

    height: 36px;
    padding-inline: 20px;
    border: none;
    border-radius: 9999px;

    font-size: 14px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;

    background: ${BRAND};

    transition: background 0.2s ease, opacity 0.2s ease;

    &:hover {
      background: #EA680C;
    }

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }

    ${responsive.mobile} {
      flex: 1;
    }
  `,
  noFile: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    height: 36px;
    padding-inline: 16px;
    border-radius: 9999px;

    font-size: 13px;
    color: ${token.colorTextTertiary};

    background: ${token.colorFillQuaternary};
  `,
  segWrap: css`
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  expand: css`
    margin-top: 12px;
    padding: 14px 16px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};
  `,
  clItem: css`
    & + & {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed ${token.colorBorderSecondary};
    }
  `,
  clHead: css`
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 4px;
  `,
  clVer: css`
    font-family: ${token.fontFamilyCode};
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  clDate: css`
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
  clBody: css`
    font-size: 13px;
    line-height: 1.7;
    color: ${token.colorTextSecondary};
    white-space: pre-wrap;
  `,
  empty: css`
    padding: 80px 0;
    font-size: 16px;
    color: ${token.colorTextTertiary};
    text-align: center;
  `,
}));

const SdkRow = memo(function SdkRow({ sdk, index }: { sdk: Sdk; index: number }) {
  const { styles } = useStyles();
  const t = useT().sdkDownload;
  const info = sdk.info!;
  const [selectedVersion, setSelectedVersion] = useState(info.version);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const lastTick = useRef(0);

  // 「更新日志 / SDK 介绍」用 Segmented 切换显示
  const segOptions = useMemo(
    () => [
        ...(sdk.readme ? [{ label: t.about, value: 'readme' }] : []),
      ...((info.changelog || []).length ? [{ label: t.changelog, value: 'changelog' }] : []),
    ],
    [info.changelog, sdk.readme],
  );
  const [seg, setSeg] = useState<string | undefined>(segOptions[0]?.value);

  const versions = useMemo(() => {
    const vs = [info.version];
    (info.changelog || []).forEach((c) => {
      if (!vs.includes(c.version)) vs.push(c.version);
    });
    return vs;
  }, [info]);

  const matchedFile = useMemo(() => {
    const files = sdk.allFiles;
    if (!files || files.length === 0) return null;
    if (files.length === 1) return files[0];
    return files.find((f) => f.name.includes(selectedVersion)) || files[0];
  }, [sdk.allFiles, selectedVersion]);

  const downloadName = matchedFile ? matchedFile.name.replace(/^['"]+|['"]+$/g, '') : null;
  const filePath = downloadName ? `SDK/${sdk.dirName}/SDK/${downloadName}` : null;
  const canDownload = Boolean(filePath);

  const handleDownload = async () => {
    if (!filePath || !downloadName) return;
    setDownloading(true);
    setProgress(null);
    lastTick.current = 0;
    try {
      const blob = await fetchSdkBlob(sdk.source, filePath, (loaded, total) => {
        // 分块很密，节流到约 8 次/秒，避免每来一块就整行重渲染
        const now = performance.now();
        if (now - lastTick.current < 120) return;
        lastTick.current = now;
        setProgress({ loaded, total });
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // 立即 revoke 会让部分浏览器的下载中断，延后释放。
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // 兜底：直接打开 raw 地址（AtomGit 的 content-disposition 是 inline，文件名可能不理想，但至少能拿到文件）
      window.open(rawUrl(sdk.source, filePath), '_blank', 'noopener');
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  // 有总长就报百分比；AtomGit 走 chunked 没有总长，退化为已接收体积。
  const progressLabel = (() => {
    if (!progress) return null;
    if (progress.total > 0) {
      return `${Math.min(99, Math.round((progress.loaded / progress.total) * 100))}%`;
    }
    if (progress.loaded > 0) {
      return `${(progress.loaded / 1048576).toFixed(1)}MB`;
    }
    return null;
  })();

  const badgeChar = (info.title || info.name || '?').trim().charAt(0).toUpperCase();
  const badgeColor = PALETTE[index % PALETTE.length];

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <span className={styles.icon} style={{ background: badgeColor }}>
          {badgeChar}
        </span>

        <div className={styles.info}>
          <div className={styles.titleLine}>
            <h3 className={styles.name}>{info.title}</h3>
            <span className={styles.verBadge}>v{info.version}</span>
          </div>
          <span className={styles.pkg}>{info.name}</span>
          <div className={styles.meta}>
            {(info.platform || []).map((p) => (
              <Tag color="blue" key={p}>
                {p}
              </Tag>
            ))}
            {(info.chipArch || []).map((a) => (
              <Tag color="green" key={a}>
                {a}
              </Tag>
            ))}
            {info.author && <span className={styles.metaText}>{t.authorPrefix}{info.author}</span>}
            {info.compatibleVersion && (
              <span className={styles.metaText}>{t.compatPrefix}{info.compatibleVersion}</span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {canDownload ? (
            <>
              <Select
                className={styles.select}
                onChange={(v: any) => setSelectedVersion(v)}
                options={versions.map((v) => ({ label: `v${v}`, value: v }))}
                size="small"
                value={selectedVersion}
              />
              <button className={styles.downloadBtn} disabled={downloading} onClick={handleDownload} type="button">
                <Download size={16} />
                {downloading
                  ? progressLabel
                    ? `${t.fetching} ${progressLabel}`
                    : t.fetching
                  : t.download}
              </button>
            </>
          ) : (
            <span className={styles.noFile}>{t.noFile}</span>
          )}
        </div>
      </div>

      {segOptions.length > 0 && (
        <div className={styles.segWrap}>
          <Segmented onChange={(v) => setSeg(v as string)} options={segOptions}  shape="round" value={seg} />

          {seg === 'changelog' && (
            <div className={styles.expand}>
              {(info.changelog || []).map((c, i) => (
                <div className={styles.clItem} key={i}>
                  <div className={styles.clHead}>
                    <span className={styles.clVer}>v{c.version}</span>
                    {c.updateTime && <span className={styles.clDate}>{c.updateTime}</span>}
                  </div>
                  {c.content && <div className={styles.clBody}>{c.content}</div>}
                </div>
              ))}
            </div>
          )}

          {seg === 'readme' && sdk.readme && (
            <div className={styles.expand}>
              <Suspense>
                <Markdown fontSize={13}>{sdk.readme}</Markdown>
              </Suspense>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default memo(function SdkDownload() {
  const { styles } = useStyles();
  const t = useT().sdkDownload;
  antdTheme.useToken();
  const [sdks, setSdks] = useState<Sdk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchJson = async (url: string) => {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };
    const fetchText = async (url: string) => {
      const res = await fetchWithTimeout(url);
      if (!res.ok) return null;
      return res.text();
    };
    const dirNames = (items: any): string[] =>
      Array.isArray(items)
        ? items.filter((d: any) => d.type === 'dir').map((d: any) => String(d.name))
        : [];
    const fileList = (items: any): SdkFile[] =>
      Array.isArray(items)
        ? items
            .filter((f: any) => f.type === 'file')
            .map((f: any) => ({ name: String(f.name), type: String(f.type) }))
        : [];

    type Adapter = {
      source: SdkSource;
      listDirs: () => Promise<string[]>;
      readInfo: (dir: string) => Promise<SdkInfo | null>;
      readReadme: (dir: string) => Promise<string | null>;
      listFiles: (dir: string) => Promise<SdkFile[]>;
    };

    /** 各源目录/文件结构同构，只有端点不同；统一走同一条收集流程，避免字段漂移。 */
    const collect = async ({
      source,
      listDirs,
      readInfo,
      readReadme,
      listFiles,
    }: Adapter): Promise<Sdk[]> => {
      const dirs = await listDirs();
      return Promise.all(
        dirs.map(async (dirName): Promise<Sdk> => {
          const [infoRes, readmeRes, filesRes] = await Promise.allSettled([
            readInfo(dirName),
            readReadme(dirName),
            listFiles(dirName),
          ]);
          return {
            dirName,
            source,
            info: infoRes.status === 'fulfilled' ? infoRes.value : null,
            readme: readmeRes.status === 'fulfilled' ? readmeRes.value : null,
            allFiles: filesRes.status === 'fulfilled' ? filesRes.value : [],
          };
        }),
      );
    };

    const fromAtomgit = () =>
      collect({
        source: 'atomgit',
        listDirs: async () => dirNames(await fetchJson(`${ATOMGIT_CONTENTS}/SDK?ref=${ATOMGIT_REF}`)),
        readInfo: (d) => fetchJson(`${ATOMGIT_RAW}/SDK/${encodePath(d)}/Info.json?ref=${ATOMGIT_REF}`),
        readReadme: (d) => fetchText(`${ATOMGIT_RAW}/SDK/${encodePath(d)}/README.md?ref=${ATOMGIT_REF}`),
        listFiles: async (d) =>
          fileList(await fetchJson(`${ATOMGIT_CONTENTS}/SDK/${encodePath(d)}/SDK?ref=${ATOMGIT_REF}`)),
      });

    const fromGithub = () =>
      collect({
        source: 'github',
        listDirs: async () => dirNames(await fetchJson(GITHUB_API)),
        readInfo: (d) => fetchJson(`${GITHUB_RAW}/SDK/${encodePath(d)}/Info.json`),
        readReadme: (d) => fetchText(`${GITHUB_RAW}/SDK/${encodePath(d)}/README.md`),
        listFiles: async (d) => fileList(await fetchJson(`${GITHUB_API}/${encodePath(d)}/SDK`)),
      });

    (async () => {
      let results: Sdk[] = [];
      for (const load of [fromAtomgit, fromGithub]) {
        try {
          results = await load();
        } catch {
          results = []; // 静默降级到下一个源
        }
        if (results.some((s) => s.info)) break; // 拿到有效数据就不再重试
      }
      if (alive) {
        setSdks(results);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const activeSdks = sdks.filter((s) => s.info);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>
          {t.subtitle}
        </p>
      </div>

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className={styles.row} key={i}>
              <Skeleton active paragraph={{ rows: 2 }} title />
            </div>
          ))}
        </div>
      ) : activeSdks.length > 0 ? (
        <div className={styles.list}>
          {activeSdks.map((sdk, i) => (
            <SdkRow index={i} key={sdk.dirName} sdk={sdk} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>{t.empty}</div>
      )}
    </div>
  );
});
