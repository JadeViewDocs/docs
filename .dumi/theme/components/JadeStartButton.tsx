// 首屏「快速开始」主按钮：等价还原 @lobehub/ui GradientButton 的外观（多彩渐变描边 + 模糊 glow + 暗色内面），
// 但动画全部由 framer-motion 驱动，不用任何 CSS @keyframes / transition：
//   · 渐变扫动：motion 循环动画 backgroundPosition（替代原 CSS @keyframes 的 background-position 循环）；
//   · 悬停：不靠位移，而是「亮起来、五彩缤纷」——彩色光晕绽放变大变亮 + 渐变描边提饱和提亮 + 内面透出彩色辉光
//     （参考当下 AI 产品按钮的高光质感）；按压只做轻微回缩。
// 作为纯视觉层放在 Hero 的 <Link> 内（导航仍由 Link 负责）。
import { useTheme } from 'antd-style';
import { motion } from 'motion/react';
import { memo, type ReactNode } from 'react';

// 悬停色彩绽放用的柔和 spring。
const spring = { type: 'spring', stiffness: 260, damping: 22, mass: 0.8 } as const;
// 渐变扫动：往返循环 background-position（0%→100%→0%），与原 GradientButton 的慢扫观感一致。
const sweep = {
  animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
  transition: { backgroundPosition: { duration: 6, repeat: Infinity, ease: 'linear' } },
} as const;

export default memo(function JadeStartButton({
  children,
  block,
}: {
  children: ReactNode;
  block?: boolean;
}) {
  const theme = useTheme() as any;
  // antd 预设色板（lobehub 原按钮同款）；带 hex 兜底以防 token 缺失。
  const gold = theme.gold || '#faad14';
  const magenta = theme.magenta || '#eb2f96';
  const geekblue = theme.geekblue || '#2f54eb';
  const cyan = theme.cyan || '#13c2c2';
  const grad = `linear-gradient(-45deg, ${gold}, ${magenta}, ${geekblue}, ${cyan})`;
  const radius = theme.borderRadiusLG || 8;
  const border = 1.5; // 渐变描边可见厚度

  return (
    <motion.div
      animate="rest"
      initial="rest"
      style={{
        position: 'relative',
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : 'auto',
        borderRadius: radius,
        cursor: 'pointer',
        isolation: 'isolate', // 独立堆叠上下文，约束内部负 z-index 层
      }}
      transition={spring}
      // 悬停几乎不位移（仅极轻微放大），把表现力全交给「色彩绽放」；按压轻微回缩。
      variants={{ rest: { scale: 1 }, hover: { scale: 1.02 }, tap: { scale: 0.98 } }}
      whileHover="hover"
      whileTap="tap"
    >
      {/* glow 光晕：悬停时绽放——放大(halo 外扩) + 提亮提饱和 + opacity 增强。扫动持续运行（内层）。 */}
      <motion.div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: radius }}
        transition={spring}
        variants={{
          rest: { opacity: 0.4, scale: 1, filter: 'saturate(1) brightness(1)' },
          hover: { opacity: 0.95, scale: 1.12, filter: 'saturate(1.5) brightness(1.4)' },
          tap: { opacity: 0.82, scale: 1.06, filter: 'saturate(1.35) brightness(1.28)' },
        }}
      >
        <motion.div
          animate={sweep.animate}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: radius,
            backgroundImage: grad,
            backgroundSize: '300% 300%',
            filter: 'blur(12px)',
          }}
          transition={sweep.transition}
        />
      </motion.div>

      {/* 渐变描边层：悬停时提饱和提亮，让多彩描边更「炸」。中间被内面遮去、只露 border 厚度。 */}
      <motion.div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: radius }}
        transition={spring}
        variants={{
          rest: { filter: 'saturate(1) brightness(1)' },
          hover: { filter: 'saturate(1.5) brightness(1.35)' },
          tap: { filter: 'saturate(1.35) brightness(1.25)' },
        }}
      >
        <motion.div
          animate={sweep.animate}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: radius,
            backgroundImage: grad,
            backgroundSize: '300% 300%',
          }}
          transition={sweep.transition}
        />
      </motion.div>

      {/* 内面：暗色实底（细描边由下层透出）。叠一层彩色辉光，悬停淡入，让暗面也透出「五彩」质感。 */}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          margin: border,
          flex: block ? 1 : undefined,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '0 32px',
          height: 40,
          borderRadius: radius - border,
          background: theme.colorBgLayout,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {/* 外层只承载「悬停淡入」(变体随父级状态)，内层独立跑渐变扫动——拆开以免 animate 对象盖掉变体传播。 */}
        <motion.span
          aria-hidden
          style={{ position: 'absolute', inset: 0, display: 'block' }}
          transition={spring}
          variants={{ rest: { opacity: 0 }, hover: { opacity: 0.3 }, tap: { opacity: 0.22 } }}
        >
          <motion.span
            animate={sweep.animate}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'block',
              backgroundImage: grad,
              backgroundSize: '300% 300%',
              mixBlendMode: 'screen',
            }}
            transition={sweep.transition}
          />
        </motion.span>
        <span style={{ position: 'relative', color: theme.colorText, fontSize: 16, fontWeight: 500, lineHeight: 1 }}>
          {children}
        </span>
      </span>
    </motion.div>
  );
});
