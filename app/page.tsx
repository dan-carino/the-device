"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import RotaryDial from "@/components/RotaryDial";
import Slider from "@/components/Slider";
import ToggleSwitch from "@/components/ToggleSwitch";
import Oscilloscope from "@/components/Oscilloscope";
import { resolveEntity } from "@/data/entities";
import {
  startAmbientHum,
  playInitScan,
  playSignalDetected,
  playEntityFound,
} from "@/hooks/useAudioContext";

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
  const audioStartedRef = useRef(false);

  const scanModeLabel = ["PASSIVE", "ACTIVE", "DEEP"][scanMode];

  // Start ambient hum on first user interaction (any pointer down on the page)
  const ensureAudio = useCallback(() => {
    if (!audioStartedRef.current) {
      audioStartedRef.current = true;
      startAmbientHum();
    }
  }, []);

  const handleInitScan = useCallback(() => {
    ensureAudio();
    playInitScan();
    setScanning(s => !s);
  }, [ensureAudio]);

  // Entity proximity — recalculates on every control change
  const resolution = useMemo(
    () => resolveEntity({ freqMod, resCoeff, phaseShift, gain }),
    [freqMod, resCoeff, phaseShift, gain]
  );

  const { nearestEntity, nearestProximity } = resolution;
  const entityFound = scanning && nearestProximity >= 0.7;

  // Fire sounds when proximity crosses thresholds while scanning
  const prevProximityRef = useRef(0);
  useEffect(() => {
    const prev = prevProximityRef.current;

    if (scanning) {
      // Crossed into partial resolution
      if (prev < 0.3 && nearestProximity >= 0.3) {
        playSignalDetected();
      }
      // Crossed into full resolution
      if (prev < 0.7 && nearestProximity >= 0.7) {
        playEntityFound();
      }
    }
    prevProximityRef.current = nearestProximity;
  }, [scanning, nearestProximity]);

  // Sensitivity derived from proximity when scanning
  const sensitivityDisplay = scanning
    ? Math.round(nearestProximity * 100)
    : Math.round((freqMod * 0.6 + gain * 0.4) * 100);

  // ── Commander briefing system ────────────────────────────────────
  const IDLE_MESSAGES = [
    "Ensign. The device before you is a Class IV bio-scanner. We're detecting anomalous subspace signatures in this sector. Initialise a scan when ready.",
    "Primary search parameters: frequency modulation and resonance coefficient. Phase shift controls dimensional depth. You'll need all three axes to isolate a contact.",
    "Intel suggests multiple life forms are present in this region. Some are common. Some have never been classified. The scanner will find them — if you know how to use it.",
    "These readings don't announce themselves. You have to go looking. Adjust the dials, initialise a scan, and pay attention to what the oscilloscope tells you.",
  ];

  const [idleIndex, setIdleIndex] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [briefingText, setBriefingText] = useState(IDLE_MESSAGES[0]);
  const [displayedText, setDisplayedText] = useState("");
  const [cursorOn, setCursorOn] = useState(true);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEntityFoundRef = useRef(false);

  // Track total entities found across scans
  useEffect(() => {
    if (entityFound && !prevEntityFoundRef.current) {
      setFoundCount(c => c + 1);
    }
    prevEntityFoundRef.current = entityFound;
  }, [entityFound]);

  // Cycle idle messages when not scanning
  useEffect(() => {
    if (scanning) return;
    const t = setInterval(() => setIdleIndex(i => (i + 1) % IDLE_MESSAGES.length), 9000);
    return () => clearInterval(t);
  }, [scanning]);

  // Select the right message based on device state
  useEffect(() => {
    let msg = "";
    if (!scanning) {
      msg = IDLE_MESSAGES[idleIndex];
    } else if (entityFound) {
      const remaining = 5 - foundCount;
      msg = foundCount <= 1
        ? `Contact. ${nearestEntity.name}. ${nearestEntity.class}. ${nearestEntity.bioReading}. Log it, Ensign. There are four more out there.`
        : remaining > 0
          ? `${nearestEntity.name} confirmed. ${foundCount} of 5 entities logged. The rarest configurations require precise multi-axis tuning. Keep scanning.`
          : `${nearestEntity.name}. That's all five. Remarkable work, Ensign. This sector's catalogue is complete.`;
    } else if (nearestProximity >= 0.5) {
      msg = "Something is resolving on sensors. Stay with it — adjust carefully. Don't let it slip.";
    } else if (nearestProximity >= 0.3) {
      msg = "Hold on. I'm reading a biosignature. Don't change course — fine-tune the resonance coefficient and hold your position.";
    } else if (nearestProximity >= 0.1) {
      msg = "Something on the edge of sensors. Faint. Adjust your parameters carefully — these readings are unstable.";
    } else {
      msg = "Nothing on sensors yet. The frequency modulation dial is your broadest search parameter. Start there.";
    }
    setBriefingText(msg);
  }, [scanning, entityFound, nearestProximity, idleIndex, nearestEntity, foundCount]);

  // Typewriter — reruns whenever briefingText changes
  useEffect(() => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setDisplayedText("");
    let i = 0;
    const type = () => {
      i++;
      setDisplayedText(briefingText.slice(0, i));
      if (i < briefingText.length) {
        typewriterRef.current = setTimeout(type, 22);
      }
    };
    // Small initial delay so message doesn't start mid-transition
    typewriterRef.current = setTimeout(type, 120);
    return () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); };
  }, [briefingText]);

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <main style={{
      width: "100vw",
      minHeight: "100vh",
      background: "#f0eeeb",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 0",
      boxSizing: "border-box",
    }}>

      {/* ── Commander briefing ─────────────────────────────────── */}
      <div style={{
        width: 780,
        marginBottom: 32,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* Speaker line */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-lcars, 'Courier New', monospace)",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "#999",
            textTransform: "uppercase",
          }}>
            CMDR. W. RIKER · USS ENTERPRISE-D · NCC-1701-D
          </span>
          <span style={{
            fontFamily: "var(--font-lcars, 'Courier New', monospace)",
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "#bbb",
          }}>
            SD {foundCount > 0 ? `47634.44 · ${foundCount}/5 LOGGED` : "47634.44"}
          </span>
        </div>

        {/* Thin rule */}
        <div style={{
          height: 1,
          background: "linear-gradient(90deg, rgba(200,140,0,0.4) 0%, rgba(200,140,0,0.15) 60%, transparent 100%)",
        }} />

        {/* Briefing text */}
        <p style={{
          fontFamily: "var(--font-lcars, 'Courier New', monospace)",
          fontSize: 13,
          lineHeight: 1.65,
          color: "#1a1a1a",
          margin: 0,
          minHeight: "2.8em",
          letterSpacing: "0.01em",
        }}>
          {displayedText}
          <span style={{
            opacity: cursorOn ? 1 : 0,
            color: "rgba(200,120,0,0.8)",
            fontWeight: "bold",
            transition: "opacity 0.1s",
          }}>▋</span>
        </p>
      </div>

      {/* ── The Device ─────────────────────────────────────────── */}
      <div onPointerDown={ensureAudio} style={{
        position: "relative",
        width: 780,
        height: 520,
        borderRadius: 18,
        // Directional body gradient — light from upper-left
        background: "linear-gradient(148deg, #282626 0%, #1e1c1c 35%, #181616 65%, #131111 100%)",
        // Multi-layer shadow: contact → near → mid → ambient penumbra
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.055),
          0 1px 2px rgba(0,0,0,0.95),
          0 4px 10px rgba(0,0,0,0.85),
          0 14px 30px rgba(0,0,0,0.65),
          0 30px 60px rgba(0,0,0,0.45),
          0 60px 100px rgba(0,0,0,0.28),
          0 100px 140px rgba(0,0,0,0.16),
          -3px 6px 20px rgba(0,0,0,0.4)
        `,
        // Slight perspective tilt — like you're looking down at the device on a desk
        transform: "perspective(1100px) rotateX(2.5deg)",
        transformOrigin: "center 55%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Top edge highlight — bright, catches the key light */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 75%, transparent 100%)",
          zIndex: 10,
          borderRadius: "18px 18px 0 0",
        }} />

        {/* Left edge highlight — secondary light */}
        <div style={{
          position: "absolute",
          top: 18,
          left: 0,
          bottom: 18,
          width: 1,
          background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.09) 20%, rgba(255,255,255,0.09) 80%, transparent 100%)",
          zIndex: 10,
        }} />

        {/* Bottom edge — in shadow, darker */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 18,
          right: 18,
          height: 1,
          background: "rgba(0,0,0,0.6)",
          zIndex: 10,
        }} />

        {/* Panel corner screws — 4 × machined detail */}
        {[
          { top: 10, left: 10 },
          { top: 10, right: 10 },
          { bottom: 10, left: 10 },
          { bottom: 10, right: 10 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute",
            ...pos,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #2e2e2e, #111)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04)",
            zIndex: 10,
          }}>
            {/* Phillips cross */}
            <div style={{ position: "absolute", top: "45%", left: "15%", right: "15%", height: "1px", background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", left: "45%", top: "15%", bottom: "15%", width: "1px", background: "rgba(0,0,0,0.6)" }} />
          </div>
        ))}

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
            {/* Screen bezel — deeply recessed into the panel */}
            <div style={{
              flex: 1,
              borderRadius: 6,
              background: "#050505",
              boxShadow: `
                inset 0 3px 12px rgba(0,0,0,0.95),
                inset 0 1px 4px rgba(0,0,0,0.9),
                inset 0 0 0 1px rgba(0,0,0,0.8),
                inset 2px 0 8px rgba(0,0,0,0.5),
                inset -2px 0 8px rgba(0,0,0,0.5),
                0 0 0 1px rgba(255,153,0,0.12)
              `,
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
                  boxShadow: "inset 0 0 50px rgba(0,0,0,0.75)",
                  pointerEvents: "none", zIndex: 2,
                }} />

                {/* Glass sheen — curved screen surface reflection */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: "28%",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0.008) 60%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 4,
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
              background: "linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 100%)",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.8)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              borderLeft: "1px solid rgba(255,255,255,0.03)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03)",
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
              background: "linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 100%)",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.8)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              borderLeft: "1px solid rgba(255,255,255,0.03)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03)",
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

      {/* Ground shadow — casts below the device on the desk surface */}
      <div style={{
        position: "absolute",
        bottom: "calc(50vh - 300px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: 760,
        height: 80,
        background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,0,0,0.22) 0%, transparent 100%)",
        filter: "blur(12px)",
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
