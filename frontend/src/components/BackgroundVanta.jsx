import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import TOPOLOGY from 'vanta/dist/vanta.topology.min';

export default function BackgroundVanta({ isDark }) {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      try {
        vantaEffect.current = TOPOLOGY({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: isDark ? 0x7b0000 : 0xd8dde6,
          backgroundColor: isDark ? 0x060102 : 0xf6f6f8
        });
      } catch (err) {
        console.warn('Vanta initialization skipped:', err);
      }
    }
    return () => {
      if (vantaEffect.current) {
        try {
          vantaEffect.current.destroy();
        } catch (e) {
          // cleanup
        }
        vantaEffect.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (vantaEffect.current) {
      try {
        vantaEffect.current.setOptions({
          color: isDark ? 0x7b0000 : 0xd8dde6,
          backgroundColor: isDark ? 0x060102 : 0xf6f6f8
        });
      } catch (e) {
        // dynamic option update
      }
    }
  }, [isDark]);

  return <div ref={vantaRef} className="vanta-background" aria-hidden="true" />;
}
