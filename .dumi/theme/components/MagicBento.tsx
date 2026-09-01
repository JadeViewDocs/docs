import { createStyles } from 'antd-style';
import { gsap } from 'gsap';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// 移植自 ReactBits 的 Magic Bento（https://reactbits.dev/components/magic-bento，MIT License）。
// 本地化改动：卡片数据改为 items 传入；配色接入 antd token（自动适配明暗主题）；光晕色由 glowColor 指定。

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const MOBILE_BREAKPOINT = 768;

export interface BentoItem {
  label: string;
  title: string;
  desc?: string;
  code?: string;
}

export interface MagicBentoProps {
  items: BentoItem[];
  /** 光晕颜色，RGB 三段逗号字符串，如 '249, 115, 22' */
  glowColor?: string;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  enableTilt?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
}

const createParticleElement = (x: number, y: number, color: string) => {
  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number,
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const useStyles = createStyles(({ token, css }) => ({
  grid: css`
    display: grid;
    gap: 0.5em;
    padding: 0.75em;
    max-width: 54em;
    margin: 0 auto;
    font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
    position: relative;
    user-select: none;

    @media (max-width: 599px) {
      grid-template-columns: 1fr;
      width: 90%;
      padding: 0.5em;
    }

    @media (min-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1024px) {
      grid-template-columns: repeat(4, 1fr);

      & > *:nth-child(3) {
        grid-column: span 2;
        grid-row: span 2;
      }

      & > *:nth-child(4) {
        grid-column: 1 / span 2;
        grid-row: 2 / span 2;
      }

      & > *:nth-child(6) {
        grid-column: 4;
        grid-row: 3;
      }
    }
  `,
  card: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    aspect-ratio: 4 / 3;
    min-height: 200px;
    width: 100%;
    max-width: 100%;
    padding: 1.25em;
    border-radius: 20px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    overflow: hidden;
    transition: all 0.3s ease;
    --glow-x: 50%;
    --glow-y: 50%;
    --glow-intensity: 0;
    --glow-radius: 200px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 599px) {
      min-height: 180px;
    }
  `,
  header: css`
    display: flex;
    position: relative;
    justify-content: space-between;
    z-index: 2;
  `,
  label: css`
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: ${token.colorTextTertiary};
  `,
  content: css`
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
  `,
  title: css`
    font-weight: 600;
    font-size: 1.05em;
    margin: 0 0 0.25em;
    color: ${token.colorText};
  `,
  desc: css`
    font-size: 12px;
    line-height: 1.6;
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  code: css`
    display: block;
    margin: 0.75em 0 0;
    padding: 0.65em 0.85em;
    border-radius: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorFillQuaternary};
    color: ${token.colorText};
    font-family: ${token.fontFamilyCode};
    font-size: 11px;
    line-height: 1.65;
    white-space: pre;
    overflow: auto;
  `,
  borderGlow: css`
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      padding: 6px;
      background: radial-gradient(
        var(--glow-radius) circle at var(--glow-x) var(--glow-y),
        rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 0%,
        rgba(var(--glow-color), calc(var(--glow-intensity) * 0.4)) 30%,
        transparent 60%
      );
      border-radius: inherit;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: 1;
    }
  `,
}));

interface ParticleCardProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  disableAnimations?: boolean;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

const ParticleCard = ({
  className = '',
  style,
  children,
  disableAnimations = false,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = '249, 115, 22',
  enableTilt = false,
  clickEffect = true,
  enableMagnetism = true,
}: ParticleCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor),
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) {
      initializeParticles();
    }
    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true) as HTMLElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
        });
      }, index * 100);
      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;
      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        },
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);
    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  );
};

interface GlobalSpotlightProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = '249, 115, 22',
}: GlobalSpotlightProps) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;
    const spotlight = document.createElement('div');
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;
      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        !!rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      const cards = Array.from(gridRef.current.children) as HTMLElement[];
      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach((card) => {
          card.style.setProperty('--glow-intensity', '0');
        });
        return;
      }
      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;
      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);
        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }
        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });
      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });
      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;
      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      if (gridRef.current) {
        Array.from(gridRef.current.children).forEach((card) => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
      }
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

export default function MagicBento({
  items,
  glowColor = '249, 115, 22',
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  clickEffect = true,
  enableMagnetism = true,
  enableTilt = false,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
}: MagicBentoProps) {
  const { styles } = useStyles();
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}
      <div className={`${styles.grid} bento-section`} ref={gridRef}>
        {items.map((item) => {
          const className = `${styles.card} ${enableBorderGlow ? styles.borderGlow : ''}`;
          const style = { '--glow-color': glowColor } as CSSProperties;
          const content = (
            <>
              <div className={styles.header}>
                <span className={styles.label}>{item.label}</span>
              </div>
              <div className={styles.content}>
                <h3 className={styles.title}>{item.title}</h3>
                {item.desc && <p className={styles.desc}>{item.desc}</p>}
                {item.code && <code className={styles.code}>{item.code}</code>}
              </div>
            </>
          );
          if (enableStars) {
            return (
              <ParticleCard
                key={item.title}
                className={className}
                style={style}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
              >
                {content}
              </ParticleCard>
            );
          }
          return (
            <div key={item.title} className={className} style={style}>
              {content}
            </div>
          );
        })}
      </div>
    </>
  );
}
