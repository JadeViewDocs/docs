// SDK 下载中心（从旧站 src/pages/sdks.jsx 迁移；布局按「宽行列表」重做，新站 lobehub 风格）。
// 逻辑保留：运行时从 GitHub API 拉取 SDK 列表，失败回退 Gitee；每个 SDK 读 Info.json / README.md / 文件列表；
//   下载统一走 Gitee API（base64 → blob，规避直链文件名带引号）。
// 布局：每个 SDK 一整行 —— 左侧字徽 + 标题/名称/平台架构作者，右侧版本下拉 + 下载按钮，下方更新日志/介绍可展开。
import { Markdown, Select, Skeleton, Tag } from '@lobehub/ui';
import { Segmented, theme as antdTheme } from 'antd';
import { createStyles } from 'antd-style';
import { Download } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { useT } from '../locales/strings';

const GITHUB_API = 'https://api.github.com/repos/JadeViewDocs/JadeView/contents/SDK';
const GITEE_API = 'https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/SDK';
const TIMEOUT_MS = 6000;
const BRAND = '#F97316';
// 字徽配色（按序轮换；与 SDK 下拉里 易/火 徽章同系）
const PALETTE = ['#F97316', '#e8533f', '#FBBF24', '#00b8a3', '#f59e0b'];

function fetchWithTimeout(url: string, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
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

type SdkFile = { name: string; download_url?: string; type?: string };
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
type Sdk = { dirName: string; info: SdkInfo | null; readme: string | null; allFiles: SdkFile[] };

const SdkRow = memo(function SdkRow({ sdk, index }: { sdk: Sdk; index: number }) {
  const { styles } = useStyles();
  const t = useT().sdkDownload;
  const info = sdk.info!;
  const [selectedVersion, setSelectedVersion] = useState(info.version);
  const [downloading, setDownloading] = useState(false);

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
  const giteeFilePath = matchedFile ? `SDK/${sdk.dirName}/SDK/${matchedFile.name}` : null;
  const downloadUrl = matchedFile?.download_url || null;
  const canDownload = Boolean(downloadUrl || giteeFilePath);

  const handleDownload = async () => {
    if (giteeFilePath && downloadName) {
      setDownloading(true);
      try {
        const res = await fetchWithTimeout(
          `https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/${giteeFilePath}`,
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
        if (downloadUrl) window.open(downloadUrl, '_blank');
      } finally {
        setDownloading(false);
      }
    } else if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

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
                {downloading ? t.fetching : t.download}
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
              <Markdown fontSize={13}>{sdk.readme}</Markdown>
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
    const giteeJson = async (filePath: string) => {
      const res = await fetchWithTimeout(`https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/${filePath}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.content) return null;
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder('utf-8').decode(bytes));
    };
    const giteeText = async (filePath: string) => {
      const res = await fetchWithTimeout(`https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/${filePath}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.content) return null;
      const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    };

    const fromGithub = async (): Promise<Sdk[]> => {
      const dirs = await (await fetchWithTimeout(GITHUB_API)).json();
      if (!Array.isArray(dirs)) return [];
      return Promise.all(
        dirs
          .filter((d: any) => d.type === 'dir')
          .map(async (dir: any): Promise<Sdk> => {
            const dirName = dir.name;
            const baseRaw = `https://raw.githubusercontent.com/JadeViewDocs/JadeView/main/SDK/${dirName}`;
            const filesApi = `https://api.github.com/repos/JadeViewDocs/JadeView/contents/SDK/${dirName}/SDK`;
            try {
              const [infoRes, readmeRes, filesRes] = await Promise.allSettled([
                fetchJson(`${baseRaw}/Info.json`),
                fetchText(`${baseRaw}/README.md`),
                fetchJson(filesApi),
              ]);
              const info = infoRes.status === 'fulfilled' ? infoRes.value : null;
              const readme = readmeRes.status === 'fulfilled' ? readmeRes.value : null;
              const allFiles =
                filesRes.status === 'fulfilled' && Array.isArray(filesRes.value)
                  ? filesRes.value.filter((f: any) => f.type === 'file')
                  : [];
              return { dirName, info, readme, allFiles };
            } catch {
              return { dirName, info: null, readme: null, allFiles: [] };
            }
          }),
      );
    };

    const fromGitee = async (): Promise<Sdk[]> => {
      const dirs = await (await fetchWithTimeout(GITEE_API)).json();
      if (!Array.isArray(dirs)) return [];
      return Promise.all(
        dirs
          .filter((d: any) => d.type === 'dir')
          .map(async (dir: any): Promise<Sdk> => {
            const dirName = dir.name;
            try {
              const [infoRes, readmeRes, filesRes] = await Promise.allSettled([
                giteeJson(`SDK/${dirName}/Info.json`),
                giteeText(`SDK/${dirName}/README.md`),
                fetchJson(`https://gitee.com/api/v5/repos/ilinxuan/JadeView_library/contents/SDK/${dirName}/SDK`),
              ]);
              const info = infoRes.status === 'fulfilled' ? infoRes.value : null;
              const readme = readmeRes.status === 'fulfilled' ? readmeRes.value : null;
              const allFiles =
                filesRes.status === 'fulfilled' && Array.isArray(filesRes.value)
                  ? filesRes.value.filter((f: any) => f.type === 'file')
                  : [];
              return { dirName, info, readme, allFiles };
            } catch {
              return { dirName, info: null, readme: null, allFiles: [] };
            }
          }),
      );
    };

    (async () => {
      let results: Sdk[] = [];
      try {
        results = await fromGithub();
      } catch {
        /* 静默降级 */
      }
      if (!results.some((s) => s.info)) {
        try {
          results = await fromGitee();
        } catch {
          /* 静默降级 */
        }
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
