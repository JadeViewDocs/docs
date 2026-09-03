// 首页「动态/新闻」横向列表（HomeExtra 在「快速上手」下方内嵌 <HomeNews />）：
//   拉 帖子频道 API 的 /posts 列表，展示最近 3 条，横向带封面卡片。
//   API 返回无图片字段，封面用「标题哈希 → 品牌色渐变」生成的确定性封面（无需外部资源，深浅主题通吃）。
//   点击任意卡片跳转 /dynamics（或 /<locale>/dynamics）查看完整列表与详情。
import { createStyles } from 'antd-style';
import { Link } from 'dumi';
import { ArrowRight, Rss } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { formatPostDate } from './_date';
import { useLocaleBase, useT } from '../locales/strings';

const API_BASE = 'https://api.jade.run/posts';
const MAX = 3;

interface Thread {
  thread_id: string;
  title: string;
  content: string;
  cover?: string;
  date_time: string;
}

// 由字符串稳定哈希出 0~1 的数值（线性同余，简单稳定）
function hashOf(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const useStyles = createStyles(({ css, token, responsive }) => ({
  title: css`
    text-align: center;
    font-size: 30px;
    font-weight: 700;
    margin: 8px 0 4px;
    color: ${token.colorText};
  `,
  sub: css`
    text-align: center;
    color: ${token.colorTextSecondary};
    margin: 0 0 24px;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    ${responsive.mobile} {
      grid-template-columns: 1fr;
    }
  `,
  card: css`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    color: inherit;
    text-decoration: none;
    background: ${token.colorBgContainer};
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    &:hover {
      border-color: ${token.colorBorder};
      box-shadow: ${token.boxShadow};
      transform: translateY(-4px);
    }
    &:hover .jade-news-arrow {
      transform: translateX(3px);
      color: ${token.colorText};
    }
  `,
  // 首屏 Hero 下的紧凑版：无大标题/副标题/更多链接，卡片更矮、留白更小
  compact: css`
    margin-top: 36px;
    ${responsive.mobile} {
      margin-top: 28px;
    }
  `,
  compactCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: inherit;
    text-decoration: none;
    background: ${token.colorBgContainer};
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    &:hover {
      border-color: ${token.colorBorder};
      box-shadow: ${token.boxShadow};
      transform: translateY(-3px);
    }
  `,
  compactCover: css`
    position: relative;
    height: 84px;
    overflow: hidden;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    > svg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      color: #fff;
      opacity: 0.9;
    }
  `,
  compactBody: css`
    padding: 10px 12px 12px;
  `,
  compactName: css`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    color: ${token.colorText};
  `,
  compactFoot: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${token.colorTextTertiary};
    font-size: 11px;
  `,
  cover: css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 132px;
    overflow: hidden;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    > svg {
      width: 30px;
      height: 30px;
      color: #fff;
      opacity: 0.9;
    }
  `,
  body: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 14px 16px 16px;
  `,
  name: css`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    color: ${token.colorText};
  `,
  foot: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    color: ${token.colorTextSecondary};
    font-size: 12px;
  `,
  arrow: css`
    flex-shrink: 0;
    color: ${token.colorTextTertiary};
    transition: transform 0.18s ease, color 0.18s ease;
  `,
  more: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 18px;
    color: ${token.colorTextSecondary};
    text-decoration: none;
    &:hover {
      color: ${token.colorPrimary};
    }
  `,
}));

export default memo(function HomeNews({ compact = false }: { compact?: boolean }) {
  const { styles, cx } = useStyles();
  const t = useT();
  const base = useLocaleBase();
  const isEn = base.startsWith('/en-US');
  const dateOpts = { locale: (isEn ? 'en-US' : 'zh-CN') as 'en-US' | 'zh-CN' };
  const [items, setItems] = useState<Thread[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { threads?: Thread[] }) => {
        if (!cancelled) setItems((d.threads ?? []).slice(0, MAX));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dynLink = base === '/' ? '/dynamics' : `${base}/dynamics`;

  // 首屏 Hero 下：紧凑横条（无大标题/副标题/更多链接），每张卡片矮封面 + 标题 + 时间
  if (compact) {
    return (
      <div className={styles.compact}>
        <div className={styles.grid}>
          {items === null && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'inherit', opacity: 0.6 }}>{t.dynamics.loading}</div>}
          {items?.map((it) => {
            const hue = Math.round(hashOf(it.thread_id) * 360);
            const coverBg = `linear-gradient(135deg, hsl(${hue} 55% 52%), hsl(${(hue + 40) % 360} 60% 40%))`;
            return (
              <Link key={it.thread_id} className={styles.compactCard} to={dynLink}>
                <div className={styles.compactCover} style={{ background: coverBg }}>
                  {it.cover ? (
                    <img src={it.cover} alt={it.title} loading="lazy" />
                  ) : (
                    <Rss />
                  )}
                </div>
                <div className={styles.compactBody}>
                  <h3 className={styles.compactName}>{it.title}</h3>
                  <div className={styles.compactFoot}>
                    <span>{formatPostDate(it.date_time, dateOpts)}</span>
                    <ArrowRight className={cx(styles.arrow, 'jade-news-arrow')} size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section>
      <h2 className={styles.title}>{t.home.newsTitle}</h2>
      <p className={styles.sub}>{t.home.newsSub}</p>
      <div className={styles.grid}>
        {items === null && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'inherit', opacity: 0.6 }}>{t.dynamics.loading}</div>}
        {items?.map((it) => {
          const hue = Math.round(hashOf(it.thread_id) * 360);
          const coverBg = `linear-gradient(135deg, hsl(${hue} 55% 52%), hsl(${(hue + 40) % 360} 60% 40%))`;
          return (
            <Link key={it.thread_id} className={styles.card} to={dynLink}>
              <div className={styles.cover} style={{ background: coverBg }}>
                {it.cover ? (
                  <img src={it.cover} alt={it.title} loading="lazy" />
                ) : (
                  <Rss />
                )}
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>{it.title}</h3>
                <div className={styles.foot}>
                  <span>{formatPostDate(it.date_time, dateOpts)}</span>
                  <ArrowRight className={cx(styles.arrow, 'jade-news-arrow')} size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div style={{ textAlign: 'center' }}>
        <Link className={styles.more} to={dynLink}>
          {t.home.newsMore} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
});