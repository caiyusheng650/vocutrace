import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FONT} from '../design/tokens';
import {Bg, Highlight, Wordmark, clamp, easeOut} from '../components/primitives';

// ================= 镜 19 ｜ 2:44–2:56 ｜ 核心判断句逐行浮现 =================
export const Scene19: React.FC = () => {
  const frame = useCurrentFrame();
  const lines: {text: string; hl: string[]}[] = [
    {text: '推荐做得好不好', hl: []},
    {text: '不在于技术多复杂', hl: []},
    {text: '而在于有没有看清，', hl: ['看清']},
    {text: '每个学生哪里会、哪里不会', hl: ['哪里会、哪里不会']},
  ];
  return (
    <AbsoluteFill>
      <Bg variant="dark" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {lines.map((line, i) => {
            const t = 40 + 45 * i;
            const op = interpolate(frame, [t, t + 15], [0, 1], clamp);
            const ty = interpolate(frame, [t, t + 15], [26, 0], {
              ...clamp,
              easing: easeOut,
            });
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  translate: `0px ${ty}px`,
                  fontFamily: FONT,
                  fontSize: 64,
                  fontWeight: 600,
                  color: '#EAF2F0',
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}
              >
                <Highlight text={line.text} hl={line.hl} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ================= 镜 20 ｜ 2:56–3:00 ｜ LOGO 落定 + 赛事信息 =================
export const Scene20: React.FC = () => {
  const frame = useCurrentFrame();
  const logoOp = interpolate(frame, [0, 18], [0, 1], clamp);
  const logoScale = interpolate(frame, [0, 18], [0.94, 1], {...clamp, easing: easeOut});
  const line1 = interpolate(frame, [26, 38], [0, 1], clamp);
  const line2 = interpolate(frame, [44, 56], [0, 1], clamp);
  const fadeOut = interpolate(frame, [102, 120], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Bg variant="dark" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 46}}
        >
          <div style={{opacity: logoOp, scale: `${logoScale}`}}>
            <Wordmark scale={1.25} light />
          </div>
          <div
            style={{
              opacity: line1,
              fontFamily: FONT,
              fontSize: 36,
              fontWeight: 500,
              color: '#9FB4B0',
            }}
          >
            Android App + 移动端网页
          </div>
          <div
            style={{
              opacity: line2,
              fontFamily: FONT,
              fontSize: 30,
              color: '#7C918D',
              letterSpacing: 4,
            }}
          >
            TRAE 好应用大赏赛 · 学习生活赛道
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
