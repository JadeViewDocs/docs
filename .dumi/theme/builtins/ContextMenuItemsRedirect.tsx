// v2「菜单项类型与原生菜单项」已由 v3 的模板 API 取代。
// 保留旧 URL 作为入口，通过 SPA replace 跳到 v3 文档，避免从旧页面继续进入 v2。
import { useNavigate } from 'dumi';
import { memo, useEffect } from 'react';
import { useLocaleBase } from '../locales/strings';

export default memo(function ContextMenuItemsRedirect() {
  const base = useLocaleBase();
  const navigate = useNavigate();

  useEffect(() => {
    const prefix = base === '/' ? '' : base;
    navigate(`${prefix}/docs/v3api/menu/context-menu-items`, { replace: true });
  }, [base, navigate]);

  return null;
});
