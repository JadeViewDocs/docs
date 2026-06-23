// 移动端抽屉里的主题切换：点击循环「跟随系统 → 浅色 → 深色」。
// 为什么不用 lobehub 的 ThemeSwitch：它是下拉菜单（DropdownMenu），在全屏抽屉里弹层会被抽屉盖住、
//   看着就像点了没反应。这里改成直接循环切换，不依赖弹层。
// 主题应用逻辑与 lobehub ThemeSwitch 一致：写入 useThemeStore.themeMode，并在变化时 setColorMode 应用。
import { ActionIcon } from '@lobehub/ui';
import { usePrefersColor } from 'dumi';
import { Monitor, Moon, Sun } from 'lucide-react';
import { memo, useEffect } from 'react';
// @ts-ignore 主题 store，深层路径无类型声明
import { useThemeStore } from 'dumi-theme-lobehub/dist/store/useThemeStore';

const ORDER = ['auto', 'light', 'dark'] as const;
const ICON: Record<string, typeof Monitor> = { auto: Monitor, light: Sun, dark: Moon };

export default memo(function JadeThemeToggle() {
  const themeMode = useThemeStore((s: any) => s.themeMode) as 'auto' | 'light' | 'dark';
  const setColorMode = (usePrefersColor() as any)[2];

  // 移动端没有挂载 lobehub 的 ThemeSwitch，故在此承担「themeMode 变化 → 应用颜色」的同步。
  useEffect(() => {
    setColorMode(themeMode);
  }, [themeMode]);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(themeMode) + 1) % ORDER.length];
    useThemeStore.setState({ themeMode: next });
  };

  return (
    <ActionIcon
      icon={ICON[themeMode] || Monitor}
      onClick={cycle}
      size={{ blockSize: 36, fontSize: 22 }}
      title="切换主题（跟随系统 / 浅色 / 深色）"
    />
  );
});
