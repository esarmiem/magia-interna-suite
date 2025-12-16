import React from 'react';
import Snowfall from 'react-snowfall';
import { useChristmas } from '@/contexts/ChristmasContext';

export const SnowfallEffect = () => {
  const { isChristmasMode } = useChristmas();

  if (!isChristmasMode) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      <Snowfall
        snowflakeCount={150}
        speed={[0.5, 2.0]}
        wind={[-0.5, 1.0]}
        radius={[0.5, 3.0]}
        color="#dee4fd"
      />
    </div>
  );
};
