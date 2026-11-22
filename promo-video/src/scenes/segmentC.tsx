import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, SHADOW} from '../design/tokens';
import {
  Bg,
  Chip,
  ChipDark,
  IconCheck,
  IconX,
  PhoneFrame,
  clamp,
  easeOut,
  mixColor,
} from '../components/primitives';

// ---------- 镜 05 ｜ 0:26–0:34 ｜ 二值卡片：会 / 不会 + 开关切换后去色 ----------
export const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const g = interpolate(frame, [150, 168], [0, 1], clamp);
  const knobX =
    frame < 60
      ? 8
      : frame < 69
        ? interpolate(frame, [60, 69], [8, 76], {...clamp, easing: easeOut})
        : frame < 120
          ? 76
          : interpolate(frame, [120, 129], [76, 8], {...clamp, easing: easeOut});
  const leftBg = mixColor('#DCEFEA', '#E5E7E7', g);
  const rightBg = mixColor('#F2E2E2', '#E5E7E7', g);
  const leftInk = mixColor('#2E6B5F', '#8A9A9D', g);
  const rightInk = mixColor('#A34E4E', '#8A9A9D', g);

  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <div style={{position: 'absolute', top: 110, left: 0, right: 0}}>
        <Chip>传统模型：会 / 不会（二值）</Chip>
      </div>
      <AbsoluteFill
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <div style={{position: 'relative'}}>
          <div
            style={{
              width: 880,
              height: 430,
              borderRadius: 24,
              background: C.card,
              boxShadow: SHADOW.s3,
              border: `1px solid ${C.line}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                height: 112,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 34,
                  fontWeight: 700,
                  color: C.ink,
                }}
              >
                ability
              </span>
              <span style={{fontFamily: FONT, fontSize: 16, color: C.inkFaint}}>
                /əˈbɪləti/
              </span>
            </div>
            <div style={{flex: 1, display: 'flex'}}>
              <div
                style={{
                  flex: 1,
                  background: leftBg,
                  borderRadius: '0 0 0 23px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 120,
                    fontWeight: 700,
                    color: leftInk,
                    lineHeight: 1,
                  }}
                >
                  会
                </span>
                <IconCheck size={40} style={{color: leftInk}} />
              </div>
              <div
                style={{
                  flex: 1,
                  background: rightBg,
                  borderLeft: `1px solid ${C.line}`,
                  borderRadius: '0 0 23px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 120,
                    fontWeight: 700,
                    color: rightInk,
                    lineHeight: 1,
                  }}
                >
                  不会
                </span>
                <IconX size={40} style={{color: rightInk}} />
              </div>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -34,
              marginLeft: -75,
              width: 150,
              height: 68,
              borderRadius: 999,
              background: '#FFFFFF',
              border: `1px solid ${C.line}`,
              boxShadow: SHADOW.s2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: knobX,
                top: 8,
                width: 52,
                height: 52,
                borderRadius: 26,
                background: C.primary,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- 镜 06 ｜ 0:34–0:44 ｜ 手机刷题界面：英选中答对 → 中拼英卡住 ----------
const QuizUI: React.FC<{frame: number}> = ({frame}) => {
  const phase2 = frame >= 150;
  const typed = 'abili';
  const shownCount = Math.floor(interpolate(frame, [162, 198], [0, 5], clamp));
  const error = frame >= 215;
  const shakeX = error
    ? Math.sin((frame - 215) * 2.1) * 7 * interpolate(frame, [215, 226], [1, 0], clamp)
    : 0;
  const solOp = interpolate(frame, [74, 86], [0, 1], clamp);
  const haloOp = interpolate(frame, [60, 76], [0.8, 0], clamp);
  const haloScale = interpolate(frame, [60, 76], [1, 1.28], clamp);
  const corrOp = interpolate(frame, [228, 240], [0, 1], clamp);
  const options = [
    {k: 'A', text: '能力', correct: true},
    {k: 'B', text: '缺席', correct: false},
    {k: 'C', text: '吸收', correct: false},
    {k: 'D', text: '调整', correct: false},
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#F7FAF9',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* 固定头部 */}
      <div style={{padding: '14px 14px 10px'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: '#FFFFFF',
              border: `1px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconX size={13} style={{color: C.inkSoft}} />
          </div>
          <div style={{fontSize: 13, fontWeight: 600, color: C.ink}}>
            {phase2 ? '第 4 题' : '第 3 题'}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: MONO,
              color: C.inkSoft,
              background: '#FFFFFF',
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: '4px 10px',
            }}
          >
            00:42
          </div>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 999,
            background: '#E3ECEA',
            marginTop: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: phase2 ? '40%' : '30%',
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${C.primarySoft}, ${C.primary})`,
            }}
          />
        </div>
      </div>

      {/* 内容区 */}
      <div style={{flex: 1, padding: '4px 14px', overflow: 'hidden'}}>
        {!phase2 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              boxShadow: SHADOW.s1,
              border: `1px solid ${C.line}`,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 600,
                color: C.primary,
                background: 'rgba(63,143,128,0.09)',
                borderRadius: 999,
                padding: '4px 10px',
              }}
            >
              看英文，选中文
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 30,
                fontWeight: 700,
                color: C.ink,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              ability
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.inkFaint,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              /əˈbɪləti/
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 12,
              }}
            >
              {options.map((o) => {
                const selected = frame >= 60 && o.correct;
                return (
                  <div
                    key={o.k}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 10px',
                      borderRadius: 14,
                      border: `2px solid ${selected ? C.primary : C.line}`,
                      background: selected ? 'rgba(63,143,128,0.07)' : '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: selected ? C.primary : '#EAF1EF',
                        color: selected ? '#FFFFFF' : C.inkSoft,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {o.k}
                    </div>
                    <span style={{fontSize: 13, color: C.ink, fontWeight: 500}}>
                      {o.text}
                    </span>
                    {selected ? (
                      <React.Fragment>
                        <IconCheck
                          size={15}
                          style={{color: C.primary, marginLeft: 'auto'}}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: -3,
                            borderRadius: 16,
                            border: `2px solid ${C.primaryGlow}`,
                            opacity: haloOp,
                            scale: `${haloScale}`,
                            pointerEvents: 'none',
                          }}
                        />
                      </React.Fragment>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                opacity: solOp,
                background: 'rgba(63,143,128,0.06)',
                border: '1px solid rgba(63,143,128,0.18)',
                borderRadius: 14,
                padding: '10px 12px',
                marginTop: 10,
              }}
            >
              <div style={{fontSize: 12, fontWeight: 700, color: C.primary}}>
                回答正确
              </div>
              <div style={{fontSize: 11, color: C.inkSoft, marginTop: 3}}>
                词义：n. 能力；才能
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              boxShadow: SHADOW.s1,
              border: `1px solid ${C.line}`,
              padding: 16,
              translate: `${shakeX}px 0px`,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 600,
                color: C.primary,
                background: 'rgba(63,143,128,0.09)',
                borderRadius: 999,
                padding: '4px 10px',
              }}
            >
              看中文，拼写单词
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: C.ink,
                textAlign: 'center',
                marginTop: 14,
              }}
            >
              能力
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.inkFaint,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              拼写出对应的英文单词
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 48,
                borderRadius: 14,
                border: `2px solid ${error ? C.danger : C.line}`,
                background: error ? 'rgba(194,94,94,0.05)' : '#FFFFFF',
                padding: '0 12px',
                marginTop: 14,
                fontFamily: MONO,
                fontSize: 20,
                color: C.ink,
              }}
            >
              <span>{typed.slice(0, shownCount)}</span>
              <div
                style={{
                  width: 2,
                  height: 22,
                  marginLeft: 2,
                  background: frame % 24 < 12 ? C.primary : 'transparent',
                }}
              />
              {error ? (
                <IconX size={16} style={{color: C.danger, marginLeft: 'auto'}} />
              ) : null}
            </div>
            <div style={{marginTop: 10}}>
              {frame >= 228 ? (
                <div style={{fontSize: 12, color: C.danger, opacity: corrOp}}>
                  正确拼写：ability
                </div>
              ) : (
                <div style={{fontSize: 12, color: C.inkFaint}}>输入中…</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 固定底栏 */}
      <div style={{padding: '10px 14px 16px'}}>
        <div
          style={{
            background: phase2 ? '#B9C6C3' : C.ink,
            color: '#FFFFFF',
            borderRadius: 12,
            padding: '12px 0',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {!phase2 && frame >= 84 ? '下一题' : '提交答案'}
        </div>
      </div>
    </div>
  );
};

export const Scene06: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneScale = interpolate(frame, [288, 300], [1, 1.14], clamp);

  return (
    <AbsoluteFill>
      <Bg variant="dark" />
      {/* 背景模糊副本 */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: -170,
            marginTop: -302,
            width: 340,
            height: 604,
            scale: '5.7',
            filter: 'blur(36px) brightness(0.55)',
          }}
        >
          <QuizUI frame={frame} />
        </div>
      </AbsoluteFill>
      {/* 中央手机 */}
      <AbsoluteFill
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <div style={{scale: `${phoneScale}`}}>
          <PhoneFrame width={340} height={604}>
            <QuizUI frame={frame} />
          </PhoneFrame>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 90, left: 0, right: 0}}>
        <ChipDark>ability：看得懂 ≠ 写得出</ChipDark>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 镜 07 ｜ 0:44–0:56 ｜ 三维掌握度：kc1 / kc2 / kc3 ----------
const DIMS = [
  {kc: '01', name: '看得出意思', val: 0.95, weak: false},
  {kc: '02', name: '用得上搭配', val: 0.6, weak: false},
  {kc: '03', name: '听音能拼写', val: 0.35, weak: true},
];

export const Scene07: React.FC = () => {
  const frame = useCurrentFrame();
  const noteOp = interpolate(frame, [26, 40], [0, 1], clamp);
  const fill = interpolate(frame, [96, 120], [0, 1], {...clamp, easing: easeOut});
  const flashOp =
    interpolate(frame, [150, 158], [0, 1], clamp) *
    interpolate(frame, [158, 174], [1, 0], clamp);
  const weakOp = interpolate(frame, [170, 182], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <div
        style={{
          position: 'absolute',
          top: 84,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Chip>看得出意思 · 用得上搭配 · 听音能拼写</Chip>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 28,
            color: C.inkFaint,
            opacity: noteOp,
          }}
        >
          初始熟练度 0.5 · 满分 1
        </div>
      </div>
      <AbsoluteFill
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <div style={{display: 'flex', gap: 48}}>
          {DIMS.map((d, i) => {
            const t0 = 34 + i * 8;
            const op = interpolate(frame, [t0, t0 + 18], [0, 1], clamp);
            const sx = interpolate(frame, [t0, t0 + 18], [0.3, 1], {
              ...clamp,
              easing: easeOut,
            });
            return (
              <div
                key={d.kc}
                style={{
                  position: 'relative',
                  width: 380,
                  padding: '36px 34px',
                  borderRadius: 16,
                  background: C.card,
                  boxShadow: SHADOW.s2,
                  opacity: op,
                  scale: `${sx} 1`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 26,
                      fontWeight: 600,
                      color: C.primary,
                      background: 'rgba(63,143,128,0.09)',
                      borderRadius: 999,
                      padding: '4px 18px',
                    }}
                  >
                    {d.kc}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 36,
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    {d.name}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 64,
                    fontWeight: 700,
                    color: d.weak ? C.danger : C.primary,
                  }}
                >
                  {d.val.toFixed(2)}
                </span>
                <div
                  style={{
                    position: 'relative',
                    width: 310,
                    height: 18,
                    borderRadius: 9,
                    background: '#E3ECEA',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: d.val * 310 * fill,
                      height: '100%',
                      borderRadius: 9,
                      background: d.weak
                        ? `linear-gradient(90deg, ${C.danger}, ${C.dangerSoft})`
                        : `linear-gradient(90deg, ${C.primary}, ${C.primaryBright})`,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 155,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: 'rgba(23, 40, 43, 0.22)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    height: 40,
                  }}
                >
                  {d.weak ? (
                    <div
                      style={{
                        opacity: weakOp,
                        background: C.danger,
                        color: '#F8E4E4',
                        fontFamily: FONT,
                        fontSize: 24,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: '6px 22px',
                      }}
                    >
                      薄弱
                    </div>
                  ) : null}
                </div>
                {d.weak ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 16,
                      border: `3px solid ${C.danger}`,
                      opacity: flashOp,
                      pointerEvents: 'none',
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
