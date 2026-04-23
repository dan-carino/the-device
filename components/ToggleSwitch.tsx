"use client";

import { useState } from "react";

interface ToggleSwitchProps {
  label: string;
  positions: number; // 2 or 3
  defaultPosition?: number; // 0-indexed
  onChange?: (position: number) => void;
  positionLabels?: string[]; // optional labels per position
}

export default function ToggleSwitch({
  label,
  positions,
  defaultPosition = 0,
  onChange,
  positionLabels,
}: ToggleSwitchProps) {
  const [active, setActive] = useState(defaultPosition);

  const handleClick = (i: number) => {
    setActive(i);
    onChange?.(i);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="lcars-label" style={{ fontSize: 7, color: "var(--lcars-amber-dark)" }}>
        {label}
      </span>
      <div
        style={{
          height: 24,
          background: "#0d0d0d",
          borderRadius: 6,
          border: "1px solid rgba(255,153,0,0.3)",
          display: "flex",
          alignItems: "center",
          padding: "0 3px",
          gap: 3,
        }}
      >
        {Array.from({ length: positions }).map((_, i) => {
          const isActive = i === active;
          return (
            <div
              key={i}
              onClick={() => handleClick(i)}
              title={positionLabels?.[i]}
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                background: isActive ? "var(--lcars-amber)" : "rgba(255,153,0,0.08)",
                boxShadow: isActive
                  ? "0 0 8px rgba(255,153,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)"
                  : "none",
                cursor: "pointer",
                transition: "background 0.12s, box-shadow 0.12s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {positionLabels?.[i] && (
                <span
                  className="lcars-label"
                  style={{
                    fontSize: 5,
                    color: isActive ? "rgba(0,0,0,0.6)" : "rgba(255,153,0,0.3)",
                    pointerEvents: "none",
                  }}
                >
                  {positionLabels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
