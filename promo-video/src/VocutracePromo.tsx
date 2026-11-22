// 词溯 Vocutrace · 产品宣传片主合成（1920×1080 @ 30fps）
//
// 时间轴以「旁白」为基准：每个镜头的时长 = 该镜解说词音频长度 + 0.4s 缓冲，
// 场景内部动画通过 playbackRate 等比缩放，原有入场/转场节奏不变形。
// 旁白：edge-tts · 云希 · 30fps 词级时间戳；字幕由同一份时间戳生成。
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Scene01, Scene02, Scene03, Scene04} from './scenes/segmentA';
import {Scene05, Scene06, Scene07} from './scenes/segmentC';
import {Scene08, Scene09, Scene10, Scene11, Scene12} from './scenes/segmentD';
import {Scene13, Scene14, Scene15} from './scenes/segmentE';
import {Scene16, Scene17, Scene18} from './scenes/segmentF';
import {Scene19, Scene20} from './scenes/segmentH';
import {SubtitleTrack} from './components/SubtitleTrack';
import {clamp} from './components/primitives';
import {C} from './design/tokens';

export const TOTAL_FRAMES = 5559;

// native = 场景组件内部动画设计的原始帧数；dur = 按配音重新计算后的实际帧数
const SCENES: {comp: React.FC; from: number; dur: number; native: number; name: string}[] = [
  {comp: Scene01, from: 0, dur: 265, native: 150, name: 'Scene01'},
  {comp: Scene02, from: 265, dur: 150, native: 150, name: 'Scene02'},
  {comp: Scene03, from: 415, dur: 324, native: 240, name: 'Scene03'},
  {comp: Scene04, from: 739, dur: 240, native: 240, name: 'Scene04'},
  {comp: Scene05, from: 979, dur: 195, native: 240, name: 'Scene05'},
  {comp: Scene06, from: 1174, dur: 308, native: 300, name: 'Scene06'},
  {comp: Scene07, from: 1482, dur: 391, native: 360, name: 'Scene07'},
  {comp: Scene08, from: 1873, dur: 150, native: 300, name: 'Scene08'},
  {comp: Scene09, from: 2023, dur: 299, native: 240, name: 'Scene09'},
  {comp: Scene10, from: 2322, dur: 275, native: 180, name: 'Scene10'},
  {comp: Scene11, from: 2597, dur: 226, native: 180, name: 'Scene11'},
  {comp: Scene12, from: 2823, dur: 213, native: 240, name: 'Scene12'},
  {comp: Scene13, from: 3036, dur: 380, native: 360, name: 'Scene13'},
  {comp: Scene14, from: 3416, dur: 319, native: 240, name: 'Scene14'},
  {comp: Scene15, from: 3735, dur: 349, native: 360, name: 'Scene15'},
  {comp: Scene16, from: 4084, dur: 352, native: 360, name: 'Scene16'},
  {comp: Scene17, from: 4436, dur: 351, native: 300, name: 'Scene17'},
  {comp: Scene18, from: 4787, dur: 354, native: 480, name: 'Scene18'},
  {comp: Scene19, from: 5141, dur: 286, native: 360, name: 'Scene19'},
  {comp: Scene20, from: 5427, dur: 132, native: 120, name: 'Scene20'},
];

// 逐镜旁白（镜 02、镜 04 无旁白）
const VO: {src: string; from: number; name: string}[] = [
  {src: 'vo2/s01.mp3', from: 0, name: 'VO-01'},
  {src: 'vo2/s03.mp3', from: 415, name: 'VO-03'},
  {src: 'vo2/s05.mp3', from: 979, name: 'VO-05'},
  {src: 'vo2/s06.mp3', from: 1174, name: 'VO-06'},
  {src: 'vo2/s07.mp3', from: 1482, name: 'VO-07'},
  {src: 'vo2/s08.mp3', from: 1873, name: 'VO-08'},
  {src: 'vo2/s09.mp3', from: 2023, name: 'VO-09'},
  {src: 'vo2/s10.mp3', from: 2322, name: 'VO-10'},
  {src: 'vo2/s11.mp3', from: 2597, name: 'VO-11'},
  {src: 'vo2/s12.mp3', from: 2823, name: 'VO-12'},
  {src: 'vo2/s13.mp3', from: 3036, name: 'VO-13'},
  {src: 'vo2/s14.mp3', from: 3416, name: 'VO-14'},
  {src: 'vo2/s15.mp3', from: 3735, name: 'VO-15'},
  {src: 'vo2/s16.mp3', from: 4084, name: 'VO-16'},
  {src: 'vo2/s17.mp3', from: 4436, name: 'VO-17'},
  {src: 'vo2/s18.mp3', from: 4787, name: 'VO-18'},
  {src: 'vo2/s19.mp3', from: 5141, name: 'VO-19'},
  {src: 'vo2/s20.mp3', from: 5427, name: 'VO-20'},
];

// 旁白占用区间：有旁白时 BGM 自动闪避
const VO_SPANS: [number, number][] = [
  [0, 252],
  [415, 727],
  [979, 1162],
  [1174, 1468],
  [1482, 1860],
  [1873, 1987],
  [2023, 2311],
  [2322, 2583],
  [2597, 2810],
  [2823, 3024],
  [3036, 3402],
  [3416, 3722],
  [3735, 4071],
  [4084, 4423],
  [4436, 4775],
  [4787, 5129],
  [5141, 5414],
  [5427, 5547],
];

const bgmVolume = (f: number) => {
  const base = 0.2;
  const ducked = 0.085;
  let factor = 1;
  for (const [s, e] of VO_SPANS) {
    factor = Math.min(
      factor,
      interpolate(f, [s - 15, s, e, e + 18], [1, ducked / base, ducked / base, 1], clamp)
    );
  }
  const fadeIn = interpolate(f, [0, 40], [0, 1], clamp);
  const fadeOut = interpolate(f, [TOTAL_FRAMES - 95, TOTAL_FRAMES - 14], [1, 0], clamp);
  return base * factor * fadeIn * fadeOut;
};

export const VocutracePromo: React.FC = () => {
  const frame = useCurrentFrame();
  const headBlack = interpolate(frame, [0, 9], [1, 0], clamp);
  const tailBlack = interpolate(frame, [TOTAL_FRAMES - 9, TOTAL_FRAMES], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.bgDark}}>
      {SCENES.map(({comp: Comp, from, dur, native, name}) => (
        <Sequence key={name} from={from} durationInFrames={dur} name={name}>
          <Sequence playbackRate={native / dur} name={`${name}-speed`}>
            <Comp />
          </Sequence>
        </Sequence>
      ))}
      {VO.map(({src, from, name}) => (
        <Sequence key={name} from={from} name={name}>
          <Audio src={staticFile(src)} />
        </Sequence>
      ))}
      <Audio src={staticFile('bgm.mp3')} volume={bgmVolume} />
      <SubtitleTrack frame={frame} />
      <AbsoluteFill
        style={{background: '#000000', opacity: headBlack, pointerEvents: 'none'}}
      />
      <AbsoluteFill
        style={{background: '#000000', opacity: tailBlack, pointerEvents: 'none'}}
      />
    </AbsoluteFill>
  );
};
