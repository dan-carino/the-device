"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { playTick } from "@/hooks/useAudioContext";

interface RotaryDialProps {
  label: string;
  size: number;
  defaultValue?: number; // 0–1
  onChange?: (value: number) => void;
}

// Knob travels ±150° from center (300° total arc)
const RANGE_DEG = 150;
// px of vertical drag = 1° of rotation
const PX_PER_DEG = 1.2;
const FRICTION = 0.87;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function RotaryDial({
  label,
  size,
  defaultValue = 0.5,
  onChange,
}: RotaryDialProps) {
  // angle in degrees: -RANGE_DEG → +RANGE_DEG (0 = center-top)
  const [angle, setAngle] = useState(() => (defaultValue * 2 - 1) * RANGE_DEG);
  const [dragging, setDragging] = useState(false);

  const angleRef = useRef(angle);
  const velocityRef = useRef(0);
  const lastYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  // Track last angle at which a tick was played (in degrees)
  const lastTickAngleRef = useRef(angle);
  const TICK_INTERVAL = 5; // degrees between ticks

  // Keep angleRef in sync
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  const stopMomentum = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Fire a tick sound every TICK_INTERVAL degrees of travel
  const maybeTick = useCallback((newAngle: number) => {
    const prev = lastTickAngleRef.current;
    const travelled = Math.abs(newAngle - prev);
    if (travelled >= TICK_INTERVAL) {
      // pitch slightly varies with position for organic feel
      const pitchVariance = 800 + (newAngle / RANGE_DEG) * 200;
      playTick(pitchVariance, 0.06);
      lastTickAngleRef.current = newAngle;
    }
  }, []);

  const startMomentum = useCallback(() => {
    stopMomentum();
    const tick = () => {
      velocityRef.current *= FRICTION;
      if (Math.abs(velocityRef.current) < 0.05) {
        velocityRef.current = 0;
        return;
      }
      const next = clamp(
        angleRef.current + velocityRef.current,
        -RANGE_DEG,
        RANGE_DEG
      );
      maybeTick(next);
      angleRef.current = next;
      setAngle(next);
      onChange?.(((next / RANGE_DEG) * 0.5 + 0.5));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopMomentum, onChange, maybeTick]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      stopMomentum();
      velocityRef.current = 0;
      lastYRef.current = e.clientY;
      setDragging(true);
      dialRef.current?.setPointerCapture(e.pointerId);
    },
    [stopMomentum]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (lastYRef.current === null) return;
      const dy = lastYRef.current - e.clientY; // drag up = positive
      const delta = dy / PX_PER_DEG;
      velocityRef.current = delta * 0.6; // smooth velocity estimate
      const next = clamp(
        angleRef.current + delta,
        -RANGE_DEG,
        RANGE_DEG
      );
      maybeTick(next);
      angleRef.current = next;
      setAngle(next);
      onChange?.((next / RANGE_DEG) * 0.5 + 0.5);
      lastYRef.current = e.clientY;
    },
    [onChange, maybeTick]
  );

  const onPointerUp = useCallback(() => {
    lastYRef.current = null;
    setDragging(false);
    startMomentum();
  }, [startMomentum]);

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  // Tick mark rotates with the knob. 0° → tick at top (12 o'clock).
  const tickRotation = angle; // degrees

  // Glow intensity scales with distance from center
  const glowIntensity = Math.abs(angle) / RANGE_DEG;
  const glowAlpha = 0.15 + glowIntensity * 0.3;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        ref={dialRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #2a2a2a, #0d0d0d)",
          border: `2px solid rgba(255,153,0,${dragging ? 0.9 : 0.5})`,
          boxShadow: `
            0 0 0 3px rgba(0,0,0,0.5),
            0 0 ${dragging ? 20 : 12}px rgba(255,153,0,${glowAlpha}),
            inset 0 1px 0 rgba(255,255,255,0.05)
          `,
          cursor: dragging ? "grabbing" : "grab",
          position: "relative",
          userSelect: "none",
          touchAction: "none",
          transition: dragging
            ? "none"
            : "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Tick mark — rotates with knob */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${tickRotation}deg)`,
            transition: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 2,
              height: "22%",
              background: dragging
                ? "rgba(255,153,0,0.9)"
                : "rgba(255,255,255,0.75)",
              borderRadius: 1,
              boxShadow: dragging
                ? "0 0 4px rgba(255,153,0,0.8)"
                : "none",
            }}
          />
        </div>

        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "rgba(255,153,0,0.3)",
            }}
          />
        </div>
      </div>

      <span
        className="lcars-label"
        style={{
          fontSize: 7,
          color: "var(--lcars-amber-dark)",
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}
