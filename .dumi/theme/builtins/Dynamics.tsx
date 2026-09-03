// 「动态」页（docs/dynamics.md 内嵌 <Dynamics />）：走 帖子频道 API 获取新闻动态。
//   API：GET https://api.jade.run/posts 列表；GET https://api.jade.run/posts/{thread_id} 详情。
//   布局：左侧动态列表，右侧渲染选中帖子的完整内容；接口无鉴权，仅校验来源为 jade.run。
// 注意：builtin 内是客户端组件，渲染副作用在 useEffect 里做（SSR 首屏只给骨架），
//   且 /posts 列表每次进入都拉一次，保证拿到最新动态。
import { createStyles } from 'antd-style';
import { CalendarDays } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { formatPostDate } from './_date';
import { useLocaleBase, useT } from '../locales/strings';

const API_BASE = 'https://api.jade.run/posts';

interface Thread {
  thread_id: string;
  channel_id: string;
  author_id: string;
  title: string;
  content: string;
  cover?: string;
  date_time: string;
}

const useStyles = createStyles(({ css, token, responsive }) => ({
  root: css`
    width: 100%;
    max-width: 1040px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
    align-items: start;

    ${responsive.mobile} {
      grid-template-columns: 1fr;
    }
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    ${responsive.mobile} {
      max-height: 300px;
      overflow-y: auto;
    }
  `,
  item: css`
    cursor: pointer;
    text-align: left;
    border: none;
    border-radius: ${token.borderRadiusLG}px;
    padding: 12px 14px;
    background: transparent;
    color: ${token.colorText};
    transition: background 0.18s ease;
    position: relative;
    display: flex;
    gap: 12px;
    align-items: center;
    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  itemThumb: css`
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
    object-fit: cover;
    display: block;
    background: ${token.colorFillTertiary};
  `,
  itemBody: css`
    flex: 1;
    min-width: 0;
  `,
  itemActive: css`
    background: ${token.colorFillTertiary};
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 3px;
      border-radius: 2px;
      background: ${token.colorPrimary};
    }
  `,
  itemTitle: css`
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: ${token.colorText};
  `,
  itemDate: css`
    margin-top: 6px;
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
  detail: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: 28px 30px;
    background: ${token.colorBgContainer};
  `,
  detailTitle: css`
    margin: 0 0 10px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.4;
    color: ${token.colorText};
  `,
  detailMeta: css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 16px;
    border-bottom: 1px solid ${token.colorSplit};
    font-size: 13px;
    color: ${token.colorTextSecondary};
  `,
  detailDate: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
  `,
  detailBody: css`
    margin-top: 18px;
    font-size: 15px;
    line-height: 1.9;
    color: ${token.colorText};
    white-space: pre-wrap;
  `,
  hint: css`
    text-align: center;
    color: ${token.colorTextTertiary};
    padding: 60px 0;
  `,
}));

export default memo(function Dynamics() {
  const { styles, cx } = useStyles();
  const t = useT();
  const isEn = useLocaleBase().startsWith('/en-US');
  const dateOpts = { locale: (isEn ? 'en-US' : 'zh-CN') as 'en-US' | 'zh-CN' };
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [detail, setDetail] = useState<Thread | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 拉取列表
  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: { threads?: Thread[] }) => {
        if (!cancelled) setThreads(data.threads ?? []);
      })
      .catch(() => {
        if (!cancelled) setThreads([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 选中某帖 → 拉详情；列表/详情并发返回后默认选中第一条
  const open = (id: string) => {
    setActiveId(id);
    fetch(`${API_BASE}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: Thread) => setDetail(d))
      .catch(() => setDetail(null));
  };

  // 列表加载完成后，若尚未选中任何帖，默认打开第一条（若无详情则直接以列表项内容渲染）
  useEffect(() => {
    if (!threads || activeId || threads.length === 0) return;
    const first = threads[0];
    setActiveId(first.thread_id);
    fetch(`${API_BASE}/${first.thread_id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Thread) => setDetail(d))
      .catch(() => setDetail(first));
  }, [threads]);

  const shown = useMemo(() => detail ?? threads?.find((x) => x.thread_id === activeId) ?? null, [detail, threads, activeId]);

  return (
    <div className={styles.root}>
      <aside className={styles.list}>
        {threads?.map((th) => (
          <button
            key={th.thread_id}
            className={cx(styles.item, activeId === th.thread_id && styles.itemActive)}
            onClick={() => open(th.thread_id)}
          >
            {th.cover && <img className={styles.itemThumb} src={th.cover} alt="" loading="lazy" />}
            <span className={styles.itemBody}>
              <span className={styles.itemTitle}>{th.title}</span>
              <span className={styles.itemDate}>{formatPostDate(th.date_time, dateOpts)}</span>
            </span>
          </button>
        ))}
        {threads?.length === 0 && <div className={styles.hint}>{t.dynamics.empty}</div>}
      </aside>

      <section className={styles.detail}>
        {shown ? (
          <>
            <h1 className={styles.detailTitle}>{shown.title}</h1>
            <div className={styles.detailMeta}>
              <span className={styles.detailDate}>
                <CalendarDays size={15} /> {formatPostDate(shown.date_time, dateOpts)}
              </span>
            </div>
            <div className={styles.detailBody}>{shown.content}</div>
          </>
        ) : (
          <div className={styles.hint}>{t.dynamics.loading}</div>
        )}
      </section>
    </div>
  );
});