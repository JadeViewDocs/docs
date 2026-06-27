// 共享「飘带飘入」动画（framer-motion variants）——首屏 Hero 与标题栏胶囊共用，保证两处效果一致。
// 飘带感 = 3D 旋转(以底边为轴 rotateX 掀起→展平) + 微侧倾 rotateZ + 上飘 + 缩放 + 雾化，
// 配合欠阻尼 spring(轻微过冲摇曳)；淡入/去模糊用平滑 tween(防止 blur 被弹成负值)。
// 用法：容器加 floatContainer 做错峰；每个子元素加 floatItem 变体 + floatStyle(透视/旋转轴)。

// 透视 + 旋转轴：rotateX 才有 3D 翻起的纵深；以底边为轴 → 像绸带从下掀起就位。
export const floatStyle = { transformPerspective: 1000, transformOrigin: 'center bottom' } as const;

// 标题栏胶囊专用：旋转轴改到顶边 → 入场像从顶部「掀落」就位（Hero 仍用 center bottom 的 floatStyle）。
export const floatStyleTop = { transformPerspective: 1000, transformOrigin: 'center top' } as const;

export const floatContainer = {
  hidden: {},
  show: { transition: { delayChildren: 0.12, staggerChildren: 0.2 } },
};

const spring = { type: 'spring', stiffness: 46, damping: 11, mass: 1.1 } as const;

export const floatItem = {
  hidden: { opacity: 0, y: 56, rotateX: 48, rotateZ: -4, scale: 0.96, filter: 'blur(14px)' },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateZ: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      ...spring,
      opacity: { duration: 0.8, ease: 'easeOut' },
      filter: { duration: 0.9, ease: 'easeOut' },
    },
  },
};

// 无 filter 版本：用于「自身带 backdrop-filter 的元素」（如标题栏胶囊）。
// 若用带 filter 的版本，元素自身的 filter 会干扰它自己的 backdrop-filter（背景模糊失效）；
// 故这里只做 3D 旋转/位移/缩放/淡入的飘入，不做内容雾化，背景模糊得以保留。
// 「像飘带一样扭曲着飘下来」：起始在上方(y 负) + 较大的 rotateX/rotateZ 扭曲(配合 floatStyleTop 顶边轴)。
// 用「自己的」更慢更弹的 spring（不沿用共享 spring，那个还给 Hero 用）：扭曲在落位过程里持续可见、
// 并带轻微过冲回摆，像绸带掀落。整体延迟 200ms 起播。
// 关键：opacity 必须在「扭曲峰值时」就已不透明，否则最扭的瞬间还透明、看清时已落平（实测峰值 ratio 0.5 时 op=0）。
//   故 opacity 在 200ms 延迟后极快补满(0.18s)，让胶囊带着扭曲「现身」、再被看着慢慢拧正。
export const floatItemNoBlur = {
  hidden: { opacity: 0, y: -82, rotateX: 72, rotateZ: 8, scale: 0.93 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateZ: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 24,
      damping: 8,
      mass: 1.2,
      delay: 0.2,
      opacity: { duration: 0.18, delay: 0.2, ease: 'easeOut' },
    },
  },
};
