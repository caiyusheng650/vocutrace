import React from 'react';
import {Composition} from 'remotion';
import {VocutracePromo, TOTAL_FRAMES} from './VocutracePromo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VocutracePromo"
      component={VocutracePromo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
