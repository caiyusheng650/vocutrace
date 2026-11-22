import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, SHADOW} from '../design/tokens';
import {
  Bg,
  Chip,
  ChipDark,
  clamp,
  easeOut,
  mixColor,
  IconClock,
  IconColumns,
  IconCurve,
} from '../components/primitives';

// ================= Scene08 ｜ 三层口径（300f，light） =================
const S08_CARDS = [
  {Icon: IconClock, no: '01', title: '隔多久再考', desc: '答对拉长 · 答错重来'},
  {
    Icon: IconColumns,
    no: '02',
    title: '你有多熟',
    desc: '答对加，答错减',
  },
  {Icon: IconCurve, no: '03', title: '忘得有多快', desc: '放得越久，忘得越多'},
];

export const Scene08: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <Chip>三层口径，互相印证</Chip>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{display: 'flex', gap: 56}}>
            {S08_CARDS.map(({Icon, no, title, desc}, i) => {
              const s = 24 + i * 8;
              const op = interpolate(frame, [s, s + 16], [0, 1], clamp);
              const ty = interpolate(frame, [s, s + 16], [46, 0], {
                ...clamp,
                easing: easeOut,
              });
              return (
                <div
                  key={no}
                  style={{
                    position: 'relative',
                    width: 400,
                    height: 440,
                    borderRadius: 16,
                    background: C.card,
                    border: `1px solid ${C.line}`,
                    boxShadow: SHADOW.s2,
                    opacity: op,
                    translate: `0px ${ty}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 24,
                      right: 28,
                      fontFamily: MONO,
                      fontSize: 26,
                      color: C.inkFaint,
                    }}
                  >
                    {no}
                  </span>
                  <div
                    style={{
                      marginTop: 72,
                      width: 96,
                      height: 96,
                      borderRadius: 999,
                      background: 'rgba(63,143,128,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={44} style={{color: C.primary}} />
                  </div>
                  <div
                    style={{
                      marginTop: 44,
                      fontFamily: FONT,
                      fontSize: 42,
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      marginTop: 20,
                      fontFamily: FONT,
                      fontSize: 26,
                      color: C.inkSoft,
                    }}
                  >
                    {desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================= Scene09 ｜ SM-2 间隔时间轴（240f，dark） =================
const S09_NODES = [
  {x: 340, label: '首次答对', t: 20},
  {x: 600, label: '1 天', t: 52},
  {x: 920, label: '6 天', t: 88},
  {x: 1330, label: '更久', t: 124},
];

const S09_SEGS = [
  {from: 340, to: 600, start: 20, dim: false},
  {from: 600, to: 920, start: 52, dim: true},
  {from: 920, to: 1330, start: 88, dim: true},
  {from: 1330, to: 1590, start: 124, dim: true},
];

export const Scene09: React.FC = () => {
  const frame = useCurrentFrame();
  const recoil = interpolate(frame, [152, 158, 166], [0, -18, 0], clamp);
  const dimOp = interpolate(frame, [158, 170], [1, 0.22], clamp);
  const wrongScale = interpolate(frame, [152, 160], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const wrongLabelOp = interpolate(frame, [156, 164], [0, 1], clamp);
  const ringScale = interpolate(frame, [162, 170], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const zeroOp = interpolate(frame, [168, 176], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Bg variant="dark" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <ChipDark>答对：1 天 → 6 天 → 再往后拉长 · 答错：从头再来</ChipDark>
        </div>
      </AbsoluteFill>
      {/* 时间轴整组（回弹位移作用于此容器） */}
      <AbsoluteFill style={{translate: `${recoil}px 0px`}}>
        {/* 基线 */}
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 559,
            width: 1350,
            height: 2,
            background: C.lineDark,
          }}
        />
        {/* 节点间线段：前一节点点亮后 12f 内从左到右画出 */}
        {S09_SEGS.map((sg, i) => {
          const full = sg.to - sg.from - 26;
          const w = interpolate(frame, [sg.start, sg.start + 12], [0, full], {
            ...clamp,
            easing: easeOut,
          });
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: sg.from + 13,
                top: 558,
                width: w,
                height: 4,
                borderRadius: 2,
                background: C.primaryGlow,
                opacity: sg.dim ? dimOp : 1,
              }}
            />
          );
        })}
        {/* 答对节点 */}
        {S09_NODES.map((n, i) => {
          const sc = interpolate(frame, [n.t, n.t + 8], [0, 1], {
            ...clamp,
            easing: easeOut,
          });
          const lop = interpolate(frame, [n.t + 4, n.t + 12], [0, 1], clamp);
          const groupOp = i === 2 || i === 3 ? dimOp : 1;
          return (
            <React.Fragment key={n.label}>
              <div
                style={{
                  position: 'absolute',
                  left: n.x - 13,
                  top: 547,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: C.primaryGlow,
                  scale: `${sc}`,
                  opacity: groupOp,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: n.x,
                  top: 478,
                  translate: '-50% 0px',
                  fontFamily: FONT,
                  fontSize: 34,
                  color: '#DDEBE7',
                  whiteSpace: 'nowrap',
                  opacity: lop * groupOp,
                }}
              >
                {n.label}
              </div>
            </React.Fragment>
          );
        })}
        {/* 答错节点（红） */}
        <div
          style={{
            position: 'absolute',
            left: 1590 - 13,
            top: 547,
            width: 26,
            height: 26,
            borderRadius: 999,
            background: C.danger,
            scale: `${wrongScale}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 1590,
            top: 478,
            translate: '-50% 0px',
            fontFamily: FONT,
            fontSize: 34,
            color: C.dangerSoft,
            whiteSpace: 'nowrap',
            opacity: wrongLabelOp,
          }}
        >
          答错
        </div>
        {/* 「1 天」节点高亮光环 */}
        <div
          style={{
            position: 'absolute',
            left: 600 - 22,
            top: 560 - 22,
            width: 44,
            height: 44,
            borderRadius: 999,
            border: `3px solid ${C.primaryGlow}`,
            boxSizing: 'border-box',
            scale: `${ringScale}`,
          }}
        />
        {/* 间隔清零 */}
        <div
          style={{
            position: 'absolute',
            left: 600,
            top: 604,
            translate: '-50% 0px',
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 700,
            color: C.dangerSoft,
            whiteSpace: 'nowrap',
            opacity: zeroOp,
          }}
        >
          间隔清零
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================= Scene10 ｜ 掌握度 +0.15 / −0.2（180f，light） =================
export const Scene10: React.FC = () => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [30, 70, 90, 130], [0.5, 0.65, 0.65, 0.45], {
    ...clamp,
  });
  const markerX = 410 + v * 1100;
  const upOp = interpolate(frame, [42, 50, 82, 92], [0, 1, 1, 0], clamp);
  const upY = interpolate(frame, [42, 92], [46, 0], clamp);
  const downOp = interpolate(frame, [102, 110, 142, 152], [0, 1, 1, 0], clamp);
  const downY = interpolate(frame, [102, 152], [0, 46], clamp);
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <Chip>答对 +0.15｜答错 −0.2｜区间 [0, 1]</Chip>
        </div>
      </AbsoluteFill>
      {/* 轨道 */}
      <div
        style={{
          position: 'absolute',
          left: 410,
          top: 549,
          width: 1100,
          height: 22,
          borderRadius: 11,
          background: '#E3ECEA',
          border: `1px solid ${C.line}`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: v * 1100,
            background: `linear-gradient(90deg, ${C.primary}, ${C.primaryBright})`,
          }}
        />
      </div>
      {/* 端点标注 */}
      <div
        style={{
          position: 'absolute',
          left: 410,
          top: 592,
          translate: '-50% 0px',
          fontFamily: MONO,
          fontSize: 28,
          color: C.inkFaint,
        }}
      >
        0
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1510,
          top: 592,
          translate: '-50% 0px',
          fontFamily: MONO,
          fontSize: 28,
          color: C.inkFaint,
        }}
      >
        1
      </div>
      {/* 标记圆 */}
      <div
        style={{
          position: 'absolute',
          left: markerX - 17,
          top: 560 - 17,
          width: 34,
          height: 34,
          borderRadius: 999,
          background: C.white,
          border: `3px solid ${C.primary}`,
          boxSizing: 'border-box',
        }}
      />
      {/* 数值气泡 */}
      <div
        style={{
          position: 'absolute',
          left: markerX,
          top: 462,
          translate: '-50% 0px',
          background: C.white,
          borderRadius: 999,
          padding: '8px 26px',
          boxShadow: SHADOW.s1,
          fontFamily: MONO,
          fontSize: 36,
          fontWeight: 700,
          color: C.primary,
          whiteSpace: 'nowrap',
        }}
      >
        {v.toFixed(2)}
      </div>
      {/* 浮字 +0.15（0.65 位置，上升） */}
      <div
        style={{
          position: 'absolute',
          left: 410 + 0.65 * 1100,
          top: 376,
          translate: `-50% ${upY}px`,
          opacity: upOp,
          fontFamily: MONO,
          fontSize: 40,
          fontWeight: 700,
          color: C.primary,
          whiteSpace: 'nowrap',
        }}
      >
        +0.15
      </div>
      {/* 浮字 −0.2（0.45 位置，下沉） */}
      <div
        style={{
          position: 'absolute',
          left: 410 + 0.45 * 1100,
          top: 376,
          translate: `-50% ${downY}px`,
          opacity: downOp,
          fontFamily: MONO,
          fontSize: 40,
          fontWeight: 700,
          color: C.danger,
          whiteSpace: 'nowrap',
        }}
      >
        −0.2
      </div>
    </AbsoluteFill>
  );
};

