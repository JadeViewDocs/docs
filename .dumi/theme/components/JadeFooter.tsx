import { createStyles } from 'antd-style';
import { ArrowUpRight } from 'lucide-react';
import { memo } from 'react';
// @ts-ignore 主题 store（仅取 locales / 当前语言 / pathname，不引 'dumi'）
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
import { localeHref, useLocaleBase, useT } from '../locales/strings';
import Logo3D from './JadeLogo3D';
import ThemeToggle from './JadeThemeToggle';

const LANG_LABEL: Record<string, string> = { 'zh-CN': '中文', 'en-US': 'EN' };

const useStyles = createStyles(({ css }) => ({
  footer: css`
    --footer-bg: #faf9f7;
    --footer-text: #26221e;
    --footer-muted: #625c56;
    --footer-line: #24170f17;
    --footer-hover: #f1ede8;
    --footer-current: #ede7e0;
    --footer-accent: #a54b13;

    html[data-prefers-color='dark'] & {
      --footer-bg: #111110;
      --footer-text: #f5f1ed;
      --footer-muted: #b3aca4;
      --footer-line: #ffffff1c;
      --footer-hover: #ffffff14;
      --footer-current: #ffffff24;
      --footer-accent: #ffab70;
    }

    border-top: 1px solid var(--footer-line);
    background: radial-gradient(ellipse at 12% 0%, rgba(249, 115, 22, 0.07), transparent 46%),
      var(--footer-bg);
    color: var(--footer-text);
    padding-bottom: env(safe-area-inset-bottom, 0px);

    & a:focus-visible,
    & button:focus-visible {
      outline: 2px solid var(--footer-accent);
      outline-offset: 3px;
    }
  `,
  shell: css`
    box-sizing: border-box;
    max-width: 1200px;
    margin-inline: auto;
    padding-inline: clamp(20px, 4vw, 48px);
  `,
  masthead: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px 24px;
    padding-block: 24px 18px;
    border-bottom: 1px solid var(--footer-line);

    @media (max-width: 540px) {
      flex-wrap: wrap;
      padding-block: 20px 16px;
    }
  `,
  brand: css`
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    color: var(--footer-text);
    text-decoration: none;

    &:hover {
      color: var(--footer-text);
    }
  `,
  brandName: css`
    display: block;
    font-size: 23px;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.035em;
  `,
  tagline: css`
    display: block;
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--footer-muted);
  `,
  preferences: css`
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 10px;
  `,
  languages: css`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--footer-line);
    border-radius: 9px;
  `,
  languageLink: css`
    display: grid;
    place-items: center;
    min-height: 28px;
    min-width: 42px;
    padding: 0 7px;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.25;
    color: var(--footer-muted);
    text-decoration: none;

    &:hover {
      color: var(--footer-text);
      background: var(--footer-hover);
    }

    &[aria-current='page'] {
      color: var(--footer-text);
      background: var(--footer-current);
      font-weight: 600;
    }

    @media (pointer: coarse) {
      min-height: 34px;
      min-width: 44px;
    }
  `,
  directory: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px clamp(20px, 4vw, 52px);
    padding-block: 20px 22px;

    @media (max-width: 540px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: 16px;
      padding-block: 16px;

      & > :last-child {
        grid-column: 1 / -1;

        ul {
          display: flex;
          flex-wrap: wrap;
          gap: 0 16px;
        }
      }
    }
  `,
  group: css`
    min-width: 0;
  `,
  groupTitle: css`
    margin: 0 0 6px;
    color: var(--footer-text);
    font-size: 12px;
    font-weight: 650;
    line-height: 1.5;
  `,
  items: css`
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  `,
  link: css`
    display: inline-flex;
    width: fit-content;
    max-width: 100%;
    min-height: 27px;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--footer-muted);
    text-decoration: none;
    transition: color 150ms ease;

    span {
      overflow-wrap: anywhere;
    }

    svg {
      flex: 0 0 auto;
      opacity: 0.55;
    }

    &:hover {
      color: var(--footer-accent);

      svg {
        opacity: 1;
      }
    }

    @media (pointer: coarse) {
      min-height: 32px;
    }
  `,
  legal: css`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px 24px;
    border-top: 1px solid var(--footer-line);
    padding-block: 12px 16px;
    color: var(--footer-muted);
    font-size: 12px;
    line-height: 1.6;

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      color: var(--footer-text);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `,
  legalLinks: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  `,
}));

export default memo(function JadeFooter() {
  const { styles } = useStyles();
  const t = useT().footer;
  const base = useLocaleBase();
  const locales: any[] = useSiteStore((s: any) => s.siteData?.locales) || [];
  const cur = useSiteStore((s: any) => s.locale);
  const pathname = useSiteStore((s: any) => s.location?.pathname) || '/';
  const year = new Date().getFullYear();

  const switchTo = (targetBase: string) => {
    const cb = (cur?.base || '/').replace(/\/$/, '');
    let rel = pathname;
    if (cb && rel.startsWith(cb)) rel = rel.slice(cb.length) || '/';
    const tb = targetBase === '/' ? '' : targetBase.replace(/\/$/, '');
    let target = (tb + rel).replace(/\/{2,}/g, '/') || '/';
    if (target.length > 1 && target.endsWith('/')) target = target.slice(0, -1);
    return target || '/';
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.masthead}>
          <a className={styles.brand} aria-label="JadeView" href={base}>
            <Logo3D size={40} />
            <span>
              <span className={styles.brandName}>JadeView</span>
              <span className={styles.tagline}>{t.tagline}</span>
            </span>
          </a>

          <div className={styles.preferences}>
            <ThemeToggle />
            <nav className={styles.languages} aria-label={t.language}>
              {locales.map((loc) => (
                <a
                  aria-current={loc.id === cur?.id ? 'page' : undefined}
                  className={styles.languageLink}
                  href={switchTo(loc.base)}
                  hrefLang={loc.id}
                  key={loc.id}
                >
                  {LANG_LABEL[loc.id] || loc.name}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <nav className={styles.directory} aria-label={t.navigation}>
          {t.columns.map((col) => (
            <div className={styles.group} key={col.title}>
              <h2 className={styles.groupTitle}>{col.title}</h2>
              <ul className={styles.items}>
                {col.items.map((it) => (
                  <li key={it.title}>
                    <a
                      className={styles.link}
                      href={localeHref(base, it.url)}
                      {...(it.openExternal ? { rel: 'noreferrer', target: '_blank' } : {})}
                    >
                      <span>{it.title}</span>
                      {it.openExternal && <ArrowUpRight aria-hidden="true" size={12} />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.legal}>
          <span>{`© 2022–${year} JadeView · ${t.rights}`}</span>
          <div className={styles.legalLinks}>
            <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">蜀ICP备2022000695号-9</a>
            <span>
              {t.hosting.prefix}<a href="https://www.dkdun.cn/" rel="noreferrer" target="_blank">林枫云</a>{t.hosting.suffix}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
});
