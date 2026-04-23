"use client";

import { useState, useCallback, useMemo } from "react";
import RotaryDial from "@/components/RotaryDial";
import Slider from "@/components/Slider";
import ToggleSwitch from "@/components/ToggleSwitch";
import Oscilloscope from "@/components/Oscilloscope";
import { resolveEntity } from "@/data/entities";

export default function Home() {
  // Primary control state (0–1)
  const [freqMod, setFreqMod] = useState(0.5);
  const [resCoeff, setResCoeff] = useState(0.5);
  const [phaseShift, setPhaseShift] = useState(0.5);
  const [gain, setGain] = useState(0.5);
  const [bandFilter, setBandFilter] = useState(0.5);

  // Switch state
  const [polarity, setPolarity] = useState(0); // 0=normal, 1=inverted
  const [scanMode, setScanMode] = useState(0);  // 0=passive, 1=active, 2=deep

  // Scan state
  const [scanning, setScanning] = useState(false);

  const scanModeLabel = ["PASSIVE", "ACTIVE", "DEEP"][scanMode];

  const handleInitScan = useCallback(() => {
    setScanning(s => !s);
  }, []);

  // Entity proximity — recalculates on every control change
  const resolution = useMemo(
    () => resolveEntity({ freqMod, resCoeff, phaseShift, gain }),
    [freqMod, resCoeff, phaseShift, gain]
  );

  const { nearestEntity, nearestProximity } = resolution;
  const entityFound = scanning && nearestProximity >= 0.7;

  // Sensitivity derived from proximity when scanning
  const sensitivityDisplay = scanning
    ? Math.round(nearestProximity * 100)
    : Math.round((freqMod * 0.6 + gain * 0.4) * 100);

  return (
    <main style={{
      width: "100vw",
      height: "100vh",
      background: "#0d0d0d",
      backgroundImage: `
        radial-gradient(ellipse at 50% 30%, #1a1410 0%, #0d0d0d 70%)
      `,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>

      {/* ── The Device ─────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        width: 780,
        height: 520,
        borderRadius: 20,
        background: "linear-gradient(160deg, #262626 0%, #1a1a1a 40%, #141414 100%)",
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.06),
          0 2px 0 0 rgba(255,255,255,0.08),
          0 8px 32px rgba(0,0,0,0.6),
          0 24px 80px rgba(0,0,0,0.5),
          0 60px 120px rgba(0,0,0,0.4)
        `,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Top edge highlight — catches light */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 20,
          right: 20,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          zIndex: 10,
        }} />

        {/* ── LCARS amber top strip ───────────────────────────────── */}
        <div style={{
          display: "flex",
          height: 40,
          gap: 3,
          padding: "0 20px",
          alignItems: "center",
          flexShrink: 0,
        }}>
          {/* Left rounded cap */}
          <div style={{
            width: 120,
            height: 28,
            background: "var(--lcars-amber)",
            borderRadius: 14,
          }} />
          <div style={{ width: 3, height: 28, background: "var(--lcars-amber-dark)", borderRadius: 2 }} />
          {/* Long strip */}
          <div style={{
            flex: 1,
            height: 28,
            background: "var(--lcars-amber-dark)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
          }}>
            <span className="lcars-label" style={{ color: "rgba(0,0,0,0.6)" }}>
              BIO-SCANNER UNIT CLASS IV — STARDATE 47634.44
            </span>
          </div>
          <div style={{ width: 3, height: 28, background: "var(--lcars-blue)", borderRadius: 2 }} />
          <div style={{
            width: 60,
            height: 28,
            background: "var(--lcars-blue)",
            borderRadius: 14,
          }} />
        </div>

        {/* ── Main panel ─────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          gap: 0,
          padding: "0 20px 20px",
          minHeight: 0,
        }}>

          {/* ── Left strip — status indicators ─────────────────────── */}
          <div style={{
            width: 56,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            paddingRight: 12,
            flexShrink: 0,
          }}>
            <div style={{
              flex: 1,
              background: "var(--lcars-amber)",
              borderRadius: "0 0 0 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: "10px 8px",
            }}>
              {["BIO", "FREQ", "LIFE", "SIG"].map(l => (
                <span key={l} className="lcars-label" style={{ color: "rgba(0,0,0,0.55)", fontSize: 7 }}>{l}</span>
              ))}
            </div>
            <div style={{ height: 40, background: "var(--lcars-amber-dark)", borderRadius: "0 0 12px 0" }}>
              {/* Alert light */}
              <div style={{
                width: 10, height: 10,
                borderRadius: "50%",
                background: entityFound
                  ? "var(--lcars-phosphor)"
                  : scanning
                    ? "var(--lcars-phosphor)"
                    : "var(--lcars-red)",
                boxShadow: entityFound
                  ? "0 0 14px var(--lcars-phosphor), 0 0 4px var(--lcars-phosphor)"
                  : scanning
                    ? "0 0 10px var(--lcars-phosphor)"
                    : "0 0 8px var(--lcars-red)",
                margin: "15px auto 0",
                animation: entityFound
                  ? "none"
                  : scanning
                    ? "scanPulse 1s ease-in-out infinite"
                    : "alertPulse 2s ease-in-out infinite",
                transition: "background 0.3s, box-shadow 0.3s",
              }} />
            </div>
          </div>

          {/* ── Oscilloscope display ───────────────────────────────── */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}>
            {/* Screen bezel */}
            <div style={{
              flex: 1,
              borderRadius: 8,
              background: "#080808",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,153,0,0.2)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              {/* LCARS header on screen */}
              <div style={{
                height: 24,
                background: entityFound ? "rgba(0,80,40,0.9)" : "var(--lcars-amber-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
                flexShrink: 0,
                transition: "background 0.6s",
              }}>
                <span className="lcars-label" style={{ color: entityFound ? "rgba(0,255,136,0.8)" : "rgba(0,0,0,0.6)", fontSize: 8, transition: "color 0.4s" }}>
                  {entityFound ? nearestEntity.name : "LIFE FORM ANALYSIS"}
                </span>
                <span className="lcars-label" style={{ color: entityFound ? "rgba(0,255,136,0.8)" : "rgba(0,0,0,0.6)", fontSize: 8, transition: "color 0.4s" }}>
                  {entityFound ? "LIFE FORM IDENTIFIED" : `SCAN MODE: ${scanning ? scanModeLabel : "STANDBY"}`}
                </span>
              </div>

              {/* Screen interior */}
              <div style={{
                flex: 1,
                background: "var(--lcars-screen)",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Live oscilloscope canvas */}
                <div style={{ position: "absolute", inset: 0 }}>
                  <Oscilloscope
                    scanning={scanning}
                    freqMod={freqMod}
                    resCoeff={resCoeff}
                    phaseShift={phaseShift}
                    gain={gain}
                    scanMode={scanMode}
                    proximity={scanning ? nearestProximity : 0}
                    entityId={entityFound ? nearestEntity.id : null}
                  />
                </div>
                {/* Scanlines overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.10) 3px, rgba(0,0,0,0.10) 4px)",
                  pointerEvents: "none", zIndex: 1,
                }} />
                {/* Vignette */}
                <div style={{
                  position: "absolute", inset: 0,
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.65)",
                  pointerEvents: "none", zIndex: 2,
                }} />
                {/* Status labels overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  zIndex: 3, pointerEvents: "none", gap: 8,
                }}>
                  {!scanning && (
                    <span className="lcars-readout" style={{
                      color: "var(--lcars-noise)", opacity: 0.35, fontSize: 10,
                    }}>
                      NO SIGNAL DETECTED
                    </span>
                  )}
                  {entityFound && (
                    <span className="lcars-readout" style={{
                      color: "var(--lcars-phosphor)", opacity: 0.7, fontSize: 9,
                      letterSpacing: "0.12em", textAlign: "center",
                      animation: "textBlink 2.5s step-end infinite",
                    }}>
                      {nearestEntity.bioReading}
                    </span>
                  )}
                </div>
              </div>

              {/* LCARS footer on screen */}
              <div style={{
                height: 24,
                background: entityFound ? "rgba(0,80,40,0.9)" : "var(--lcars-amber-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
                flexShrink: 0,
                transition: "background 0.6s",
              }}>
                <span className="lcars-label" style={{ color: entityFound ? "rgba(0,255,136,0.8)" : "rgba(0,0,0,0.6)", fontSize: 8, transition: "color 0.4s" }}>
                  {scanning ? `SENSITIVITY: ${sensitivityDisplay}%` : "SENSITIVITY: —"}
                </span>
                <span className="lcars-label" style={{ color: entityFound ? "rgba(0,255,136,0.8)" : "rgba(0,0,0,0.6)", fontSize: 8, transition: "color 0.4s" }}>
                  {entityFound ? `${nearestEntity.class} — ${nearestEntity.rarity}` : "CLASS: UNKNOWN"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Divider ────────────────────────────────────────────── */}
          <div style={{ width: 16, flexShrink: 0 }} />

          {/* ── Controls panel ─────────────────────────────────────── */}
          <div style={{
            width: 200,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {/* Primary dials */}
            <div style={{
              background: "#111",
              borderRadius: 10,
              border: "1px solid rgba(255,153,0,0.15)",
              padding: "14px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              <span className="lcars-label" style={{ color: "var(--lcars-amber-dark)", fontSize: 8 }}>PRIMARY CONTROLS</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <RotaryDial label="FREQ. MOD. α" size={56} defaultValue={0.5} onChange={setFreqMod} />
                <RotaryDial label="RES. COEFF." size={48} defaultValue={0.5} onChange={setResCoeff} />
                <RotaryDial label="PHASE SHIFT" size={40} defaultValue={0.5} onChange={setPhaseShift} />
              </div>
            </div>

            {/* Sliders + switches */}
            <div style={{
              background: "#111",
              borderRadius: 10,
              border: "1px solid rgba(255,153,0,0.15)",
              padding: "14px 12px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}>
              <span className="lcars-label" style={{ color: "var(--lcars-amber-dark)", fontSize: 8 }}>SECONDARY CONTROLS</span>

              {/* Sliders row */}
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <Slider label="GAIN Δ" defaultValue={0.5} onChange={setGain} />
                <Slider label="BAND FILT." defaultValue={0.5} onChange={setBandFilter} />
              </div>

              {/* Switches */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <ToggleSwitch
                  label="POL. INV."
                  positions={2}
                  defaultPosition={0}
                  onChange={setPolarity}
                  positionLabels={["NRM", "INV"]}
                />
                <ToggleSwitch
                  label="SCAN MODE"
                  positions={3}
                  defaultPosition={0}
                  onChange={setScanMode}
                  positionLabels={["PSV", "ACT", "DPP"]}
                />
              </div>

              {/* Init button */}
              <div
                onClick={handleInitScan}
                style={{
                  height: 34,
                  background: scanning
                    ? "rgba(0,255,136,0.15)"
                    : "rgba(204,102,0,0.3)",
                  border: `1px solid ${scanning ? "var(--lcars-phosphor)" : "var(--lcars-amber)"}`,
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: scanning
                    ? "0 0 16px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "0 0 12px rgba(255,153,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                  transition: "all 0.2s",
                  userSelect: "none",
                }}
              >
                <span className="lcars-label" style={{
                  color: scanning ? "var(--lcars-phosphor)" : "var(--lcars-amber)",
                }}>
                  {scanning ? "ABORT SCAN" : "INIT. SCAN"}
                </span>
              </div>
            </div>

          </div>

          {/* ── Right data strip ───────────────────────────────────── */}
          <div style={{ width: 4, flexShrink: 0, marginLeft: 12 }} />
          <div style={{
            width: 40,
            flexShrink: 0,
            background: "var(--lcars-blue)",
            borderRadius: "0 0 12px 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              {["STA", "TUS"].map(t => (
                <span key={t} className="lcars-label" style={{ color: "rgba(0,0,0,0.5)", fontSize: 7 }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              {["CLS", "CFM"].map(t => (
                <span key={t} className="lcars-label" style={{ color: "rgba(0,0,0,0.5)", fontSize: 7 }}>{t}</span>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom edge shadow */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 2,
          background: "rgba(0,0,0,0.4)",
          borderRadius: "0 0 20px 20px",
        }} />

      </div>

      {/* Surface reflection */}
      <div style={{
        position: "absolute",
        bottom: "calc(50vh - 320px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 40,
        background: "radial-gradient(ellipse, rgba(255,153,0,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <style>{`
        @keyframes alertPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--lcars-red); }
          50% { opacity: 0.25; box-shadow: 0 0 2px var(--lcars-red); }
        }
        @keyframes scanPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px var(--lcars-phosphor); }
          50% { opacity: 0.4; box-shadow: 0 0 4px var(--lcars-phosphor); }
        }
        @keyframes textBlink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.15; }
        }
      `}</style>

    </main>
  );
}
