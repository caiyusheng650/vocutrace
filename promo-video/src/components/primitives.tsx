import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, SHADOW} from '../design/tokens';

export const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// 确定性伪随机（避免每帧变化）
export const seeded = (i: number): number => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const countUp = (
  frame: number,
  start: number,
  dur: number,
  target: number,
  from = 0
): number =>
  interpolate(frame, [start, start + dur], [from, target], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

// ---------- 背景 ----------
export const Bg: React.FC<{
  variant?: 'dark' | 'light' | 'white';
}> = ({variant = 'dark'}) => {
  const bg =
    variant === 'dark'
      ? `radial-gradient(1200px 700px at 50% 30%, ${C.bgDark2}, ${C.bgDark})`
      : variant === 'light'
        ? `linear-gradient(180deg, ${C.bgLight}, ${C.bgLight2})`
        : '#FFFFFF';
  const gridColor =
    variant === 'dark' ? 'rgba(127,184,172,0.05)' : 'rgba(63,143,128,0.06)';
  return (
    <AbsoluteFill style={{background: bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: '84px 84px',
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- 屏幕文字（顶部提示条） ----------
export const Chip: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  translateY?: number;
  style?: React.CSSProperties;
}> = ({children, opacity = 1, translateY = 0, style}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      opacity,
      translate: `0px ${translateY}px`,
      ...style,
    }}
  >
    <div
      style={{
        background: 'rgba(28, 48, 54, 0.06)',
        border: `1px solid rgba(63, 143, 128, 0.28)`,
        borderRadius: 999,
        padding: '14px 40px',
        fontFamily: FONT,
        fontSize: 36,
        fontWeight: 600,
        color: C.ink,
        letterSpacing: 2,
        ...style,
      }}
    >
      {children}
    </div>
  </div>
);

// 深色背景上的提示条
export const ChipDark: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  translateY?: number;
  style?: React.CSSProperties;
}> = ({children, opacity = 1, translateY = 0, style}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      opacity,
      translate: `0px ${translateY}px`,
    }}
  >
    <div
      style={{
        background: 'rgba(127, 184, 172, 0.08)',
        border: `1px solid rgba(127, 184, 172, 0.35)`,
        borderRadius: 999,
        padding: '14px 40px',
        fontFamily: FONT,
        fontSize: 36,
        fontWeight: 600,
        color: '#DDEBE7',
        letterSpacing: 2,
        ...style,
      }}
    >
      {children}
    </div>
  </div>
);

// ---------- 关键词高亮文本 ----------
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const Highlight: React.FC<{
  text: string;
  hl?: string[];
  boldColor?: string;
}> = ({text, hl, boldColor = C.primaryGlow}) => {
  if (!hl || hl.length === 0) return <>{text}</>;
  const re = new RegExp(`(${hl.map(escapeRegExp).join('|')})`, 'g');
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        hl.includes(p) ? (
          <span key={i} style={{color: boldColor, fontWeight: 700}}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
};

// ---------- 24 网格线性图标（禁 emoji） ----------
type IconProps = {
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

const Icon: React.FC<IconProps & {children: React.ReactNode}> = ({
  size = 48,
  strokeWidth = 1.8,
  style,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

export const IconClock: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const IconColumns: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M5 20V10" />
    <path d="M12 20V4" />
    <path d="M19 20v-7" />
    <path d="M3 20h18" />
  </Icon>
);

export const IconCurve: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4 3v18h17" />
    <path d="M4 5c6.5 0 7.5 12.5 17 13.5" />
  </Icon>
);

export const IconUser: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c1.4-3.6 4-5.2 7-5.2s5.6 1.6 7 5.2" />
  </Icon>
);

export const IconMail: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7.5 12 13l8.5-5.5" />
  </Icon>
);

export const IconPlay: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M10.2 9.2 15.6 12l-5.4 2.8z" />
  </Icon>
);

export const IconAndroid: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M5 15.5a7 7 0 0 1 14 0z" />
    <path d="M8.2 7.6 6.6 5" />
    <path d="M15.8 7.6 17.4 5" />
    <path d="M5 19h14" />
  </Icon>
);

export const IconCheck: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Icon>
);

export const IconX: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Icon>
);

export const IconBattery: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="2.5" y="8" width="16" height="8" rx="2" />
    <path d="M21.5 11v2" />
    <path d="M5.5 11v2" />
    <path d="M8.5 11v2" />
  </Icon>
);

export const IconArrowRL: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4 9h16" />
    <path d="M17 6l3 3-3 3" />
    <path d="M20 15H4" />
    <path d="M7 12l-3 3 3 3" />
  </Icon>
);

export const IconArrowRight: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />
  </Icon>
);

export const IconArrowDown: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 4v15" />
    <path d="M6 13l6 6 6-6" />
  </Icon>
);

export const IconBook: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
  </Icon>
);

// ---------- 品牌字标 ----------
export const LogoMark: React.FC<{
  size?: number;
  color?: string;
}> = ({size = 72, color = C.primary}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: `linear-gradient(135deg, ${C.primary}, ${C.primaryBright})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: SHADOW.s2,
    }}
  >
    <svg
      width={size * 0.62}
      height={size * 0.62}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
      <path d="M7.5 10.5c1-1.6 2-1.6 3 0s2 1.6 3 0" />
    </svg>
  </div>
);

export const Wordmark: React.FC<{
  scale?: number;
  light?: boolean;
}> = ({scale = 1, light = false}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 34 * scale,
    }}
  >
    <LogoMark size={96 * scale} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 6 * scale}}>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 92 * scale,
          fontWeight: 700,
          letterSpacing: 8 * scale,
          color: light ? '#EAF2F0' : C.ink,
          lineHeight: 1.1,
        }}
      >
        词溯
      </span>
    </div>
    <span
      style={{
        fontFamily: MONO,
        fontSize: 40 * scale,
        letterSpacing: 6 * scale,
        color: light ? C.primaryGlow : C.primary,
        fontWeight: 600,
        translate: '0px 14px',
      }}
    >
      Vocutrace
    </span>
  </div>
);

// ---------- 手机外壳 ----------
export const PhoneFrame: React.FC<{
  width: number;
  height: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({width, height, children, style}) => (
  <div
    style={{
      width,
      height,
      borderRadius: width * 0.115,
      background: '#0A1315',
      padding: width * 0.024,
      boxShadow: SHADOW.s4,
      ...style,
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: width * 0.09,
        overflow: 'hidden',
        background: C.bgLight,
        position: 'relative',
      }}
    >
      {children}
    </div>
  </div>
);

// ---------- 颜色混合（用于状态间平滑过渡） ----------
export const mixColor = (a: string, b: string, t: number): string => {
  const A = [
    parseInt(a.slice(1, 3), 16),
    parseInt(a.slice(3, 5), 16),
    parseInt(a.slice(5, 7), 16),
  ];
  const B = [
    parseInt(b.slice(1, 3), 16),
    parseInt(b.slice(3, 5), 16),
    parseInt(b.slice(5, 7), 16),
  ];
  const m = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
};

// ---------- 段落转场：青绿擦除（左→右） ----------
export const TealWipe: React.FC<{frame: number; start: number}> = ({
  frame,
  start,
}) => {
  const x = interpolate(frame, [start, start + 9], ['-104%', '0%'], clamp);
  if (frame < start) return null;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(90deg, ${C.primary}, ${C.primaryBright})`,
        translate: x,
        pointerEvents: 'none',
      }}
    />
  );
};
