// 自定义页底（全自渲染，不依赖 @lobehub/ui Footer / lobehub LangSwitch —— 后两者会牵入主题深层
//   'dumi' 解析、在本机偶发 .dumi/tmp 损坏时连带崩坏；自渲染最稳，也便于自由排版）。
// 排版：左侧品牌区（图标 + 名称 + 一句话简介）+ 右侧链接分组（SDK / 社区 / 友情链接）；
//   底部一条：版权（备案/服务商，法务保持中文）+ 语言切换（中文 / EN 段式开关，移到这里）。
// 文案/链接走 ../locales/strings 的 footer.*；站内链接补当前语言 /en-US 前缀。
// 渲染为 <footer> 标签，沿用 .dumirc 的页底氛围渐变(footer::before)与鼠标高光(footer::after)。
import { createStyles } from 'antd-style';
import { memo } from 'react';
// @ts-ignore 主题 store（仅取 locales / 当前语言 / pathname，不引 'dumi'）
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
import { useT, useLocaleBase, localeHref } from '../locales/strings';

const LANG_LABEL: Record<string, string> = { 'zh-CN': '中文', 'en-US': 'EN' };

const useStyles = createStyles(({ css, token, responsive }) => ({
  inner: css`
    width: 100%;
    max-width: 1152px;
    margin: 0 auto;
    padding: 56px 24px 28px;
  `,
  top: css`
    display: flex;
    flex-wrap: wrap;
    gap: 40px 64px;
    justify-content: space-between;
  `,
  brand: css`
    flex: 1 1 240px;
    max-width: 320px;
  `,
  brandLink: css`
    display: inline-flex;
    gap: 10px;
    align-items: center;
    text-decoration: none;
  `,
  logo: css`
    width: 34px;
    height: 34px;
    border-radius: 9px;
  `,
  brandName: css`
    font-size: 19px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  tagline: css`
    margin: 14px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: ${token.colorTextTertiary};
  `,
  // 备案 / 服务商（法务，保持中文）—— 放在品牌区底部，不与版权同行
  beian: css`
    margin: 14px 0 0;
    font-size: 12px;
    line-height: 1.8;
    color: ${token.colorTextQuaternary};

    a {
      color: ${token.colorTextTertiary};
      text-decoration: none;
      &:hover {
        color: ${token.colorTextSecondary};
      }
    }
  `,
  cols: css`
    display: flex;
    flex-wrap: wrap;
    gap: 32px 56px;
  `,
  col: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 120px;
  `,
  colTitle: css`
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
  `,
  link: css`
    width: fit-content;
    font-size: 13.5px;
    color: ${token.colorTextTertiary};
    text-decoration: none;
    transition: color 0.15s ease;

    &:hover {
      color: ${token.colorText};
    }
  `,
  bottom: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
    align-items: center;
    justify-content: space-between;

    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  copy: css`
    font-size: 12.5px;
    color: ${token.colorTextTertiary};

    a {
      color: ${token.colorTextSecondary};
      text-decoration: none;
      &:hover {
        color: ${token.colorText};
      }
    }
  `,
  // 语言段式开关
  lang: css`
    display: inline-flex;
    padding: 3px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 9999px;
    background: ${token.colorFillQuaternary};
  `,
  langItem: css`
    padding: 3px 14px;
    border-radius: 9999px;
    font-size: 12.5px;
    color: ${token.colorTextSecondary};
    text-decoration: none;
    transition: color 0.15s ease, background 0.15s ease;

    &:hover {
      color: ${token.colorText};
    }
  `,
  langItemActive: css`
    color: ${token.colorText};
    background: ${token.colorBgElevated};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  `,
}));

export default memo(function JadeFooter() {
  const { styles, cx } = useStyles();
  const t = useT().footer;
  const base = useLocaleBase();
  const locales: any[] = useSiteStore((s: any) => s.siteData?.locales) || [];
  const cur = useSiteStore((s: any) => s.locale);
  const pathname = useSiteStore((s: any) => s.location?.pathname) || '/';
  const year = new Date().getFullYear();

  // 切到目标语言：剥掉当前语言 base 前缀、换成目标 base（plain <a>，整页跳转即可，简单可靠）。
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
    <footer>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <a className={styles.brandLink} href={base === '/' ? '/' : base}>
              <img alt="JadeView" className={styles.logo} src="/favicon.png" />
              <span className={styles.brandName}>JadeView</span>
            </a>
            <p className={styles.tagline}>{t.tagline}</p>
            <p className={styles.beian} dangerouslySetInnerHTML={{ __html: t.copyright }} />
          </div>

          <div className={styles.cols}>
            {t.columns.map((col) => (
              <div className={styles.col} key={col.title}>
                <div className={styles.colTitle}>{col.title}</div>
                {col.items.map((it) => (
                  <a
                    className={styles.link}
                    href={localeHref(base, it.url)}
                    key={it.title}
                    {...(it.openExternal ? { rel: 'noreferrer', target: '_blank' } : {})}
                  >
                    {it.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.copy}>{`© 2022-${year} JadeView · ${t.rights}`}</span>
          <div className={styles.lang}>
            {locales.map((loc) => (
              <a
                className={cx(styles.langItem, loc.id === cur?.id && styles.langItemActive)}
                href={switchTo(loc.base)}
                key={loc.id}
              >
                {LANG_LABEL[loc.id] || loc.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});
