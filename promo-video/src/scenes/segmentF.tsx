import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, SHADOW} from '../design/tokens';
import {
  Bg,
  Chip,
  PhoneFrame,
  LogoMark,
  IconX,
  IconClock,
  IconBook,
  IconCheck,
  IconUser,
  IconMail,
  IconPlay,
  IconAndroid,
  IconArrowDown,
  IconArrowRight,
  TealWipe,
  mixColor,
  clamp,
  easeOut,
} from '../components/primitives';

// ================= 手机界面还原（真实产品文案，小字号） =================

// ① 首页：今日任务 + 开始刷题 + 看广告领会员
const HomeUI: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#F7FAF9',
      fontFamily: FONT,
      display: 'flex',
      flexDirection: 'column',
      padding: 14,
      gap: 12,
      boxSizing: 'border-box',
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
      <LogoMark size={22} />
      <span style={{fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: 1}}>
        词溯
      </span>
    </div>
    <div
      style={{
        background: `linear-gradient(135deg, ${C.primary}, #2F6E62)`,
        borderRadius: 16,
        padding: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.92)'}}>
          今日任务
        </span>
        <span
          style={{
            fontSize: 8,
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 999,
            padding: '2px 9px',
          }}
        >
          中考
        </span>
      </div>
      <div style={{display: 'flex', gap: 8}}>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '8px 10px',
          }}
        >
          <div style={{fontSize: 8, color: 'rgba(255,255,255,0.7)'}}>新词</div>
          <div style={{fontSize: 17, fontWeight: 700, color: '#FFFFFF', marginTop: 2}}>
            8 / 20
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '8px 10px',
          }}
        >
          <div style={{fontSize: 8, color: 'rgba(255,255,255,0.7)'}}>复习</div>
          <div style={{fontSize: 17, fontWeight: 700, color: '#FFFFFF', marginTop: 2}}>
            5 <span style={{fontSize: 9, fontWeight: 500}}>个错词</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{fontSize: 9, color: 'rgba(255,255,255,0.8)', marginBottom: 5}}>
          今日进度 8 / 20
        </div>
        <div style={{height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2}}>
          <div style={{width: '40%', height: 4, background: '#FFFFFF', borderRadius: 2}} />
        </div>
      </div>
      <div
        style={{
          background: C.ink,
          color: '#FFFFFF',
          borderRadius: 10,
          padding: '9px 0',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        开始刷题
      </div>
    </div>
    <div
      style={{
        border: '1px dashed rgba(63,143,128,0.55)',
        background: 'rgba(63,143,128,0.04)',
        borderRadius: 10,
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{fontSize: 10, fontWeight: 600, color: C.primary}}>
        看广告，领 3 天词溯会员
      </span>
      <span
        style={{
          fontSize: 8,
          color: C.primary,
          background: 'rgba(63,143,128,0.1)',
          borderRadius: 999,
          padding: '2px 8px',
          whiteSpace: 'nowrap',
        }}
      >
        今日剩余 3 次
      </span>
    </div>
  </div>
);

// ② 刷题页：三段式布局（固定头部 / 独立内容 / 固定底栏）
const QuizMiniUI: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#F7FAF9',
      fontFamily: FONT,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}
  >
    <div style={{padding: '12px 12px 10px'}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: '#EDF2F1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconX size={11} strokeWidth={2.4} style={{color: C.inkSoft}} />
        </div>
        <span style={{fontSize: 13, fontWeight: 600, color: C.ink}}>第 3 题</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: C.inkSoft,
            background: '#EDF2F1',
            borderRadius: 999,
            padding: '3px 8px',
          }}
        >
          00:42
        </span>
      </div>
      <div style={{height: 4, background: '#E3EAE8', borderRadius: 2, marginTop: 10}}>
        <div style={{width: '30%', height: 4, background: C.primary, borderRadius: 2}} />
      </div>
    </div>
    <div style={{flex: 1, padding: '4px 12px'}}>
      <div
        style={{
          background: '#FFFFFF',
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: C.primary,
            background: 'rgba(63,143,128,0.1)',
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          看英文，选中文
        </span>
        <span style={{fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.ink}}>
          achieve
        </span>
        <span style={{fontSize: 9, color: C.inkFaint}}>/əˈtʃiːv/</span>
        {[
          ['A', '实现'],
          ['B', '放弃'],
          ['C', '评估'],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: '7px 10px',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: C.bgLight2,
                color: C.inkSoft,
                fontSize: 8,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {k}
            </span>
            <span style={{fontSize: 10, color: C.ink}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{borderTop: `1px solid ${C.line}`, padding: 12}}>
      <div
        style={{
          background: C.primary,
          color: '#FFFFFF',
          borderRadius: 9,
          padding: '9px 0',
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        提交答案
      </div>
    </div>
  </div>
);

// ③ 我的页：薄弱雷达（4 轴）
const RadarMini: React.FC = () => {
  const cx = 75;
  const cy = 60;
  const R = 42;
  const axes = [
    {label: '释义', x: 0, y: -1},
    {label: '搭配', x: 1, y: 0},
    {label: '完形', x: 0, y: 1},
    {label: '拼写', x: -1, y: 0},
  ];
  const vals = [0.92, 0.74, 0.8, 0.35];
  const pt = (i: number, r: number) => `${cx + axes[i].x * r},${cy + axes[i].y * r}`;
  const diamond = (r: number) => [0, 1, 2, 3].map((i) => pt(i, r)).join(' ');
  const dataPoly = vals.map((v, i) => pt(i, R * v)).join(' ');
  return (
    <svg width={150} height={120} viewBox="0 0 150 120">
      <polygon points={diamond(R)} fill="none" stroke={C.line} strokeWidth={1} />
      <polygon points={diamond(R * 0.5)} fill="none" stroke={C.line} strokeWidth={1} />
      {axes.map((a) => (
        <line
          key={a.label}
          x1={cx}
          y1={cy}
          x2={cx + a.x * R}
          y2={cy + a.y * R}
          stroke={C.line}
          strokeWidth={1}
        />
      ))}
      <polygon
        points={dataPoly}
        fill="rgba(63,143,128,0.25)"
        stroke={C.primary}
        strokeWidth={1.5}
      />
      <text x={75} y={12} textAnchor="middle" fontSize={8} fill={C.inkSoft} fontFamily={FONT}>
        释义
      </text>
      <text x={122} y={63} textAnchor="start" fontSize={8} fill={C.inkSoft} fontFamily={FONT}>
        搭配
      </text>
      <text x={75} y={115} textAnchor="middle" fontSize={8} fill={C.inkSoft} fontFamily={FONT}>
        完形
      </text>
      <text x={28} y={63} textAnchor="end" fontSize={8} fill={C.inkSoft} fontFamily={FONT}>
        拼写
      </text>
    </svg>
  );
};

// ③ 我的页：记忆分层 / 薄弱雷达 / 能力标签
const MeUI: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#F7FAF9',
      fontFamily: FONT,
      display: 'flex',
      flexDirection: 'column',
      padding: 14,
      gap: 10,
      boxSizing: 'border-box',
    }}
  >
    <div style={{fontSize: 14, fontWeight: 700, color: C.ink}}>我的</div>
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{fontSize: 10, fontWeight: 700, color: C.ink}}>记忆分层</div>
      {[
        {label: '稳定记住', color: '#22ab98', pct: 72},
        {label: '正在巩固', color: '#f5c451', pct: 46},
        {label: '容易溜走', color: '#f87171', pct: 24},
      ].map((r) => (
        <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 7}}>
          <span
            style={{width: 7, height: 7, borderRadius: 999, background: r.color, flexShrink: 0}}
          />
          <span style={{fontSize: 9, color: C.inkSoft, width: 46, flexShrink: 0}}>
            {r.label}
          </span>
          <div style={{flex: 1, height: 4, background: '#EDF2F1', borderRadius: 2}}>
            <div
              style={{width: `${r.pct}%`, height: 4, background: r.color, borderRadius: 2}}
            />
          </div>
        </div>
      ))}
    </div>
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 11,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div style={{fontSize: 10, fontWeight: 700, color: C.ink, alignSelf: 'flex-start'}}>
        薄弱雷达
      </div>
      <RadarMini />
    </div>
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{fontSize: 10, fontWeight: 700, color: C.ink}}>能力标签</div>
      <div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.danger,
            background: 'rgba(194,94,94,0.1)',
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          拼写薄弱型
        </span>
      </div>
      <div style={{fontSize: 8.5, color: C.inkSoft, lineHeight: 1.5}}>
        看见英文能认，反过来拼写时容易卡住。
      </div>
    </div>
  </div>
);

