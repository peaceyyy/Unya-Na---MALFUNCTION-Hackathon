import React, { useEffect } from 'react';
import SakugaButton from '../../app/components/SakugaButton';
import { loadSakuga } from '../../app/components/sakugaLoader';
import { useOpacity } from '../../app/context/OpacityContext';

// Navbar button. Pressing it opens the dance screen and asks for the camera. The
// opacity is left where it is; every dance detected raises it.
// The Sakuga button is much taller than the navbar, so it is scaled down the same
// way the navbar's Sakuga toggle is.
const SCALE = 0.6;

export default function JustDanceButton() {
  const { startDance } = useOpacity();

  useEffect(() => {
    loadSakuga('button');
  }, []);

  return (
    <div
      className="relative flex h-9 w-[98px] shrink-0 items-center justify-end"
      title="Opens your camera. Dance to bring the interface opacity up."
    >
      <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'right center', flex: 'none' }}>
        <SakugaButton onClick={startDance}>Just dance</SakugaButton>
      </div>
    </div>
  );
}