// ================= Scene11 ｜ 遗忘概率曲线（180f，white） =================
const S11 = {left: 90, top: 40, w: 1110, h: 490};

const S11_CURVE = (() => {
  const parts: string[] = [];
  for (let t = 0; t <= 28 + 1e-6; t += 0.5) {
    const P = 1 - Math.exp(-t / 7);
    const x = S11.left + (t / 28) * S11.w;
    const y = S11.top + (1 - P) * S11.h;
    parts.push(`${parts.length === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return parts.join(' ');
})();

const S11_X7 = S11.left + (7 / 28) * S11.w; // 367.5
const S11_Y7 = S11.top + (1 - 0.632) * S11.h; // ≈220.3

const S11_XTICKS = [
  {t: 0, label: '0'},
  {t: 7, label: '7'},
  {t: 14, label: '14'},
  {t: 21, label: '21'},
  {t: 28, label: '28 天'},
];

const S11_YTICKS = [
  {v: 0, y: S11.top + S11.h},
  {v: 0.5, y: S11.top + S11.h * 0.5},
  {v: 1, y: S11.top},
];

export const Scene11: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [20, 65], [1, 0], clamp);
  const dashOp = interpolate(frame, [52, 62], [0, 1], clamp);
  const dotOp = interpolate(frame, [32, 38], [0, 1], clamp);
  const labelOp = interpolate(frame, [58, 66], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Bg variant="white" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <Chip>放得越久，忘得越多 · 大约七天忘掉一半</Chip>
        </div>
      </AbsoluteFill>
      <svg
        width={1240}
        height={600}
        viewBox="0 0 1240 600"
        style={{position: 'absolute', left: 340, top: 260}}
      >
        {/* 坐标轴 */}
        <line
          x1={90}
          y1={530}
          x2={1200}
          y2={530}
          stroke={C.line}
          strokeWidth={2}
        />
        <line
          x1={90}
          y1={40}
          x2={90}
          y2={530}
          stroke={C.line}
          strokeWidth={2}
        />
        {/* x 刻度 */}
        {S11_XTICKS.map(({t, label}) => (
          <text
            key={label}
            x={S11.left + (t / 28) * S11.w}
            y={566}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={22}
            fill={C.inkFaint}
          >
            {label}
          </text>
        ))}
        {/* y 刻度 */}
        {S11_YTICKS.map(({v, y}) => (
          <text
            key={v}
            x={72}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            fontFamily={MONO}
            fontSize={22}
            fill={C.inkFaint}
          >
            {v}
          </text>
        ))}
        {/* 遗忘概率曲线 */}
        <path
          d={S11_CURVE}
          stroke={C.primary}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={draw}
        />
        {/* 半衰期垂直虚线 */}
        <line
          x1={S11_X7}
          y1={S11_Y7}
          x2={S11_X7}
          y2={530}
          stroke={C.inkSoft}
          strokeWidth={2}
          strokeDasharray="8 8"
          opacity={dashOp}
        />
        {/* 曲线上的点 */}
        <circle cx={S11_X7} cy={S11_Y7} r={8} fill={C.primary} opacity={dotOp} />
        {/* 半衰期标签 */}
        <text
          x={S11_X7 + 22}
          y={400}
          fontFamily={FONT}
          fontSize={30}
          fontWeight={600}
          fill={C.ink}
          opacity={labelOp}
        >
          七天忘掉一半
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// ================= Scene12 ｜ 三层口径 → 三个回答（240f，light） =================
const S12_ROWS = [
  {q: '隔多久再考', a: '看上次答对是几天前'},
  {q: '哪种能力弱', a: '看三种能力谁最低'},
  {q: '现在多危险', a: '看离忘掉还有多远'},
];

export const Scene12: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <Chip>隔多久考 · 考哪种能力 · 先考哪个</Chip>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 36}}>
            {S12_ROWS.map((r, i) => {
              const a = 40 + i * 55;
              const t = interpolate(frame, [a, a + 12], [0, 1], {
                ...clamp,
                easing: easeOut,
              });
              const border = mixColor(C.line, C.primary, t);
              const ansColor = mixColor(C.ink, C.primary, t);
              const rightBg = mixColor('#FFFFFF', '#3F8F80', 0.07 * t);
              const rightOp = 0.35 + 0.65 * t;
              return (
                <div
                  key={r.q}
                  style={{display: 'flex', alignItems: 'center', gap: 24}}
                >
                  {/* 左卡：问题 */}
                  <div
                    style={{
                      width: 560,
                      height: 116,
                      borderRadius: 16,
                      background: C.card,
                      border: `2px solid ${border}`,
                      boxShadow: SHADOW.s1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT,
                      fontSize: 40,
                      fontWeight: 600,
                      color: C.ink,
                    }}
                  >
                    {r.q}
                  </div>
                  {/* 箭头：横线 + 三角头，scaleX 自左展开 */}
                  <div
                    style={{
                      width: 90,
                      height: 24,
                      position: 'relative',
                      scale: `${t} 1`,
                      transformOrigin: '0 50%',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 11,
                        width: 74,
                        height: 2,
                        background: C.primary,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 4,
                        width: 0,
                        height: 0,
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderLeft: `16px solid ${C.primary}`,
                      }}
                    />
                  </div>
                  {/* 右卡：机制 */}
                  <div
                    style={{
                      width: 560,
                      height: 116,
                      borderRadius: 16,
                      background: rightBg,
                      border: `2px solid ${border}`,
                      boxShadow: SHADOW.s1,
                      opacity: rightOp,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT,
                      fontSize: 40,
                      fontWeight: 700,
                      color: ansColor,
                    }}
                  >
                    {r.a}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
