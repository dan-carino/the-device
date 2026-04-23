"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { playTick } from "@/hooks/useAudioContext";

interface RotaryDialProps {
  label: string;
  size: number;
  defaultValue?: number; // 0–1
  onChange?: (value: number) => void;
}

const RANGE_DEG = 150;
const PX_PER_DEG = 1.2;
const FRICTION = 0.87;
// Inner hole of ring = 63.7% of outer diameter
const CAP_RATIO = 0.637;

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

  const angleRef   = useRef(angle);
  const velocityRef = useRef(0);
  const lastYRef   = useRef<number | null>(null);
  const rafRef     = useRef<number | null>(null);
  const hitRef     = useRef<HTMLDivElement>(null);
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
    if (Math.abs(newAngle - lastTickAngleRef.current) >= TICK_INTERVAL) {
      playTick(800 + (newAngle / RANGE_DEG) * 200, 0.06);
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
    hitRef.current?.setPointerCapture(e.pointerId);
  }, [stopMomentum]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (lastYRef.current === null) return;
    const delta = (lastYRef.current - e.clientY) / PX_PER_DEG;
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

  // Sizing
  const wellSize  = size + 10;
  const capSize   = Math.round(wellSize * CAP_RATIO);
  const capOffset = Math.round((wellSize - capSize) / 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>

      {/* Mount well — black so image backgrounds disappear seamlessly */}
      <div style={{
        position: "relative",
        width: wellSize,
        height: wellSize,
        borderRadius: "50%",
        background: "#000",
        boxShadow: `
          inset 0 3px 8px rgba(0,0,0,0.95),
          inset 0 0 0 1px rgba(0,0,0,0.8),
          0 1px 0 rgba(255,255,255,0.04)
        `,
      }}>

        {/* ── Layer 1: Outer ring — STATIC, never rotates ── */}
        <img
          src="/knob-ring.png"
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* ── Layer 2: Inner cap — ROTATES with interaction ── */}
        <div style={{
          position: "absolute",
          top: capOffset,
          left: capOffset,
          width: capSize,
          height: capSize,
          borderRadius: "50%",
          overflow: "hidden",
          transform: `rotate(${angle}deg)`,
          // No transition — physics loop handles smoothness
          pointerEvents: "none",
        }}>
          <img
            src="/knob-cap.png"
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              userSelect: "none",
            }}
          />
        </div>

        {/* ── Layer 3: Fixed key-light highlight — STATIC ── */}
        {/* Provides the directional lighting that doesn't rotate with the cap */}
        <div style={{
          position: "absolute",
          top: capOffset,
          left: capOffset,
          width: capSize,
          height: capSize,
          borderRadius: "50%",
          background: `
            radial-gradient(ellipse 58% 42% at 36% 26%,
              rgba(255,255,255,0.07) 0%,
              transparent 100%
            )
          `,
          pointerEvents: "none",
        }} />

        {/* ── Layer 4: Amber glow ring — appears when dragging ── */}
        {dragging && (
          <div style={{
            position: "absolute",
            inset: -1,
            borderRadius: "50%",
            border: "1px solid rgba(255,153,0,0.45)",
            boxShadow: "0 0 14px rgba(255,153,0,0.25), inset 0 0 8px rgba(255,153,0,0.08)",
            pointerEvents: "none",
          }} />
        )}

        {/* ── Layer 5: Invisible hit target — captures all pointer events ── */}
        <div
          ref={hitRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none",
          }}
        />
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