// ================= 镜 16 ｜ 2:06–2:18 ｜ 功能全景：三台手机横滑 =================
export const Scene16: React.FC = () => {
  const frame = useCurrentFrame();
  const chipOp = interpolate(frame, [8, 22], [0, 1], clamp);
  const chipY = interpolate(frame, [8, 22], [24, 0], {...clamp, easing: easeOut});
  const t0s = [30, 45, 60];
  const labels = ['首页 · 打开即练', '刷题 · 三段式布局', '我的 · 记忆画像'];
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <div style={{paddingTop: 64}}>
        <Chip opacity={chipOp} translateY={chipY}>
          打开即练 · 错题自动进出 · 记忆画像
        </Chip>
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 70, alignItems: 'flex-start'}}>
          {t0s.map((t0, i) => {
            const tx = interpolate(frame, [t0, t0 + 16], [90, 0], {
              ...clamp,
              easing: easeOut,
            });
            const op = interpolate(frame, [t0, t0 + 16], [0, 1], clamp);
            const labelOp = interpolate(frame, [t0 + 20, t0 + 32], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 26,
                  opacity: op,
                  translate: `${tx}px 0px`,
                }}
              >
                <PhoneFrame width={300} height={533}>
                  {i === 0 ? <HomeUI /> : i === 1 ? <QuizMiniUI /> : <MeUI />}
                </PhoneFrame>
                <div
                  style={{
                    opacity: labelOp,
                    fontFamily: FONT,
                    fontSize: 34,
                    fontWeight: 600,
                    color: C.inkSoft,
                    letterSpacing: 1,
                  }}
                >
                  {labels[i]}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================= 镜 17 ｜ 2:18–2:28 ｜ 零门槛：四卡依次点亮 =================
export const Scene17: React.FC = () => {
  const frame = useCurrentFrame();
  const chipOp = interpolate(frame, [8, 22], [0, 1], clamp);
  const chipY = interpolate(frame, [8, 22], [24, 0], {...clamp, easing: easeOut});
  const items = [
    {Icon: IconUser, title: '游客模式', desc: '免登录直接使用'},
    {Icon: IconMail, title: '邮箱验证码', desc: '登录 / 注册'},
    {Icon: IconPlay, title: '看广告领会员', desc: '一次领 3 天 · 每日 3 次'},
    {Icon: IconAndroid, title: 'Android App', desc: 'APK 约 4.7 MB · 移动端网页'},
  ];
  const t0s = [30, 75, 120, 165];
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <div style={{paddingTop: 70}}>
        <Chip opacity={chipOp} translateY={chipY}>
          游客免登录｜邮箱验证码登录｜看广告领会员｜Android App
        </Chip>
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 40}}>
          {items.map(({Icon, title, desc}, i) => {
            const t0 = t0s[i];
            const lit = interpolate(frame, [t0, t0 + 12], [0, 1], clamp);
            return (
              <div
                key={title}
                style={{
                  width: 380,
                  height: 420,
                  background: '#FFFFFF',
                  borderRadius: 24,
                  boxShadow: SHADOW.s2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 32,
                  scale: `${0.92 + 0.08 * lit}`,
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 999,
                    background: mixColor('#E7EDEC', '#DFF0EC', lit),
                    border: `1px solid ${mixColor('#D7E2E0', '#3F8F80', lit)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={46} style={{color: mixColor(C.inkFaint, C.primary, lit)}} />
                </div>
                <div
                  style={{
                    opacity: 0.4 + 0.6 * lit,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div style={{fontFamily: FONT, fontSize: 38, fontWeight: 700, color: C.ink}}>
                    {title}
                  </div>
                  <div style={{fontFamily: FONT, fontSize: 26, color: C.inkSoft}}>{desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <TealWipe frame={frame} start={291} />
    </AbsoluteFill>
  );
};

// ================= 镜 18 ｜ 2:28–2:44 ｜ TRAE 协作：三栏改造前后 =================

// ① 统一设计语言
const ColDesign: React.FC<{frame: number}> = ({frame}) => {
  const arrowOp = interpolate(frame, [60, 72], [0, 1], clamp);
  return (
    <>
      <div style={{fontSize: 36, fontWeight: 700, color: C.ink, marginBottom: 20}}>
        统一设计语言
      </div>
      <div
        style={{
          height: 170,
          background: C.bgLight,
          borderRadius: 16,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        <span style={{position: 'absolute', top: 12, left: 16, fontSize: 20, color: C.inkFaint}}>
          改造前
        </span>
        <div style={{width: 90, height: 60, borderRadius: 2, background: '#C9D4D2', rotate: '-8deg'}} />
        <div style={{width: 70, height: 70, borderRadius: 18, background: '#C9D4D2', rotate: '6deg'}} />
        <div style={{width: 100, height: 52, borderRadius: 8, background: '#C9D4D2', rotate: '8deg'}} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '13px 0',
          opacity: arrowOp,
          color: C.primary,
        }}
      >
        <IconArrowDown size={30} />
      </div>
      <div
        style={{
          height: 250,
          background: 'rgba(63,143,128,0.06)',
          border: '1px solid rgba(63,143,128,0.3)',
          borderRadius: 16,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 22,
          padding: '0 30',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            fontSize: 20,
            fontWeight: 600,
            color: C.primary,
          }}
        >
          改造后
        </span>
        <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
          {[C.primary, C.primaryBright, C.ink, C.bgLight2].map((c) => (
            <span
              key={c}
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: c,
                border: '1px solid rgba(23,40,43,0.12)',
              }}
            />
          ))}
        </div>
        <div style={{display: 'flex', gap: 18, alignItems: 'baseline', color: C.ink, fontWeight: 700}}>
          {[26, 21, 16, 12].map((s) => (
            <span key={s} style={{fontSize: s}}>
              Aa
            </span>
          ))}
        </div>
        <div style={{display: 'flex', gap: 18, color: C.primary}}>
          <IconClock size={20} />
          <IconBook size={20} />
          <IconCheck size={20} />
        </div>
      </div>
    </>
  );
};

// ② 答题流程：三步 → 两步
const ColQuiz: React.FC = () => (
  <>
    <div style={{fontSize: 36, fontWeight: 700, color: C.ink, marginBottom: 20}}>答题流程</div>
    <div
      style={{
        height: 170,
        background: C.bgLight,
        borderRadius: 16,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <span style={{position: 'absolute', top: 12, left: 16, fontSize: 20, color: C.inkFaint}}>
        改造前
      </span>
      {[1, 2, 3].map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 && <IconArrowRight size={18} style={{color: C.inkFaint}} />}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: '#C9D4D2',
              color: '#FFFFFF',
              fontFamily: MONO,
              fontSize: 18,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {n}
          </div>
        </React.Fragment>
      ))}
    </div>
    <div style={{display: 'flex', justifyContent: 'center', padding: '13px 0', color: C.primary}}>
      <IconArrowDown size={30} />
    </div>
    <div
      style={{
        height: 250,
        background: 'rgba(63,143,128,0.06)',
        border: '1px solid rgba(63,143,128,0.3)',
        borderRadius: 16,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 12,
          left: 16,
          fontSize: 20,
          fontWeight: 600,
          color: C.primary,
        }}
      >
        改造后
      </span>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        {[1, 2].map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && <IconArrowRight size={18} style={{color: C.primary}} />}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: C.primary,
                color: '#FFFFFF',
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {n}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{fontSize: 22, color: C.inkSoft}}>按钮固定底部</div>
    </div>
  </>
);

// ③ 排障路径：从现象追到根因
const ColDebug: React.FC<{frame: number}> = ({frame}) => {
  const nodes = ['广告不填充', '接口地址判定', '部署形态', '硬编码广告参数 + 版本号'];
  const t0s = [80, 130, 180, 230];
  const rootLit = interpolate(frame, [260, 272], [0, 1], clamp);
  return (
    <>
      <div style={{fontSize: 36, fontWeight: 700, color: C.ink, marginBottom: 8}}>排障路径</div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {nodes.map((label, i) => {
          const op = interpolate(frame, [t0s[i], t0s[i] + 12], [0, 1], clamp);
          const ty = interpolate(frame, [t0s[i], t0s[i] + 12], [18, 0], {
            ...clamp,
            easing: easeOut,
          });
          const last = i === nodes.length - 1;
          const arrowOp =
            i < nodes.length - 1
              ? interpolate(frame, [t0s[i] + 14, t0s[i] + 26], [0, 1], clamp)
              : 0;
          return (
            <React.Fragment key={label}>
              <div
                style={{
                  opacity: op,
                  translate: `0px ${ty}px`,
                  width: 380,
                  height: 64,
                  borderRadius: 999,
                  background: last ? `rgba(63,143,128,${0.1 * rootLit})` : '#FFFFFF',
                  border: `${last ? 1 + rootLit : 1}px solid ${
                    last ? mixColor('#D7E2E0', '#3F8F80', rootLit) : C.line
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 600,
                  color: C.ink,
                  position: 'relative',
                  boxSizing: 'border-box',
                }}
              >
                {label}
                {last && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -16,
                      right: 26,
                      background: C.primary,
                      color: '#FFFFFF',
                      fontSize: 22,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: '3px 14px',
                      opacity: rootLit,
                    }}
                  >
                    根因
                  </span>
                )}
              </div>
              {i < nodes.length - 1 && (
                <div style={{opacity: arrowOp, color: C.primary, display: 'flex'}}>
                  <IconArrowDown size={24} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

export const Scene18: React.FC = () => {
  const frame = useCurrentFrame();
  const chipOp = interpolate(frame, [8, 22], [0, 1], clamp);
  const chipY = interpolate(frame, [8, 22], [24, 0], {...clamp, easing: easeOut});
  const t0s = [30, 39, 48];
  return (
    <AbsoluteFill>
      <Bg variant="light" />
      <div style={{paddingTop: 48}}>
        <Chip opacity={chipOp} translateY={chipY}>
          统一设计语言｜三步 → 两步｜从现象追到根因
        </Chip>
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 40}}>
          {t0s.map((t0, i) => {
            const op = interpolate(frame, [t0, t0 + 18], [0, 1], clamp);
            const ty = interpolate(frame, [t0, t0 + 18], [40, 0], {
              ...clamp,
              easing: easeOut,
            });
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  translate: `0px ${ty}px`,
                  width: 500,
                  height: 660,
                  background: '#FFFFFF',
                  borderRadius: 24,
                  boxShadow: SHADOW.s2,
                  padding: 36,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {i === 0 ? (
                  <ColDesign frame={frame} />
                ) : i === 1 ? (
                  <ColQuiz />
                ) : (
                  <ColDebug frame={frame} />
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
