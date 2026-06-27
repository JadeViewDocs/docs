// 「液态玻璃」backdrop-filter（移植自 reactbits.dev/components/glass-surface 的位移折射技法）。
//
// 原理：苹果式 liquid glass ≠ 单纯磨砂模糊，而是用 SVG `feDisplacementMap` 对「胶囊背后的画面」
//   做边缘折射 + RGB 三通道微错位（红/绿/蓝各自不同 scale → 边缘出现极淡的色散光晕），
//   再叠一点高斯柔化。位移量由一张「位移贴图」(feImage) 决定：贴图是一张和元素同尺寸的圆角矩形，
//   横向红渐变 + 纵向蓝渐变 + 中央高亮模糊块 → 解码后喂给 feDisplacementMap 当 in2。
//
// 关键工程点：
//   1) 贴图必须和元素「当前实际尺寸」一致（否则 preserveAspectRatio=none 拉伸会扭曲圆角折射）。
//      故用 ResizeObserver 监听元素尺寸、用 rAF 节流重生成贴图 data-URI。桌面胶囊宽度会随 Logo
//      文字收展做 spring 动画 → 每帧重算贴图（仅动画期间，滚动时尺寸不变、零开销）。
//   2) backdrop-filter 的 url() 位移滤镜「只有 Chromium 支持」；Safari/Firefox 自动回退普通 blur。
//   3) 背景模糊铁律（见 Header 注释）：backdrop-filter 只被「祖先」transform 破坏、不被自身破坏。
//      所以本 hook 把滤镜 url() 直接挂到「带 transform 的那个胶囊/胶囊药丸元素自身」，
//      而不是塞一个子背景层（子层会被胶囊自身的飘入/缩放 transform 掐断模糊）。

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type LiquidGlassOptions = {
  borderRadius?: number; // 元素圆角（生成贴图用；超过短边一半会被 SVG 自动钳到半高 → 药丸形）
  borderWidth?: number; // 折射边缘宽度系数（× 短边）
  brightness?: number; // 中央高亮块亮度（0–100）
  opacity?: number; // 中央高亮块不透明度（0–1）
  blur?: number; // 贴图内高亮块的模糊（px）—— 让位移过渡更柔，不是背景模糊
  displace?: number; // 输出再叠加的高斯柔化 stdDeviation
  distortionScale?: number; // 位移基准强度（负值，越负折射越强）
  redOffset?: number; // R 通道相对基准的位移偏移（色散）
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: string;
};

// JadeView 标题栏采用的 reactbits 预设（用户在 Customize 面板敲定的一组）：
//   borderRadius=50 / borderWidth=0.11 / brightness=27 / opacity=0.93 / blur=11 /
//   displace=3.5（在 reactbits 的 0.5 基础上明显调大，柔化色散边缘）/ distortionScale=-40 /
//   redOffset=0 / greenOffset=10 / blueOffset=20 / saturation=1 / backgroundOpacity=0.1。
// 注意：distortionScale 取较温和的 -40（之前 -180 在窄胶囊上过猛、且被过厚的霜底糊死，看不出折射）。
export const GLASS_PARAMS: LiquidGlassOptions = {
  borderRadius: 50,
  borderWidth: 0.11,
  brightness: 27,
  opacity: 0.93,
  blur: 11,
  displace: 3.5,
  distortionScale: -40,
  // 三通道错位差 = 色散宽度。reactbits 预设 0/10/20 的彩虹太重，收窄到 0/2/4（只留一丝冷暖边）。
  redOffset: 0,
  greenOffset: 2,
  blueOffset: 4,
  xChannel: 'R',
  yChannel: 'G',
  mixBlendMode: 'difference',
};

// 玻璃「霜底」不透明度与饱和度（reactbits 的 backgroundOpacity / saturation）。
// 霜底必须很薄（0.1），否则会盖住背后画面、折射就看不见了——这正是上一版「没有玻璃效果」的根因。
export const GLASS_BG_OPACITY = 0.1;
export const GLASS_SATURATION = 1;

const DEFAULTS: Required<LiquidGlassOptions> = { ...(GLASS_PARAMS as Required<LiquidGlassOptions>) };

export type LiquidGlass = {
  /** 回调 ref：挂到要做玻璃的元素（同时承载它自身的 transform 也没问题）。 */
  ref: (el: HTMLElement | null) => void;
  /** 该实例唯一滤镜 id，用于 `backdrop-filter: url(#id)`。 */
  filterId: string;
  /** 当前环境是否支持 url() 位移滤镜（Chromium=true；Safari/FF=false → 调用方走普通 blur 回退）。 */
  supported: boolean;
  /** 需渲染进玻璃元素内部的隐藏 <svg> 滤镜定义。 */
  svg: ReactNode;
};

