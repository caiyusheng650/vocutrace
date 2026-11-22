import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, SHADOW} from '../design/tokens';
import {
  Bg,
  Chip,
  ChipDark,
  clamp,
  easeOut,
  IconCurve,
  IconColumns,
  IconArrowRL,
  IconBattery,
  IconArrowDown,
} from '../components/primitives';

// ================= Scene13 ｜ 收益分公式（360f，dark） =================
const S13_TERMS = [
  {Icon: IconCurve, coef: '0.4', label: '忘掉的可能'},
  {Icon: IconColumns, coef: '0.4', label: '薄弱程度'},
  {Icon: IconArrowRL, coef: '0.1', label: '难度不合适'},
  {Icon: IconBattery, coef: '0.1', label: '今天有多累'},
];

const S13_OPS = ['+', '−', '−'];

export const Scene13: React.FC = () => {
  const frame = useCurrentFrame();
  const eqOp = interpolate(frame, [215, 235], [0, 1], clamp);
  const chipOp = interpolate(frame, [250, 270], [0, 1], clamp);
  const chipTy = interpolate(frame, [250, 270], [-16, 0], {
    ...clamp,
    easing: easeOut,
  });
  return (
    <AbsoluteFill>
      <Bg variant="dark" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <ChipDark opacity={chipOp} translateY={chipTy}>
            分数 = 忘记 0.4 + 薄弱 0.4 − 太难 0.1 − 太累 0.1
          </ChipDark>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 54,
                color: '#EAF2F0',
                opacity: eqOp,
              }}
            >
              分数 =
            </span>
            {S13_TERMS.map(({Icon, coef, label}, i) => {
              const s = 45 + i * 45;
              const ty = interpolate(frame, [s, s + 16], [70, 0], {
                ...clamp,
                easing: easeOut,
              });
              const op = interpolate(frame, [s, s + 16], [0, 1], clamp);
              const pulse = interpolate(
                frame,
                [s + 15, s + 16, s + 34],
                [0, 1, 0],
                clamp
              );
              return (
                <React.Fragment key={label}>
                  <div
                    style={{
                      position: 'relative',
                      width: 270,
                      height: 250,
                      borderRadius: 16,
                      background: C.cardDark,
                      border: `1px solid ${C.lineDark}`,
                      opacity: op,
                      translate: `0px ${ty}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                    }}
                  >
                    <Icon size={44} style={{color: C.primaryGlow}} />
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 54,
                        fontWeight: 700,
                        color: '#EAF2F0',
                      }}
                    >
                      {coef} ×
                    </span>
                    <span
                      style={{fontFamily: FONT, fontSize: 30, color: '#B8CCC7'}}
                    >
                      {label}
                    </span>
                    {/* 落位后的发光边框脉冲 */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 16,
                        border: `2px solid ${C.primaryGlow}`,
                        opacity: pulse,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                  {i < S13_OPS.length ? (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 64,
                        color: '#9FB4B0',
                        opacity: eqOp,
                      }}
                    >
                      {S13_OPS[i]}
                    </span>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================= Scene14 ｜ 取分最高的一题（240f，light） =================
const S14_CANDS = [
  {w: 'ability', s: 0.86},
  {w: 'achieve', s: 0.72},
  {w: 'balance', s: 0.55},
  {w: 'decline', s: 0.38},
  {w: 'obtain', s: 0.21},
];

// 候选 j 的初始行序（排序前）
const S14_INIT = [2, 0, 4, 1, 3];

export const Scene14: React.FC = () => {
  const frame = useCurrentFrame();
  // 左侧：过易 / 过难 被同一惩罚项压暗
  const press = interpolate(frame, [90, 120], [1, 0.45], clamp);
  const noteOp = interpolate(frame, [150, 160], [0, 1], clamp);
  // 右侧：TOP1 高亮
  const topScale = interpolate(frame, [84, 96], [1, 1.08], {
    ...clamp,
    easing: easeOut,
  });
  const topRing = interpolate(frame, [84, 96], [0, 1], clamp);
  // ability pill 飞向「下一题」卡片
  const pillDx = interpolate(frame, [96, 112], [0, 290], {
    ...clamp,
    easing: easeOut,
  });
  const pillDy = interpolate(frame, [96, 112], [0, 444], {
    ...clamp,
    easing: easeOut,
  });
  const pillOp = interpolate(frame, [96, 100, 106, 112], [0, 1, 1, 0], clamp);
  // 「下一题」卡片
  const cardT = interpolate(frame, [100, 114], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <Chip>选分数最高的一题｜太难与太简单，同一条规则</Chip>
        </div>
      </AbsoluteFill>
      {/* 左侧区：同一惩罚项 */}
      <div style={{position: 'absolute', left: 150, top: 300, width: 480}}>
        <div
          style={{fontFamily: FONT, fontSize: 40, fontWeight: 700, color: C.ink}}
        >
          同一条规则
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT,
            fontSize: 26,
            color: C.inkFaint,
          }}
        >
          难度不合适
        </div>
        {['过易', '过难'].map((lbl, i) => (
          <div
            key={lbl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: i === 0 ? 54 : 80,
              opacity: press,
            }}
          >
            <span
              style={{
                width: 64,
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: 600,
                color: C.ink,
              }}
            >
              {lbl}
            </span>
            <div
              style={{
                width: 320 * press,
                height: 34,
                borderRadius: 8,
                background: '#B8CCC7',
              }}
            />
            <IconArrowDown size={28} style={{color: C.dangerSoft}} />
          </div>
        ))}
        <div
          style={{
            marginTop: 46,
            fontFamily: FONT,
            fontSize: 26,
            color: C.inkSoft,
            opacity: noteOp,
          }}
        >
          连续答错时，难题自动让路
        </div>
      </div>
      {/* 右侧区：候选词条形图（排序） */}
      <div style={{position: 'absolute', left: 720, top: 280}}>
        {S14_CANDS.map((c, j) => {
          const y = interpolate(
            frame,
            [30, 54],
            [S14_INIT[j] * 88, j * 88],
            {...clamp, easing: easeOut}
          );
          const isTop = j === 0;
          return (
            <div
              key={c.w}
              style={{
                position: 'absolute',
                left: 0,
                top: y,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                scale: isTop ? `${topScale}` : '1',
                transformOrigin: '0 50%',
              }}
            >
              <span
                style={{
                  width: 170,
                  fontFamily: MONO,
                  fontSize: 28,
                  color: C.ink,
                }}
              >
                {c.w}
              </span>
              <div
                style={{
                  width: c.s * 460,
                  height: 40,
                  borderRadius: 8,
                  background: `linear-gradient(90deg, ${C.primary}, ${C.primaryBright})`,
                  boxShadow: isTop
                    ? `0 0 0 2px rgba(63,143,128,${topRing})`
                    : undefined,
                }}
              />
              <span
                style={{fontFamily: MONO, fontSize: 24, color: C.inkSoft}}
              >
                {c.s.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
      {/* 「下一题」卡片 */}
      <div
        style={{
          position: 'absolute',
          left: 1150,
          top: 700,
          width: 480,
          height: 150,
          borderRadius: 24,
          background: C.card,
          border: `2px solid ${C.primary}`,
          boxShadow: SHADOW.s3,
          boxSizing: 'border-box',
          opacity: cardT,
          translate: `0px ${20 * (1 - cardT)}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
          padding: '0 36px',
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 600,
            color: C.primary,
          }}
        >
          下一题
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 700,
            color: C.ink,
          }}
        >
          ability · 看英文，选中文
        </span>
      </div>
      {/* ability pill：从 TOP1 行飞向「下一题」卡片 */}
      <div
        style={{
          position: 'absolute',
          left: 950,
          top: 296,
          translate: `${pillDx}px ${pillDy}px`,
          opacity: pillOp,
          fontFamily: MONO,
          fontSize: 28,
          color: '#FFFFFF',
          background: C.primary,
          borderRadius: 999,
          padding: '6px 24px',
        }}
      >
        ability
      </div>
    </AbsoluteFill>
  );
};

