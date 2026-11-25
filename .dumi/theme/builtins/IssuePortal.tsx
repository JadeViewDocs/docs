import { Button } from '@lobehub/ui';
import { Input, Select, Tag, message, theme } from 'antd';
import { createStyles } from 'antd-style';
import { Link } from 'dumi';
import {
  ArrowUpRight,
  BookOpen,
  Bug,
  Check,
  Copy,
  FileCode2,
  GitBranch,
  Lightbulb,
  Package,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useMemo, useState } from 'react';
import { scrollContainer, scrollItem, scrollViewport } from '../components/scrollIn';
import { localeHref, useLocaleBase, useT } from '../locales/strings';

const BRAND = '#F97316';
const ACCENT = '#FBBF24';

type RepoId = 'jadeview' | 'playground' | 'docs';
type IssueKind = 'bug' | 'feature' | 'release' | 'host';

interface RepoMeta {
  id: RepoId;
  slug: string;
  githubNew: string;
}

const REPOS: Record<RepoId, RepoMeta> = {
  jadeview: {
    id: 'jadeview',
    slug: 'JadeViewDocs/JadeView',
    githubNew: 'https://github.com/JadeViewDocs/JadeView/issues/new',
  },
  playground: {
    id: 'playground',
    slug: 'tuyangJs/jadeview-playground',
    githubNew: 'https://github.com/tuyangJs/jadeview-playground/issues/new',
  },
  docs: {
    id: 'docs',
    slug: 'JadeViewDocs/docs',
    githubNew: 'https://github.com/JadeViewDocs/docs/issues/new',
  },
};

const KIND_LABELS: Record<IssueKind, string[]> = {
  bug: ['bug'],
  feature: ['enhancement'],
  release: ['bug', 'release'],
  host: ['enhancement', 'host'],
};

const KIND_PREFIX: Record<IssueKind, string> = {
  bug: '[Bug]: ',
  feature: '[Feature]: ',
  release: '[Release]: ',
  host: '[Host]: ',
};

const OS_PRESETS = ['Windows 11 x64', 'Windows 10 x64', 'Windows ARM64', 'Linux x64 (WebKitGTK)'];
const SDK_OPTIONS = ['C / C++ ABI', 'Python', 'Go', 'Rust', 'Web / JS', '易语言 SDK', '火山 SDK', 'Other'];

