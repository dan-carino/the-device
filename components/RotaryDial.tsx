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
  const [angle, setAngle] = useState(() => (defaultValue * 2 - 1) * RANGE_DEG);
  const [dragging, setDragging] = useState(false);

  const angleRef = useRef(angle);
  const velocityRef = useRef(0);
  const lastYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const lastTickAngleRef = useRef(angle);
  const TICK_INTERVAL = 5;

  useEffect(() => { angleRef.current = angle; }, [angle]);

  const stopMomentum = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const maybeTick = useCallback((newAngle: number) => {
    const prev = lastTickAngleRef.current;
    const travelled = Math.abs(newAngle - prev);
    if (travelled >= TICK_INTERVAL) {
      const pitchVariance = 800 + (newAngle / RANGE_DEG) * 200;
      playTick(pitchVariance, 0.06);
      lastTickAngleRef.current = newAngle;
    }
  }, []);

  const startMomentum = useCallback(() => {
    stopMomentum();
    const tick = () => {
      velocityRef.current *= FRICTION;
      if (Math.abs(velocityRef.current) < 0.05) { velocityRef.current = 0; return; }
      const next = clamp(angleRef.current + velocityRef.current, -RANGE_DEG, RANGE_DEG);
      maybeTick(next);
      angleRef.current = next;
      setAngle(next);
      onChange?.((next / RANGE_DEG) * 0.5 + 0.5);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopMomentum, onChange, maybeTick]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    stopMomentum();
    velocityRef.current = 0;
    lastYRef.current = e.clientY;
    setDragging(true);
    dialRef.current?.setPointerCapture(e.pointerId);
  }, [stopMomentum]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (lastYRef.current === null) return;
    const dy = lastYRef.current - e.clientY;
    const delta = dy / PX_PER_DEG;
    velocityRef.current = delta * 0.6;
    const next = clamp(angleRef.current + delta, -RANGE_DEG, RANGE_DEG);
    maybeTick(next);
    angleRef.current = next;
    setAngle(next);
    onChange?.((next / RANGE_DEG) * 0.5 + 0.5);
    lastYRef.current = e.clientY;
  }, [onChange, maybeTick]);

  const onPointerUp = useCallback(() => {
    lastYRef.current = null;
    setDragging(false);
    startMomentum();
  }, [startMomentum]);

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  const tickRotation = angle;
  const wellSize = size + 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>

      {/* Recessed mount well — the panel depression the knob sits in */}
      <div style={{
        width: wellSize,
        height: wellSize,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, #0e0e0e, #060606)",
        boxShadow: `
          inset 0 3px 8px rgba(0,0,0,0.95),
          inset 0 1px 3px rgba(0,0,0,0.9),
          inset 0 0 0 1px rgba(0,0,0,0.7),
          0 1px 0 rgba(255,255,255,0.04)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>

        {/* The knob — knurled outer ring */}
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
            // Knurling: alternating dark/mid segments radiating from center
            background: `repeating-conic-gradient(
              #0f0f0f 0deg 5deg,
              #1d1d1d 5deg 10deg
            )`,
            boxShadow: dragging
              ? `0 0 0 1px rgba(0,0,0,0.9), 0 0 18px rgba(255,153,0,0.2), 0 3px 12px rgba(0,0,0,0.8)`
              : `0 0 0 1px rgba(0,0,0,0.9), 0 3px 10px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)`,
            cursor: dragging ? "grabbing" : "grab",
            position: "relative",
            userSelect: "none",
            touchAction: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: dragging ? "none" : "box-shadow 0.2s",
          }}
        >
          {/* Inner smooth face — sits above the knurling */}
          <div style={{
            position: "absolute",
            width: "70%",
            height: "70%",
            borderRadius: "50%",
            background: `
              radial-gradient(ellipse 55% 38% at 36% 26%, rgba(255,255,255,0.09) 0%, transparent 100%),
              radial-gradient(ellipse 70% 70% at 68% 74%, rgba(0,0,0,0.55) 0%, transparent 65%),
              radial-gradient(circle at 44% 40%, #2d2d2d 0%, #1c1c1c 40%, #101010 100%)
            `,
            boxShadow: `
              0 2px 8px rgba(0,0,0,0.85),
              inset 0 1px 2px rgba(255,255,255,0.05),
              0 0 0 1px rgba(0,0,0,0.5)
            `,
          }} />

          {/* Tick mark — rotates with the knob */}
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            transform: `rotate(${tickRotation}deg)`,
          }}>
            {/* Tick sits between knurling edge and inner face */}
            <div style={{
              position: "absolute",
              top: "6%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 2,
              height: "19%",
              background: dragging
                ? "rgba(255,153,0,0.95)"
                : "rgba(230,230,230,0.8)",
              borderRadius: 1,
              boxShadow: dragging ? "0 0 5px rgba(255,153,0,0.9)" : "0 0 2px rgba(0,0,0,0.5)",
            }} />
          </div>

          {/* Amber glow ring — only when dragging */}
          {dragging && (
            <div style={{
              position: "absolute",
              inset: -1,
              borderRadius: "50%",
              border: "1px solid rgba(255,153,0,0.35)",
              boxShadow: "0 0 10px rgba(255,153,0,0.25)",
              pointerEvents: "none",
            }} />
          )}
        </div>
      </div>

      <span className="lcars-label" style={{
        fontSize: 7,
        color: "var(--lcars-amber-dark)",
        textAlign: "center",
        letterSpacing: "0.08em",
      }}>
        {label}
      </span>
    </div>
  );
}