// ================= Scene15 ｜ 可观察的三组效果（360f，light） =================
const S15_BARS = [
  {h: 150, color: C.danger, label: '难', t: 80},
  {h: 104, color: C.dangerSoft, label: '中', t: 104},
  {h: 62, color: C.primarySoft, label: '易', t: 128},
];

const S15Row: React.FC<{
  word: string;
  op: number;
  tx: number;
  tag?: string;
  tagBg?: string;
  tagColor?: string;
}> = ({word, op, tx, tag, tagBg, tagColor}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 12,
      border: `1px solid ${C.line}`,
      padding: '10px 14px',
      opacity: op,
      translate: `${tx}px 0px`,
    }}
  >
    <span style={{fontFamily: MONO, fontSize: 24, color: C.ink}}>{word}</span>
    {tag ? (
      <span
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 600,
          color: tagColor,
          background: tagBg,
          borderRadius: 999,
          padding: '4px 16px',
        }}
      >
        {tag}
      </span>
    ) : null}
  </div>
);

export const Scene15: React.FC = () => {
  const frame = useCurrentFrame();
  // 卡②：拼写题占比
  const spellR = interpolate(frame, [90, 150], [0.25, 0.6], {
    ...clamp,
    easing: easeOut,
  });
  // 卡③：错题本进出
  const hesOp = interpolate(frame, [70, 90], [0, 1], clamp);
  const hesTx = interpolate(frame, [70, 90], [-40, 0], {
    ...clamp,
    easing: easeOut,
  });
  const resTx = interpolate(frame, [120, 145], [0, 60], {
    ...clamp,
    easing: easeOut,
  });
  const resOp = interpolate(frame, [120, 145], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingTop: 84}}>
          <Chip>答错 → 变简单｜会认不会拼 → 拼写题增加｜错题自动进出</Chip>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{display: 'flex', gap: 44}}>
            {/* 卡① 连续答错 → 题目变简单 */}
            {(() => {
              const s = 30;
              const op = interpolate(frame, [s, s + 16], [0, 1], clamp);
              const ty = interpolate(frame, [s, s + 16], [40, 0], {
                ...clamp,
                easing: easeOut,
              });
              return (
                <div
                  style={{
                    width: 460,
                    height: 470,
                    borderRadius: 24,
                    background: C.card,
                    boxShadow: SHADOW.s2,
                    padding: 34,
                    boxSizing: 'border-box',
                    opacity: op,
                    translate: `0px ${ty}px`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 30,
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    连续答错 → 题目变简单
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: 40,
                      paddingBottom: 6,
                    }}
                  >
                    {S15_BARS.map((b) => {
                      const sy = interpolate(
                        frame,
                        [b.t, b.t + 14],
                        [0, 1],
                        {...clamp, easing: easeOut}
                      );
                      return (
                        <div
                          key={b.label}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 14,
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: b.h,
                              borderRadius: 8,
                              background: b.color,
                              scale: `1 ${sy}`,
                              transformOrigin: 'bottom',
                            }}
                          />
                          <span
                            style={{
                              fontFamily: FONT,
                              fontSize: 24,
                              color: C.inkSoft,
                            }}
                          >
                            {b.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* 卡② 会认不会拼 → 拼写题增加 */}
            {(() => {
              const s = 39;
              const op = interpolate(frame, [s, s + 16], [0, 1], clamp);
              const ty = interpolate(frame, [s, s + 16], [40, 0], {
                ...clamp,
                easing: easeOut,
              });
              return (
                <div
                  style={{
                    width: 460,
                    height: 470,
                    borderRadius: 24,
                    background: C.card,
                    boxShadow: SHADOW.s2,
                    padding: 34,
                    boxSizing: 'border-box',
                    opacity: op,
                    translate: `0px ${ty}px`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 30,
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    会认不会拼 → 拼写题增加
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 30,
                    }}
                  >
                    <div
                      style={{
                        width: 380,
                        height: 44,
                        borderRadius: 10,
                        background: '#E3ECEA',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 380 * spellR,
                          background: `linear-gradient(90deg, ${C.primary}, ${C.primaryBright})`,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            paddingLeft: 14,
                            fontFamily: FONT,
                            fontSize: 22,
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          拼写题
                        </span>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: 30}}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            background: C.primary,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: 24,
                            color: C.inkSoft,
                          }}
                        >
                          拼写题
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            background: '#B8CCC7',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: 24,
                            color: C.inkSoft,
                          }}
                        >
                          其他题型
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* 卡③ 错题自动进出 */}
            {(() => {
              const s = 48;
              const op = interpolate(frame, [s, s + 16], [0, 1], clamp);
              const ty = interpolate(frame, [s, s + 16], [40, 0], {
                ...clamp,
                easing: easeOut,
              });
              return (
                <div
                  style={{
                    width: 460,
                    height: 470,
                    borderRadius: 24,
                    background: C.card,
                    boxShadow: SHADOW.s2,
                    padding: 34,
                    boxSizing: 'border-box',
                    opacity: op,
                    translate: `0px ${ty}px`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 30,
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    错题自动进出
                  </div>
                  <div
                    style={{
                      marginTop: 26,
                      fontFamily: FONT,
                      fontSize: 26,
                      fontWeight: 600,
                      color: C.inkSoft,
                    }}
                  >
                    错题本
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <S15Row
                      word="hesitate"
                      op={hesOp}
                      tx={hesTx}
                      tag="进入"
                      tagBg="rgba(194,94,94,0.14)"
                      tagColor={C.danger}
                    />
                    <S15Row
                      word="resolve"
                      op={resOp}
                      tx={resTx}
                      tag="移出"
                      tagBg="rgba(63,143,128,0.14)"
                      tagColor={C.primary}
                    />
                    <S15Row word="decline" op={1} tx={0} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
