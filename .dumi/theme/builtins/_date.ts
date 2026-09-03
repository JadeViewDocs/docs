// 动态/帖子时间格式化：跨组件（Dynamics、HomeNews）复用的纯函数。
// 规则（跟随语言）：
//   今天   → 仅时间（如 13:38 / 1:38 PM）
//   昨天   → 「昨天 HH:mm」（英文 Yesterday, HH:mm）
//   今年内 → 月日 + 时间（如 8月27日 13:38 / Aug 27, 1:38 PM）
//   跨年   → 年月日 + 时间（如 2025年12月1日 / Dec 1, 2025）
// 不依赖第三方库，纯 Intl，深浅主题通用。

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function formatPostDate(
  value: string,
  opts: { locale: 'zh-CN' | 'en-US' },
): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const zh = opts.locale === 'zh-CN';
  const time = date.toLocaleTimeString(opts.locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !zh,
  });

  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000,
  );

  // 今天：只显示时间
  if (isSameDay(date, now)) return time;
  // 昨天
  if (diffDays === 1) return zh ? `昨天 ${time}` : `Yesterday, ${time}`;
  // 今年内：月日 + 时间
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(opts.locale, {
      month: zh ? 'long' : 'short',
      day: 'numeric',
    }) + ` ${time}`;
  }
  // 跨年：年月日 + 时间
  return date.toLocaleDateString(opts.locale, {
    year: 'numeric',
    month: zh ? 'long' : 'short',
    day: 'numeric',
  }) + ` ${time}`;
}