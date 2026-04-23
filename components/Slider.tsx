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
      if (e.buttons === 0) { lastYRef.current = null; return; }
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

  const onLostPointerCapture = useCallback(() => {
    lastYRef.current = null;
    setDragging(false);
    velocityRef.current = 0;
  }, []);

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
        onLostPointerCapture={onLostPointerCapture}
        style={{
          width: 20,
          height: TRACK_HEIGHT,
          background: "linear-gradient(180deg, #040404 0%, #0a0a0a 100%)",
          borderRadius: 6,
          // Side and bottom edges are dark (slot walls in shadow)
          // Top edge is bright — the rim of the routed opening catches the key light
          border: "1px solid rgba(0,0,0,0.85)",
          borderTop: "1px solid rgba(0,0,0,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.25)",
          boxShadow: `
            inset 0 6px 14px rgba(0,0,0,0.95),
            inset 0 2px 4px rgba(0,0,0,0.9),
            inset 1px 0 6px rgba(0,0,0,0.5),
            inset -1px 0 4px rgba(0,0,0,0.4)
            ${dragging ? ", 0 0 10px rgba(255,153,0,0.12)" : ""}
          `,
          position: "relative",
          cursor: "ns-resize",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* Slot bottom-rim highlight — lower lip faces upward, catches key light */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 1, right: 1,
          height: 1,
          background: "rgba(255,255,255,0.2)",
          borderRadius: "0 0 6px 6px",
          pointerEvents: "none",
        }} />

        {/* Left wall highlight — key light grazes the left inner face of the slot */}
        <div style={{
          position: "absolute",
          top: 2, left: 0, bottom: 2,
          width: 1,
          background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)",
          pointerEvents: "none",
        }} />

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

        {/* Thumb — machined slider cap */}
        <div style={{
          position: "absolute",
          bottom: thumbBottom,
          left: -5,
          right: -5,
          height: THUMB_HEIGHT,
          // Top-light gradient
          background: dragging
            ? "linear-gradient(180deg, #484848 0%, #2e2e2e 45%, #1e1e1e 100%)"
            : "linear-gradient(180deg, #3e3e3e 0%, #282828 45%, #181818 100%)",
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.7)",
          borderTop: `1px solid rgba(255,255,255,${dragging ? 0.12 : 0.07})`,
          boxShadow: dragging
            ? "0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(255,153,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 2px 6px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "none",
          // Grip lines on thumb
          backgroundImage: dragging
            ? `linear-gradient(180deg, #484848 0%, #2e2e2e 45%, #1e1e1e 100%),
               repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`
            : `linear-gradient(180deg, #3e3e3e 0%, #282828 45%, #181818 100%),
               repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)`,
        }} />
      </div>

      {/* AO shadow — contact shadow where track base meets the panel */}
      <div style={{
        width: 28,
        height: 8,
        borderRadius: "50%",
        background: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0,0,0,0.5) 0%, transparent 100%)",
        filter: "blur(2px)",
        marginTop: -4,
        pointerEvents: "none",
      }} />

      <span
        className="lcars-label"
        style={{ fontSize: 7, color: "var(--lcars-amber-dark)" }}
      >
        {label}
      </span>
    </div>
  );
}
