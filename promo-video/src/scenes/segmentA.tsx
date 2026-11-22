import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, RADIUS, SHADOW} from '../design/tokens';
import {
  Bg,
  ChipDark,
  IconCheck,
  IconX,
  TealWipe,
  Wordmark,
  clamp,
  countUp,
  easeOut,
  seeded,
} from '../components/primitives';

// ---------- 镜 01 ｜ 0:00–0:05 ｜ 单词卡堆叠浮入 + 失焦 + 逐字标题 + 白闪 ----------
const WORDS = [
  'ability',
  'achieve',
  'balance',
  'benefit',
  'capable',
  'challenge',
  'confuse',
  'curious',
  'decline',
  'effort',
  'examine',
  'fluent',
  'gather',
  'hesitate',
  'improve',
  'journey',
  'lecture',
  'measure',
  'notice',
  'purpose',
];

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const blur = interpolate(frame, [100, 138], [0, 14], clamp);
  const groupScale = interpolate(frame, [100, 138], [1, 0.9], clamp);
  const groupOp = interpolate(frame, [100, 138], [1, 0], clamp);
  const flash = interpolate(frame, [144, 150], [0, 1], clamp);
  const title = '背单词，时间去哪了？';

  return (
    <AbsoluteFill>
      <Bg variant="dark" />
      <AbsoluteFill
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <div
          style={{
            position: 'relative',
            width: 1000,
            height: 600,
            filter: `blur(${blur}px)`,
            scale: `${groupScale}`,
            opacity: groupOp,
          }}
        >
          {WORDS.map((w, i) => {
            const t0 = i * 4.5;
            const op = interpolate(frame, [t0, t0 + 16], [0, 1], clamp);
            const ty = interpolate(frame, [t0, t0 + 16], [80, 0], {
              ...clamp,
              easing: easeOut,
            });
            return (
              <div
                key={w}
                style={{
                  position: 'absolute',
                  left: 40 + seeded(i) * 660,
                  top: 30 + seeded(i + 40) * 420,
                  rotate: `${(seeded(i + 80) - 0.5) * 16}deg`,
                  translate: `0px ${ty}px`,
                  opacity: op,
                  width: 250,
                  padding: '18px 24px',
                  background: C.cardDark,
                  border: `1px solid ${C.lineDark}`,
                  borderRadius: RADIUS.card,
                  boxShadow: SHADOW.s2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 28,
                    fontWeight: 600,
                    color: '#DDEBE7',
                  }}
                >
                  {w}
                </span>
                {i % 3 === 1 ? (
                  <IconX size={26} style={{color: C.dangerSoft}} />
                ) : (
                  <IconCheck size={26} style={{color: C.primaryGlow}} />
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `radial-gradient(680px 220px at 50% 50%, rgba(14,25,28,0.92), rgba(14,25,28,0) 72%)`,
          opacity: interpolate(frame, [100, 118], [0, 1], clamp),
        }}
      >
        <div style={{display: 'flex'}}>
          {title.split('').map((ch, i) => {
            const t0 = 106 + i * 1.2;
            const op = interpolate(frame, [t0, t0 + 5], [0, 1], clamp);
            const ty = interpolate(frame, [t0, t0 + 8], [20, 0], {
              ...clamp,
              easing: easeOut,
            });
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT,
                  fontSize: 92,
                  fontWeight: 700,
                  color: '#EAF2F0',
                  letterSpacing: 6,
                  opacity: op,
                  translate: `0px ${ty}px`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{background: C.white, opacity: flash, pointerEvents: 'none'}}
      />
    </AbsoluteFill>
  );
};

// ---------- 镜 02 ｜ 0:05–0:10 ｜ 五段掌握度条 + 遗忘边缘扫描光 ----------
export const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  const chipOp = interpolate(frame, [8, 20], [0, 1], clamp);
  const chipTy = interpolate(frame, [8, 20], [18, 0], {
    ...clamp,
    easing: easeOut,
  });
  const midOp = interpolate(frame, [44, 70], [0.35, 1], clamp);
  const seg2Left = 2 * (272 + 8);
  const barWidth = 5 * 272 + 4 * 8;
  const scanLeft = interpolate(
    frame,
    [30, 66],
    [seg2Left - 160, seg2Left + 272 + 40],
    clamp
  );
  const scanOp = interpolate(frame, [30, 36, 60, 66], [0, 1, 1, 0], clamp);
  const labelOp = interpolate(frame, [70, 84], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Bg variant="dark" />
      <div style={{position: 'absolute', top: 130, left: 0, right: 0}}>
        <ChipDark opacity={chipOp} translateY={chipTy}>
          真正该复习的，只有中间那一小段
        </ChipDark>
      </div>
      <AbsoluteFill
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{position: 'relative', width: barWidth, height: 72}}>
            <div
              style={{
                position: 'absolute',
                left: seg2Left,
                width: 272,
                textAlign: 'center',
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 700,
                color: C.primaryGlow,
                opacity: labelOp,
              }}
            >
              遗忘边缘
            </div>
          </div>
          <div style={{position: 'relative', display: 'flex', gap: 8}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 272,
                  height: 96,
                  borderRadius: 20,
                  background:
                    i === 2
                      ? `linear-gradient(90deg, ${C.primary}, ${C.primaryBright})`
                      : C.cardDark,
                  opacity: i === 2 ? midOp : 0.3,
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                top: -14,
                bottom: -14,
                width: 150,
                left: scanLeft,
                background:
                  'linear-gradient(90deg, transparent, rgba(126,208,188,0.75), transparent)',
                opacity: scanOp,
                pointerEvents: 'none',
              }}
            />
          </div>
          <div
            style={{
              width: barWidth,
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 28,
              fontFamily: FONT,
              fontSize: 34,
              color: '#9FB4B0',
            }}
          >
            <span>已会</span>
            <span>暂不可能</span>
          </div>
        </div>
      </AbsoluteFill>
      <TealWipe frame={frame} start={141} />
    </AbsoluteFill>
  );
};

// ---------- 镜 03 ｜ 0:10–0:18 ｜ 品牌字标缩放 + 光带扫过 + 副标题 ----------
export const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const wmScale = interpolate(frame, [12, 44], [0.6, 1], {
    ...clamp,
    easing: easeOut,
  });
  const wmOp = interpolate(frame, [8, 26], [0, 1], clamp);
  const beamX = interpolate(frame, [48, 92], [-260, 980], clamp);
  const beamOp = interpolate(frame, [48, 56, 84, 92], [0, 1, 1, 0], clamp);
  const subOp = interpolate(frame, [70, 94], [0, 1], clamp);
  const subTy = interpolate(frame, [70, 94], [28, 0], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 80,
        }}
      >
        <div style={{position: 'relative', scale: `${wmScale}`, opacity: wmOp}}>
          <Wordmark scale={1.4} />
          <div
            style={{
              position: 'absolute',
              inset: '-40px -60px',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: 140,
                translate: `${beamX}px 0px`,
                opacity: beamOp,
                background:
                  'linear-gradient(90deg, transparent, rgba(126,208,188,0.55), transparent)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            color: C.inkSoft,
            letterSpacing: 6,
            opacity: subOp,
            translate: `0px ${subTy}px`,
          }}
        >
          让每一道题，都出在
          <span style={{color: C.primary, fontWeight: 700}}>最该复习</span>
          的地方
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- 镜 04 ｜ 0:18–0:26 ｜ 词条规模 count-up + 三词书卡 + 四要素 pill ----------
export const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const total = Math.round(countUp(frame, 20, 40, 10479)).toLocaleString('en-US');
  const exitTy = interpolate(frame, [226, 240], [0, -70], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const exitOp = interpolate(frame, [226, 240], [1, 0], clamp);
  const pillsOp = interpolate(frame, [120, 140], [0, 1], clamp);
  const books = [
    {label: '中考', n: 1603},
    {label: '四级', n: 3848},
    {label: '雅思', n: 5028},
  ];

  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill style={{translate: `0px ${exitTy}px`, opacity: exitOp}}>
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: 24,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 128,
              fontWeight: 700,
              color: C.primary,
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 46,
              fontWeight: 600,
              color: C.inkSoft,
            }}
          >
            条词条
          </span>
        </div>
        <AbsoluteFill
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
        >
          <div style={{display: 'flex', gap: 56}}>
            {books.map((b, i) => {
              const t0 = 62 + i * 7;
              const op = interpolate(frame, [t0, t0 + 14], [0, 1], clamp);
              const ty = interpolate(frame, [t0, t0 + 16], [54, 0], {
                ...clamp,
                easing: easeOut,
              });
              const num = Math.round(
                countUp(frame, t0 + 8, 36, b.n)
              ).toLocaleString('en-US');
              return (
                <div
                  key={b.label}
                  style={{
                    width: 340,
                    padding: '44px 40px',
                    borderRadius: 16,
                    border: `1px solid ${C.line}`,
                    boxShadow: SHADOW.s2,
                    background: C.card,
                    opacity: op,
                    translate: `0px ${ty}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 40,
                      fontWeight: 700,
                      color: C.ink,
                      letterSpacing: 4,
                    }}
                  >
                    {b.label}
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 76,
                      fontWeight: 700,
                      color: C.primary,
                    }}
                  >
                    {num}
                  </span>
                  <span style={{fontFamily: FONT, fontSize: 26, color: C.inkFaint}}>
                    词条
                  </span>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 26,
            opacity: pillsOp,
          }}
        >
          {['音标', '释义', '词根助记', '易混词'].map((p) => (
            <div
              key={p}
              style={{
                padding: '12px 34px',
                borderRadius: 999,
                background: 'rgba(63,143,128,0.08)',
                border: '1px solid rgba(63,143,128,0.25)',
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: 600,
                color: C.primary,
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
