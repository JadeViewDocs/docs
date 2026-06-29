// 移动端汉堡菜单（自定义 Drawer + Menu，不用 @lobehub/ui Burger）。
// 弃用原因：@lobehub/ui Burger 把「图标 + 抽屉」整个包在 onClick=toggle 的容器里，抽屉是 React portal，
//   点击会沿 React 树冒泡回该容器触发关闭 → 点 SubMenu 标题（本应只展开）也会把抽屉关掉。
// 自定义后：SubMenu 标题点击仅展开/收缩（antd 默认，不导航、不关抽屉）；叶子链接点击才导航并关抽屉。
import { ActionIcon } from '@lobehub/ui';
import { Drawer, Menu } from 'antd';
import { Link } from 'dumi';
import isEqual from 'fast-deep-equal';
import { MenuIcon, X } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
// @ts-ignore 主题 store / selectors
import { siteSelectors, useSiteStore } from 'dumi-theme-lobehub/dist/store';
// 主题切换（循环按钮，不用 lobehub 的下拉式，避免在全屏抽屉里弹层被盖住）
import ThemeToggle from './JadeThemeToggle';

export default memo(function JadeBurger() {
  const [opened, setOpened] = useState(false);
  const nav = useSiteStore((s: any) => s.navData, isEqual);
  const sidebar = useSiteStore((s: any) => s.sidebar, isEqual);
  const { pathname, activePath } = useSiteStore((s: any) => ({
    activePath: siteSelectors.activePath(s),
    pathname: s.location.pathname,
  }));
  const close = () => setOpened(false);

  // 当前所在区 → 可展开 SubMenu（标题纯文本，点击仅展开/收缩）；子项为文档侧栏（点击导航并关抽屉）。
  // 其它顶级项为普通链接。
  const inDocs = pathname === '/docs' || pathname.startsWith('/docs/');
  const items = useMemo(() => {
    // 「文档」始终可展开的分区切换子项（首页也能展开到 文档指南 / API，不必先进文档页）。
    const docsSwitch = [
      { key: 'sec-/docs/spec', label: (<Link onClick={close} to="/docs/spec">文档指南</Link>) },
      { key: 'sec-/docs/api', label: (<Link onClick={close} to="/docs/api">API</Link>) },
    ];

    // 当前页侧栏树（文档页 = 当前分区目录；SDK 等区 = 该区目录）。
    const treeChildren: any[] = [];
    (sidebar || []).forEach((group: any, gi: number) => {
      if (!group || group.link) return;
      const children = (group.children || []).map((it: any) => ({
        key: `s-${it.link}`,
        label: (
          <Link onClick={close} to={it.link}>
            {it.title}
          </Link>
        ),
      }));
      if (group.title) treeChildren.push({ key: `g-${gi}`, label: group.title, type: 'group', children });
      else treeChildren.push(...children);
    });

    return nav.map((item: any) => {
      const key = item.activePath || item.link;
      const isDocsItem = String(item.link || '').startsWith('/docs');
      if (isDocsItem) {
        // 文档：始终为可展开子菜单；子项 = 分区切换；在文档页时再附上当前分区目录树。
        const children =
          inDocs && treeChildren.length
            ? [{ key: 'doc-sections', type: 'group', label: '文档', children: docsSwitch }, ...treeChildren]
            : docsSwitch;
        return { children, key, label: item.title };
      }
      // 其它区：当前区且有侧栏树 → 展开；否则普通链接。
      if (key === activePath && treeChildren.length) {
        return { children: treeChildren, key, label: item.title };
      }
      // 「产品」：可展开，列出 JadePack / Jade EC 两个产品页。
      if (item.title === '产品' || item.link === '/jadepack') {
        return {
          key,
          label: item.title,
          children: [
            { key: 's-/jadepack', label: (<Link onClick={close} to="/jadepack">JadePack</Link>) },
            { key: 's-/jade-ec', label: (<Link onClick={close} to="/jade-ec">Jade EC 查看器</Link>) },
          ],
        };
      }
      return {
        key,
        label: (
          <Link onClick={close} to={String(item.link)}>
            {item.title}
          </Link>
        ),
      };
    });
  }, [nav, activePath, sidebar, inDocs]);

  return (
    <>
      <ActionIcon icon={MenuIcon} onClick={() => setOpened(true)} size={{ blockSize: 36, fontSize: 22 }} />
      <Drawer
        closable={false}
        onClose={close}
        open={opened}
        placement="left"
        rootClassName="jade-burger"
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { background: 'transparent' } }}
        width="100vw"
      >
        {/* 全屏菜单覆盖了顶部的关闭按钮，这里自带一个 ✕（位置与顶部胶囊对齐），并放 Logo 图标 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 6px' }}>
          <span className="jade-mpill" style={{ display: 'inline-flex' }}>
            <ActionIcon icon={X} onClick={close} size={{ blockSize: 36, fontSize: 22 }} />
          </span>
          <img alt="JadeView" src="/favicon.png" style={{ display: 'block', width: 32, height: 32, borderRadius: 8 }} />
          {/* 主题切换（移动端标题栏右侧已换成搜索，这里补上；循环切换，不依赖弹层）*/}
          <div className="jade-mpill" style={{ display: 'inline-flex', marginInlineStart: 'auto' }}>
            <ThemeToggle />
          </div>
        </div>
        <Menu
          items={items}
          mode="inline"
          selectedKeys={[
            ...new Set([
              activePath,
              `s-${pathname}`,
              pathname.startsWith('/docs/api') ? 'sec-/docs/api' : 'sec-/docs/spec',
            ]),
          ]}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />
      </Drawer>
    </>
  );
});