const useStyles = createStyles(({ css, token, responsive }) => ({
  root: css`
    box-sizing: border-box;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 18px clamp(20px, 4vw, 48px) 48px;
    position: relative;
    z-index: 1;

    ${responsive.mobile} {
      padding: 8px 14px 28px;
    }
  `,
  hero: css`
    position: relative;
    overflow: hidden;
    margin-bottom: 24px;
    padding: 44px 36px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 24px;
    background:
      radial-gradient(56% 90% at 10% -10%, color-mix(in srgb, ${BRAND} 20%, transparent), transparent 68%),
      radial-gradient(50% 80% at 92% 10%, color-mix(in srgb, ${ACCENT} 16%, transparent), transparent 70%),
      ${token.colorBgContainer};

    ${responsive.mobile} {
      padding: 28px 20px;
      border-radius: 18px;
    }
  `,
  heroInner: css`
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  `,
  eyebrow: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    padding: 4px 13px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: ${BRAND};
    background: color-mix(in srgb, ${BRAND} 12%, transparent);
    border: 1px solid color-mix(in srgb, ${BRAND} 30%, transparent);
  `,
  title: css`
    margin: 0 0 10px;
    font-size: 38px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.025em;
    color: ${token.colorText};

    ${responsive.mobile} {
      font-size: 26px;
    }
  `,
  subtitle: css`
    margin: 0;
    max-width: 640px;
    font-size: 15px;
    line-height: 1.75;
    color: ${token.colorTextSecondary};
  `,
  repoChips: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  repoChip: css`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
    background: color-mix(in srgb, ${token.colorBgElevated} 84%, transparent);
    border: 1px solid ${token.colorBorderSecondary};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: ${token.colorText};
      border-color: color-mix(in srgb, ${BRAND} 45%, transparent);
    }

    &[data-active='true'] {
      color: ${BRAND};
      font-weight: 600;
      background: color-mix(in srgb, ${BRAND} 13%, ${token.colorBgContainer});
      border-color: color-mix(in srgb, ${BRAND} 55%, transparent);
      box-shadow: 0 0 0 1px color-mix(in srgb, ${BRAND} 20%, transparent);
    }
  `,
  kindGrid: css`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 24px;

    @media (max-width: 920px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  `,
  kindCard: css`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 18px;
    text-align: left;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, ${BRAND} 45%, transparent);
      box-shadow: ${token.boxShadowTertiary};
    }

    &[data-active='true'] {
      border-color: ${BRAND};
      background: linear-gradient(
        155deg,
        color-mix(in srgb, ${BRAND} 10%, ${token.colorBgContainer}),
        ${token.colorBgContainer} 65%
      );
      box-shadow: 0 8px 24px color-mix(in srgb, ${BRAND} 14%, transparent);
    }
  `,
  kindTop: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  `,
  kindIcon: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: ${BRAND};
    background: color-mix(in srgb, ${BRAND} 12%, transparent);
  `,
  kindCheck: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    color: #fff;
    background: ${BRAND};
  `,
  kindTitle: css`
    font-size: 15px;
    font-weight: 650;
    color: ${token.colorText};
  `,
  kindDesc: css`
    font-size: 13px;
    line-height: 1.55;
    color: ${token.colorTextSecondary};
  `,
  workspace: css`
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    gap: 22px;
    align-items: start;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
    }
  `,
  panel: css`
    padding: 24px;
    border-radius: 20px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};

    ${responsive.mobile} {
      padding: 18px 16px;
      border-radius: 16px;
    }
  `,
  stickyPanel: css`
    position: sticky;
    top: 96px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    @media (max-width: 960px) {
      position: static;
    }
  `,
  sectionTitle: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 18px;
    font-size: 17px;
    font-weight: 650;
    color: ${token.colorText};
  `,
  field: css`
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 18px;

    &:last-child {
      margin-bottom: 0;
    }
  `,
  fieldRow: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  `,
  label: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  reqTag: css`
    font-size: 11px;
    font-weight: 600;
    color: ${BRAND};
  `,
  presetRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
  `,
  presetBtn: css`
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorFillQuaternary};
    color: ${token.colorTextSecondary};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: ${token.colorText};
      border-color: color-mix(in srgb, ${BRAND} 45%, transparent);
    }

    &[data-active='true'] {
      color: ${BRAND};
      border-color: color-mix(in srgb, ${BRAND} 50%, transparent);
      background: color-mix(in srgb, ${BRAND} 10%, transparent);
    }
  `,
  previewBox: css`
    margin: 0;
    padding: 16px;
    min-height: 220px;
    max-height: 420px;
    overflow: auto;
    border-radius: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorFillQuaternary};
    color: ${token.colorTextSecondary};
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  actions: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `,
  primaryCta: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 44px;
    padding: 0 18px;
    border: 0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #fff !important;
    text-decoration: none !important;
    background: linear-gradient(135deg, ${BRAND}, #ea580c);
    box-shadow: 0 6px 20px color-mix(in srgb, ${BRAND} 30%, transparent);
    cursor: pointer;
    transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease;

    &:hover:not(:disabled) {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `,
  secondaryRow: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  `,
  ghostBtn: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 38px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgElevated};
    color: ${token.colorText};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
      border-color: color-mix(in srgb, ${BRAND} 50%, transparent);
      color: ${BRAND};
    }
  `,
  helperCard: css`
    padding: 18px 20px;
    border-radius: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
  `,
  helperTitle: css`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 650;
    color: ${token.colorText};
  `,
  helperList: css`
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  `,
  helperLink: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 8px;
    color: ${token.colorTextSecondary} !important;
    text-decoration: none !important;
    font-size: 13px;
    background: ${token.colorFillQuaternary};
    transition: color 0.15s ease, background 0.15s ease;

    &:hover {
      color: ${BRAND} !important;
      background: color-mix(in srgb, ${BRAND} 8%, transparent);
    }
  `,
  hintText: css`
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: ${token.colorTextTertiary};
  `,
}));

interface ReleaseOptionItem {
  tag_name: string;
  name?: string;
  prerelease?: boolean;
}

function readQueryState(): { repo: RepoId; kind: IssueKind } {
  if (typeof window === 'undefined') return { repo: 'jadeview', kind: 'bug' };
  const params = new URLSearchParams(window.location.search);
  const rawRepo = (params.get('repo') || '').toLowerCase();
  const rawKind = (params.get('type') || params.get('kind') || '').toLowerCase();
  const repo: RepoId = rawRepo === 'playground' || rawRepo === 'docs' ? rawRepo : 'jadeview';
  const kind: IssueKind =
    rawKind === 'feature' || rawKind === 'release' || rawKind === 'host' ? rawKind : 'bug';
  return { repo, kind };
}

export default memo(function IssuePortal() {
  const { styles } = useStyles();
  const { token } = theme.useToken();
  const t = useT().issuePortal;
  const base = useLocaleBase();
  const reduce = useReducedMotion();
  const [messageApi, contextHolder] = message.useMessage();

  const [repo, setRepo] = useState<RepoId>(() => readQueryState().repo);
  const [kind, setKind] = useState<IssueKind>(() => readQueryState().kind);
  const [title, setTitle] = useState('');
  const [osEnv, setOsEnv] = useState('Windows 11 x64');
  const [version, setVersion] = useState<string>('');
  const [releases, setReleases] = useState<ReleaseOptionItem[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [sdk, setSdk] = useState('C / C++ ABI');
  const [details, setDetails] = useState('');
  const [expected, setExpected] = useState('');
  const [logs, setLogs] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/releases/data.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { releases?: ReleaseOptionItem[] } | null) => {
        if (!active || !Array.isArray(data?.releases)) return;
        const list = data.releases.filter((item) => item && item.tag_name);
        setReleases(list);
        if (list.length > 0) {
          setVersion((prev) => prev || list[0].tag_name);
        }
      })
      .catch(() => {
        // 离线或拉取失败时静默保持空列表
      })
      .finally(() => {
        if (active) setReleasesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const latestStableTag = useMemo(
    () => releases.find((item) => !item.prerelease)?.tag_name,
    [releases],
  );

  const versionOptions = useMemo(
    () =>
      releases.map((item) => ({
        value: item.tag_name,
        label: item.tag_name,
        prerelease: Boolean(item.prerelease),
        isLatestStable: item.tag_name === latestStableTag,
      })),
    [latestStableTag, releases],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('repo', repo);
    params.set('type', kind);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [repo, kind]);

  const activeRepo = REPOS[repo];
  const fullTitle = useMemo(() => {
    const clean = title.trim();
    if (!clean) return `${KIND_PREFIX[kind]}${t.defaultTitleHint}`;
    return clean.startsWith('[') ? clean : `${KIND_PREFIX[kind]}${clean}`;
  }, [kind, title, t.defaultTitleHint]);

  const markdownBody = useMemo(() => {
    const sections = [
      `### ${t.md.envSection}`,
      `- **${t.md.targetRepo}**: \`${activeRepo.slug}\``,
      `- **${t.md.type}**: ${t.kinds[kind].title}`,
      `- **${t.md.os}**: ${osEnv.trim() || 'Windows 11 x64'}`,
      `- **${t.md.version}**: ${version.trim() || t.md.notProvided}`,
      `- **${t.md.sdk}**: ${sdk || 'C / C++ ABI'}`,
      '',
      `### ${kind === 'feature' || kind === 'host' ? t.md.backgroundSection : t.md.stepsSection}`,
      details.trim() || t.md.placeholderDetails,
    ];

    if (expected.trim() || kind === 'bug' || kind === 'release') {
      sections.push(
        '',
        `### ${kind === 'feature' || kind === 'host' ? t.md.proposalSection : t.md.expectedSection}`,
        expected.trim() || t.md.notProvided,
      );
    }

    if (logs.trim()) {
      sections.push('', `### ${t.md.logsSection}`, '```text', logs.trim(), '```');
    }

    sections.push('', `> ${t.md.footerNote}`);
    return sections.join('\n');
  }, [activeRepo.slug, details, expected, kind, logs, osEnv, sdk, t, version]);

  const githubUrl = useMemo(() => {
    const params = new URLSearchParams({
      title: fullTitle,
      labels: KIND_LABELS[kind].join(','),
      body: markdownBody,
    });
    return `${activeRepo.githubNew}?${params.toString()}`;
  }, [activeRepo.githubNew, fullTitle, kind, markdownBody]);

  const readyToSubmit = title.trim().length > 0 && details.trim().length > 0;

  const copyMarkdown = async (showToast = true) => {
    const fullDoc = `# ${fullTitle}\n\n${markdownBody}`;
    try {
      await navigator.clipboard.writeText(fullDoc);
      setCopied(true);
      if (showToast) messageApi.success(t.copiedToast);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      messageApi.error(t.copyFailedToast);
    }
  };

  const reveal = reduce
    ? {}
    : ({ initial: 'hidden', animate: 'show', viewport: scrollViewport } as const);

  const kindCards: Array<{ key: IssueKind; icon: typeof Bug }> = [
    { key: 'bug', icon: Bug },
    { key: 'feature', icon: Lightbulb },
    { key: 'release', icon: Package },
    { key: 'host', icon: FileCode2 },
  ];

  return (
    <div className={styles.root}>
      {contextHolder}
      <motion.section className={styles.hero} variants={scrollContainer} {...reveal}>
        <div className={styles.heroInner}>
          <div>
            <motion.span className={styles.eyebrow} variants={scrollItem}>
              <Sparkles size={13} />
              {t.eyebrow}
            </motion.span>
            <motion.h1 className={styles.title} variants={scrollItem}>
              {t.title}
            </motion.h1>
            <motion.p className={styles.subtitle} variants={scrollItem}>
              {t.subtitle}
            </motion.p>
          </div>

          <motion.div className={styles.repoChips} variants={scrollItem}>
            {(['jadeview', 'playground', 'docs'] as RepoId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={styles.repoChip}
                data-active={repo === id ? 'true' : undefined}
                onClick={() => setRepo(id)}
              >
                <GitBranch size={14} />
                <span>{t.repos[id]}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.div className={styles.kindGrid} variants={scrollContainer} {...reveal}>
        {kindCards.map(({ key, icon: Icon }) => {
          const active = kind === key;
          const info = t.kinds[key];
          return (
            <motion.button
              key={key}
              type="button"
              variants={scrollItem}
              className={styles.kindCard}
              data-active={active ? 'true' : undefined}
              onClick={() => setKind(key)}
            >
              <div className={styles.kindTop}>
                <span className={styles.kindIcon}>
                  <Icon size={18} />
                </span>
                {active ? (
                  <span className={styles.kindCheck} aria-hidden="true">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                ) : null}
              </div>
              <span className={styles.kindTitle}>{info.title}</span>
              <span className={styles.kindDesc}>{info.desc}</span>
            </motion.button>
          );
        })}
      </motion.div>

      <div className={styles.workspace}>
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span>{t.formTitle}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>
              {activeRepo.slug}
            </span>
          </h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="issue-title">
              <span>{t.fields.titleLabel}</span>
              <span className={styles.reqTag}>{t.required}</span>
            </label>
            <Input
              id="issue-title"
              size="large"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              prefix={
                <span style={{ color: BRAND, fontWeight: 600, fontSize: 12 }}>
                  {KIND_PREFIX[kind]}
                </span>
              }
              placeholder={t.fields.titlePlaceholder}
              maxLength={120}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="issue-os">
              <span>{t.fields.osLabel}</span>
            </label>
            <Input
              id="issue-os"
              value={osEnv}
              onChange={(e) => setOsEnv(e.target.value)}
              placeholder="Windows 11 x64 / Ubuntu 24.04"
            />
            <div className={styles.presetRow}>
              {OS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={styles.presetBtn}
                  data-active={osEnv === preset ? 'true' : undefined}
                  onClick={() => setOsEnv(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field} style={{ marginBottom: 0 }}>
              <label className={styles.label} htmlFor="issue-version">
                <span>{t.fields.versionLabel}</span>
              </label>
              <Select
                id="issue-version"
                showSearch
                allowClear
                loading={releasesLoading}
                value={version || undefined}
                placeholder={releasesLoading ? t.fields.versionLoading : t.fields.versionPlaceholder}
                optionFilterProp="value"
                onChange={(val) => setVersion(val || '')}
                options={versionOptions}
                optionRender={(opt) => {
                  const data = opt.data as {
                    value: string;
                    prerelease: boolean;
                    isLatestStable: boolean;
                  };
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        width: '100%',
                      }}
                    >
                      <span>{data.value}</span>
                      {data.isLatestStable ? (
                        <Tag color="green" style={{ marginInlineEnd: 0 }}>
                          {t.fields.latestStable}
                        </Tag>
                      ) : data.prerelease ? (
                        <Tag color="orange" style={{ marginInlineEnd: 0 }}>
                          {t.fields.prerelease}
                        </Tag>
                      ) : null}
                    </span>
                  );
                }}
              />
            </div>

            <div className={styles.field} style={{ marginBottom: 0 }}>
              <label className={styles.label} htmlFor="issue-sdk">
                <span>{t.fields.sdkLabel}</span>
              </label>
              <Select
                id="issue-sdk"
                value={sdk}
                onChange={(val) => setSdk(val)}
                options={SDK_OPTIONS.map((item) => ({ label: item, value: item }))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="issue-details">
              <span>
                {kind === 'feature' || kind === 'host'
                  ? t.fields.detailsLabelFeature
                  : t.fields.detailsLabelBug}
              </span>
              <span className={styles.reqTag}>{t.required}</span>
            </label>
            <Input.TextArea
              id="issue-details"
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                kind === 'feature' || kind === 'host'
                  ? t.fields.detailsPlaceholderFeature
                  : t.fields.detailsPlaceholderBug
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="issue-expected">
              <span>
                {kind === 'feature' || kind === 'host'
                  ? t.fields.expectedLabelFeature
                  : t.fields.expectedLabelBug}
              </span>
            </label>
            <Input.TextArea
              id="issue-expected"
              rows={3}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder={
                kind === 'feature' || kind === 'host'
                  ? t.fields.expectedPlaceholderFeature
                  : t.fields.expectedPlaceholderBug
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="issue-logs">
              <span>{t.fields.logsLabel}</span>
            </label>
            <Input.TextArea
              id="issue-logs"
              rows={4}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder={t.fields.logsPlaceholder}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12 }}
            />
          </div>
        </div>

        <div className={styles.stickyPanel}>
          <div className={styles.panel}>
            <div className={styles.sectionTitle}>
              <span>{t.previewTitle}</span>
              <Button size="small" type="text" onClick={() => void copyMarkdown(true)}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span style={{ marginLeft: 4 }}>{copied ? t.copied : t.copyMd}</span>
              </Button>
            </div>

            <pre className={styles.previewBox}>{`# ${fullTitle}\n\n${markdownBody}`}</pre>

            <div className={styles.actions} style={{ marginTop: 16 }}>
              {readyToSubmit ? (
                <a
                  className={styles.primaryCta}
                  href={githubUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{t.submitGithub}</span>
                  <ArrowUpRight size={16} />
                </a>
              ) : (
                <button
                  type="button"
                  className={styles.primaryCta}
                  disabled
                  title={t.fillRequiredTip}
                >
                  <span>{t.submitGithub}</span>
                  <ArrowUpRight size={16} />
                </button>
              )}

              <div className={styles.secondaryRow}>
                <button type="button" className={styles.ghostBtn} onClick={() => void copyMarkdown(true)}>
                  <Copy size={14} />
                  <span>{t.copyAll}</span>
                </button>

                <a
                  className={styles.ghostBtn}
                  href="https://qm.qq.com/q/MVsl5VWokC"
                  rel="noreferrer"
                  target="_blank"
                  style={{ textDecoration: 'none' }}
                >
                  <span>{t.qqGroup}</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>

              {!readyToSubmit ? <p className={styles.hintText}>{t.fillRequiredTip}</p> : null}
            </div>
          </div>

          <div className={styles.helperCard}>
            <h3 className={styles.helperTitle}>
              <BookOpen size={15} color={BRAND} />
              <span>{t.troubleshootTitle}</span>
            </h3>
            <ul className={styles.helperList}>
              {t.troubleshootLinks.map((item) => (
                <li key={item.link}>
                  <Link
                    className={styles.helperLink}
                    to={localeHref(base, item.link) || item.link}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