export function useLiquidGlass(options: LiquidGlassOptions = {}): LiquidGlass {
  const o = { ...DEFAULTS, ...options };
  const filterId = `jade-glass-${useId().replace(/:/g, '')}`;

  const elRef = useRef<HTMLElement | null>(null);
  const feImageRef = useRef<SVGFEImageElement | null>(null);
  const redRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const greenRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const blueRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const visRef = useRef<(() => void) | null>(null);
  const nonceRef = useRef(0);
  const supportedRef = useRef(false);

  const [supported, setSupported] = useState(false);

  // 生成与元素同尺寸的位移贴图（圆角矩形：横红渐变 + 纵蓝渐变 + 中央高亮模糊块）。
  const buildMap = useCallback(
    (w: number, h: number, nonce = 0) => {
      const edge = Math.min(w, h) * (o.borderWidth * 0.5);
      const r = Math.min(o.borderRadius, Math.min(w, h) / 2);
      const svg =
        `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
        `<defs>` +
        `<linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>` +
        `<linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>` +
        `</defs>` +
        `<rect x="0" y="0" width="${w}" height="${h}" fill="black"/>` +
        `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#r)"/>` +
        `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#b)" style="mix-blend-mode:${o.mixBlendMode}"/>` +
        `<rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${r}" fill="hsl(0 0% ${o.brightness}% / ${o.opacity})" style="filter:blur(${o.blur}px)"/>` +
        // nonce 仅是一段注释：渲染完全一致，但改变了 data-URI 字符串 → 强制 feImage 重新解码
        // （后台加载时若 feImage 从未解码、回填相同 href 不触发重绘，靠它兜底）。
        (nonce ? `<!--${nonce}-->` : '') +
        `</svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    },
    [o.borderWidth, o.borderRadius, o.mixBlendMode, o.brightness, o.opacity, o.blur],
  );

  // 按元素当前尺寸刷新贴图与三通道位移 scale。
  // force=true：即使尺寸不变也强制 feImage 重新解码（递增 nonce 改变 data-URI），
  //   用于「切回前台 / 字体就绪」——后台加载时 feImage 可能从未解码、且尺寸没变时回填相同 href 是空操作。
  const apply = useCallback((force = false) => {
    const el = elRef.current;
    if (!el) return;
    // 用 offset 尺寸（布局尺寸，不含自身 transform）：位移贴图作用在元素「变换前的本地坐标系」。
    // 若用 getBoundingClientRect，会把入场/弹入的 scale 也算进去 → 贴图按缩小后的尺寸生成、落位后不再匹配
    // （ResizeObserver 只在布局尺寸变化时触发，捕捉不到 scale 回正）。下拉面板 scale 弹入即踩此坑。
    const w = Math.max(1, Math.round(el.offsetWidth));
    const h = Math.max(1, Math.round(el.offsetHeight));
    if (force) nonceRef.current += 1;
    feImageRef.current?.setAttribute('href', buildMap(w, h, nonceRef.current));
    const setChan = (node: SVGFEDisplacementMapElement | null, off: number) => {
      if (!node) return;
      node.setAttribute('scale', String(o.distortionScale + off));
      node.setAttribute('xChannelSelector', o.xChannel);
      node.setAttribute('yChannelSelector', o.yChannel);
    };
    setChan(redRef.current, o.redOffset);
    setChan(greenRef.current, o.greenOffset);
    setChan(blueRef.current, o.blueOffset);
    blurRef.current?.setAttribute('stdDeviation', String(o.displace));
  }, [buildMap, o.distortionScale, o.redOffset, o.greenOffset, o.blueOffset, o.xChannel, o.yChannel, o.displace]);

  const schedule = useCallback(() => {
    // 后台标签页里 requestAnimationFrame 会被浏览器冻结/不触发：刷新后立刻切走，webfont 载入改变
    // 胶囊 max-content 宽度 → ResizeObserver 触发的「重算贴图」被排进一个永不执行的 rAF；切回前台时
    // 贴图仍停留在旧宽度，被 preserveAspectRatio=none 拉伸 → 折射错位/破图。隐藏时直接同步重算、绕过 rAF。
    if (typeof document !== 'undefined' && document.hidden) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      apply();
      return;
    }
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      apply();
    });
  }, [apply]);

  const detach = useCallback(() => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (visRef.current) {
      document.removeEventListener('visibilitychange', visRef.current);
      visRef.current = null;
    }
  }, []);

  const attach = useCallback(
    (el: HTMLElement) => {
      detach();
      apply();
      const ro = new ResizeObserver(schedule);
      ro.observe(el);
      roRef.current = ro;
      // 兜底：切回前台时强制重新解码（force）。后台加载会出现 feImage 从未解码、切回来时 href 不变也不重绘
      //   的破图（平板白胶囊）→ 用 force 改变 data-URI 字符串逼它重新解码。
      const onVis = () => {
        if (!document.hidden) apply(true);
      };
      document.addEventListener('visibilitychange', onVis);
      visRef.current = onVis;
      // webfont 载入会改变胶囊 max-content 宽度，且首帧 feImage 可能还没解码 → 字体就绪后强制重算一次。
      (document as any).fonts?.ready?.then(() => apply(true));
    },
    [apply, schedule, detach],
  );

  // 回调 ref：元素挂载即接管尺寸监听；卸载（如跨断点交叉淡出）即清理。
  const ref = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      detach();
      if (el && supportedRef.current) attach(el);
    },
    [attach, detach],
  );

  // 仅客户端：探测是否支持 url() 位移 backdrop-filter；支持且元素已挂载则立即接管。
  useEffect(() => {
    const ua = navigator.userAgent;
    const isWebkit = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    let ok = false;
    if (!isWebkit && !isFirefox) {
      const div = document.createElement('div');
      (div.style as CSSStyleDeclaration).backdropFilter = `url(#${filterId})`;
      ok = (div.style as CSSStyleDeclaration).backdropFilter !== '';
    }
    supportedRef.current = ok;
    setSupported(ok);
    if (ok && elRef.current) attach(elRef.current);
    return detach;
  }, [filterId, attach, detach]);

  const svg = (
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          <feDisplacementMap ref={redRef} in="SourceGraphic" in2="map" result="dispRed" />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="red"
          />
          <feDisplacementMap ref={greenRef} in="SourceGraphic" in2="map" result="dispGreen" />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="green"
          />
          <feDisplacementMap ref={blueRef} in="SourceGraphic" in2="map" result="dispBlue" />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="blue"
          />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur ref={blurRef} in="output" stdDeviation={o.displace} />
        </filter>
      </defs>
    </svg>
  );

  return { ref, filterId, supported, svg };
}
