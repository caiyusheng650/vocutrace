import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../design/tokens';
import {Highlight} from './primitives';
import {SUBTITLES} from '../subtitles';

// 字幕轨：底边距 86px，深色底衬 55% 不透明度，46px 白字，关键词青绿高亮
export const SubtitleTrack: React.FC<{frame: number}> = ({frame}) => {
  const cur = SUBTITLES.find((s) => frame >= s.from && frame < s.to);
  if (!cur) return null;
  const fadeIn = Math.min(1, (frame - cur.from) / 4);
  const fadeOut = Math.min(1, (cur.to - frame) / 4);
  const opacity = Math.max(0, Math.min(fadeIn, fadeOut));
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 86,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity,
          background: 'rgba(9, 18, 21, 0.72)',
          borderRadius: 14,
          padding: '14px 46px',
          maxWidth: 1600,
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontSize: 46,
            color: '#FFFFFF',
            fontWeight: 500,
            letterSpacing: 2,
            lineHeight: 1.3,
          }}
        >
          <Highlight text={cur.text} hl={cur.hl} />
        </span>
      </div>
    </AbsoluteFill>
  );
};
