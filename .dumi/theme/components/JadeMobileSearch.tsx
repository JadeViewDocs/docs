// 移动端标题栏右侧「搜索」入口：一个搜索图标，点开后从顶部下拉一个抽屉，内含搜索框 + 结果。
// 复用 dumi 的 useSiteSearch 与主题的 SearchResult（与桌面侧栏搜索同一套数据）。
import { ActionIcon, SearchBar as Input } from '@lobehub/ui';
import { Drawer } from 'antd';
import { useSiteSearch } from 'dumi';
import { Search } from 'lucide-react';
import { memo, useState } from 'react';
// @ts-ignore 主题内部组件，深层路径无类型声明
import SearchResult from 'dumi-theme-lobehub/dist/slots/SearchResult';

export default memo(function JadeMobileSearch() {
  const [open, setOpen] = useState(false);
  const { keywords, setKeywords, result, loading } = useSiteSearch();

  return (
    <>
      <ActionIcon icon={Search} onClick={() => setOpen(true)} size={{ blockSize: 36, fontSize: 22 }} title="搜索" />
      <Drawer
        closable={false}
        height="auto"
        onClose={() => setOpen(false)}
        open={open}
        placement="top"
        rootClassName="jade-msearch"
        styles={{ body: { padding: 12 } }}
      >
        <Input
          autoFocus
          enableShortKey={false}
          onChange={(e: any) => setKeywords(e.target.value)}
          placeholder="搜索文档…"
          style={{ width: '100%' }}
          type="block"
        />
        {keywords.trim() && (
          <div
            onClick={() => setOpen(false)}
            style={{ overflow: 'auto', maxHeight: '60vh', marginTop: 8 }}
          >
            <SearchResult data={result} loading={loading} />
          </div>
        )}
      </Drawer>
    </>
  );
});
