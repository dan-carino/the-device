"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface SliderProps {
  label: string;
  defaultValue?: number; // 0–1
  onChange?: (value: number) => void;
}

const TRACK_HEIGHT = 80;
const THUMB_HEIGHT = 16;
const TRAVEL = TRACK_HEIGHT - THUMB_HEIGHT; // px the thumb can move
const FRICTION = 0.85;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function Slider({
  label,
  defaultValue = 0.5,
  onChange,
}: SliderProps) {
  // 0 = bottom, 1 = top
  const [value, setValue] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);

  const valueRef = useRef(value);
  const velocityRef = useRef(0);
  const lastYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const stopMomentum = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startMomentum = useCallback(() => {
    stopMomentum();
    const tick = () => {
      velocityRef.current *= FRICTION;
      if (Math.abs(velocityRef.current) < 0.001) {
        velocityRef.current = 0;
        return;
      }
      const next = clamp(valueRef.current + velocityRef.current, 0, 1);
      valueRef.current = next;
      setValue(next);
      onChange?.(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopMomentum, onChange]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      stopMomentum();
      velocityRef.current = 0;
      lastYRef.current = e.clientY;
      setDragging(true);
      trackRef.current?.setPointerCapture(e.pointerId);
    },
    [stopMomentum]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (lastYRef.current === null) return;
      const dy = lastYRef.current - e.clientY; // up = positive
      const delta = dy / TRAVEL;
      velocityRef.current = delta * 0.5;
      const next = clamp(valueRef.current + delta, 0, 1);
      valueRef.current = next;
      setValue(next);
      onChange?.(next);
      lastYRef.current = e.clientY;
    },
    [onChange]
  );

  const onPointerUp = useCallback(() => {
    lastYRef.current = null;
    setDragging(false);
    startMomentum();
  }, [startMomentum]);

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  // Thumb position: value=0 → bottom, value=1 → top
  // bottom% = (1 - value) * TRAVEL, expressed as percentage of track height
  const thumbBottom = `${((1 - value) * TRAVEL) / TRACK_HEIGHT * 100}%`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: 20,
          height: TRACK_HEIGHT,
          background: "#0d0d0d",
          borderRadius: 6,
          border: `1px solid rgba(255,153,0,${dragging ? 0.6 : 0.3})`,
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.6)${dragging ? ", 0 0 8px rgba(255,153,0,0.15)" : ""}`,
          position: "relative",
          cursor: dragging ? "ns-resize" : "ns-resize",
          userSelect: "none",
          touchAction: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {/* Fill bar — shows current level */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 2,
            right: 2,
            height: `${value * 100}%`,
            background: "rgba(255,153,0,0.08)",
            borderRadius: "0 0 4px 4px",
            transition: "none",
          }}
        />

        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            bottom: thumbBottom,
            left: -4,
            right: -4,
            height: THUMB_HEIGHT,
            background: dragging
              ? "linear-gradient(180deg, #444, #2a2a2a)"
              : "linear-gradient(180deg, #3a3a3a, #222)",
            border: `1px solid rgba(255,153,0,${dragging ? 0.9 : 0.6})`,
            borderRadius: 4,
            boxShadow: dragging
              ? "0 0 10px rgba(255,153,0,0.35)"
              : "0 0 8px rgba(255,153,0,0.2)",
            transition: "none",
          }}
        />
      </div>

      <span
        className="lcars-label"
        style={{ fontSize: 7, color: "var(--lcars-amber-dark)" }}
      >
        {label}
      </span>
    </div>
  );
}
