"use client";

import { useRef, useEffect, useCallback } from "react";

interface OscilloscopeProps {
  scanning: boolean;
  freqMod: number;
  resCoeff: number;
  phaseShift: number;
  gain: number;
  scanMode: number;
  proximity?: number;    // 0–1: how close to an entity
  entityId?: string | null; // ID of nearest entity when proximity >= 0.7
}

function rand(seed: number): number {
  // Fast single-value hash
  seed = ((seed >>> 16) ^ seed) * 0x45d9f3b;
  seed = ((seed >>> 16) ^ seed) * 0x45d9f3b;
  seed = (seed >>> 16) ^ seed;
  return (seed >>> 0) / 0xffffffff;
}

// ── Entity-specific canvas renderers ──────────────────────────
function drawEntityOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  entityId: string,
  strength: number  // 0–1
) {
  const alpha = Math.min(0.9, strength * 1.2);
  const cy = H / 2;

  ctx.save();

  switch (entityId) {
    case "neural-lattice": {
      // 8 nodes in a loose cluster, arcing connections between them
      const nodes = Array.from({ length: 8 }, (_, i) => ({
        x: W * 0.2 + (W * 0.6) * rand(i * 17 + 1),
        y: H * 0.15 + (H * 0.7) * rand(i * 17 + 2),
        r: 3 + rand(i * 17 + 3) * 4,
        pulse: Math.sin(t * 2 + i * 0.8) * 0.5 + 0.5,
      }));

      // Arcs between connected nodes
      ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.35})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < W * 0.3) {
            const arcAlpha = (1 - dist / (W * 0.3)) * 0.5;
            ctx.strokeStyle = `rgba(0,255,136,${alpha * arcAlpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            // Slight arc via quadratic curve
            const mx = (nodes[i].x + nodes[j].x) / 2 + (rand(i * j + 99) - 0.5) * 30;
            const my = (nodes[i].y + nodes[j].y) / 2 + (rand(i * j + 100) - 0.5) * 30;
            ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Node dots
      for (const node of nodes) {
        const r = node.r * (0.7 + node.pulse * 0.3);
        ctx.fillStyle = `rgba(0,255,136,${alpha * (0.4 + node.pulse * 0.5)})`;
        ctx.shadowColor = "rgba(0,255,136,0.6)";
        ctx.shadowBlur = 6 * alpha;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "radial-filament": {
      // Concentric rings with tendrils
      const cx = W / 2, cyr = H / 2;
      const rings = 3;
      for (let r = 0; r < rings; r++) {
        const radius = (30 + r * 35) * (W / 412);
        const pulsed = radius * (0.9 + Math.sin(t * 1.5 + r * 1.2) * 0.1);
        ctx.strokeStyle = `rgba(0,255,136,${alpha * (0.4 - r * 0.08)})`;
        ctx.lineWidth = 1.5 - r * 0.4;
        ctx.shadowColor = "rgba(0,255,136,0.4)";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(cx, cyr, pulsed, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Tendrils
      const tendrilCount = 12;
      for (let i = 0; i < tendrilCount; i++) {
        const angle = (i / tendrilCount) * Math.PI * 2 + t * 0.5;
        const innerR = 30 * (W / 412);
        const outerR = (innerR + 40 + Math.sin(t * 2.5 + i * 0.5) * 15) * (W / 412);
        ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cyr + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cyr + Math.sin(angle) * outerR);
        ctx.stroke();
      }
      break;
    }

    case "crystalline-mass": {
      // Rotating polygon with refraction edges
      const cx = W / 2, cyr = H / 2;
      const sides = 7;
      const outerR = Math.min(W, H) * 0.28;
      const rotation = t * 0.4;

      ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(0,255,136,0.5)";
      ctx.shadowBlur = 5 * alpha;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + rotation;
        const r = outerR * (0.85 + rand(i * 7 + Math.floor(t * 2)) * 0.15);
        i === 0 ? ctx.moveTo(cx + Math.cos(angle) * r, cyr + Math.sin(angle) * r)
                : ctx.lineTo(cx + Math.cos(angle) * r, cyr + Math.sin(angle) * r);
      }
      ctx.stroke();

      // Inner polygon
      ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - rotation;
        const r = outerR * 0.55;
        i === 0 ? ctx.moveTo(cx + Math.cos(angle) * r, cyr + Math.sin(angle) * r)
                : ctx.lineTo(cx + Math.cos(angle) * r, cyr + Math.sin(angle) * r);
      }
      ctx.stroke();

      // Glint effect (random bright spark)
      const glintAngle = t * 3.7;
      const glintX = cx + Math.cos(glintAngle) * outerR * 0.9;
      const glintY = cyr + Math.sin(glintAngle) * outerR * 0.9;
      ctx.fillStyle = `rgba(200,255,220,${alpha * 0.8})`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(glintX, glintY, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "fluid-membrane": {
      // Amoeba-like blob with sin-based border
      const cx = W / 2, cyr = H / 2;
      const baseR = Math.min(W, H) * 0.25;
      const points = 48;

      ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(0,255,136,0.4)";
      ctx.shadowBlur = 6 * alpha;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const distort =
          Math.sin(angle * 3 + t * 1.2) * 0.12 +
          Math.sin(angle * 5 - t * 0.8) * 0.07 +
          Math.sin(angle * 7 + t * 0.5) * 0.04;
        const r = baseR * (1 + distort);
        const x = cx + Math.cos(angle) * r;
        const y = cyr + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Interior shimmer
      ctx.fillStyle = `rgba(0,255,136,${alpha * 0.04})`;
      ctx.fill();
      break;
    }

    case "wave-collapse": {
      // Two-source interference pattern collapsing and expanding
      const src1x = W * 0.3;
      const src2x = W * 0.7;
      const srcY = H / 2;
      const waveAlpha = alpha * 0.5;
      const maxLines = 5;

      for (let ring = 1; ring <= maxLines; ring++) {
        const phase = (t * 2 + ring * 0.5) % (Math.PI * 2);
        const r1 = (ring / maxLines) * W * 0.5 * ((Math.sin(phase) + 1) / 2 * 0.5 + 0.5);
        const r2 = (ring / maxLines) * W * 0.5 * ((Math.sin(phase + 1.5) + 1) / 2 * 0.5 + 0.5);
        const ringAlpha = waveAlpha * (1 - ring / maxLines);

        ctx.strokeStyle = `rgba(0,255,136,${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(0,255,136,0.3)";
        ctx.shadowBlur = ring === 1 ? 6 : 0;

        ctx.beginPath();
        ctx.arc(src1x, srcY, r1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(src2x, srcY, r2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Interference line at midpoint
      ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.4})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.1);
      ctx.lineTo(W / 2, H * 0.9);
      ctx.stroke();

      // Source dots
      for (const sx of [src1x, src2x]) {
        ctx.fillStyle = `rgba(0,255,136,${alpha * 0.8})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, srcY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

export default function Oscilloscope({
  scanning, freqMod, resCoeff, phaseShift, gain, scanMode,
  proximity = 0, entityId = null,
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const scanProgressRef = useRef(0);

  // Size canvas on mount and on window resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // Refs for smooth proximity interpolation (avoids jumpy color on React re-renders)
  const proximityRef = useRef(0);
  const entityIdRef = useRef<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return; }

    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) { rafRef.current = requestAnimationFrame(draw); return; }

    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

    const f = frameRef.current;
    const t = f / 60; // seconds at 60fps

    // Scan progress
    if (scanning) {
      const speed = 0.008 + scanMode * 0.005;
      scanProgressRef.current = Math.min(1, scanProgressRef.current + speed);
    } else {
      scanProgressRef.current = Math.max(0, scanProgressRef.current - 0.03);
    }
    const sp = scanProgressRef.current;

    // Smooth proximity tracking
    proximityRef.current += (proximity - proximityRef.current) * 0.05;
    entityIdRef.current = entityId;
    const prox = proximityRef.current;

    // ── Phosphor persistence: composite previous frame then clear ─
    // Draw a semi-transparent fill to fade previous content
    ctx.fillStyle = "rgba(0,5,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    // ── Grid ─────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,153,0,0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, H * i / 4); ctx.lineTo(W, H * i / 4); ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(W * i / 8, 0); ctx.lineTo(W * i / 8, H); ctx.stroke();
    }

    // ── Center baseline ──────────────────────────────────────────
    const cy = H / 2;
    ctx.strokeStyle = "rgba(255,153,0,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

    // ── Noise: scattered amber static fragments ──────────────────
    const noiseSeed = Math.floor(t * 24);
    const noiseCount = scanning ? 4 : 22;
    for (let i = 0; i < noiseCount; i++) {
      const r1 = rand(noiseSeed * 1000 + i * 7);
      const r2 = rand(noiseSeed * 1000 + i * 7 + 1);
      const r3 = rand(noiseSeed * 1000 + i * 7 + 2);
      const r4 = rand(noiseSeed * 1000 + i * 7 + 3);
      const nx = r1 * W;
      const ny = r2 * H;
      const nw = r3 * (scanning ? 12 : 28) + 2;
      const na = 0.06 + r4 * (scanning ? 0.06 : 0.14);
      ctx.strokeStyle = `rgba(255,170,0,${na * (1 - sp * 0.7)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + nw, ny + (rand(noiseSeed + i * 31) - 0.5) * 6);
      ctx.stroke();
    }

    if (sp > 0) {
      const coherence = sp * sp;
      const freq = 2.5 + freqMod * 4;
      const res  = 0.35 + resCoeff * 0.55;
      const phs  = phaseShift * Math.PI * 2;
      const amp  = H * 0.3 * (0.5 + gain * 0.5);
      const drift = t * 1.2;

      const signalAlpha = Math.min(0.95, sp * 1.5);
      const glowAlpha   = Math.min(0.25, sp * 0.4);

      // Color: amber (255,170,0) → phosphor green (0,255,136) as proximity rises
      const r = Math.round(255 * (1 - prox));
      const g = Math.round(170 + (255 - 170) * prox);
      const b = Math.round(136 * prox);
      const sigColor = `${r},${g},${b}`;

      // ── Glow pass (wide, soft) ──────────────────────────────
      if (glowAlpha > 0.02) {
        ctx.strokeStyle = `rgba(${sigColor},${glowAlpha})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (let px = 0; px <= W; px += 2) {
          const nx = px / W;
          const noiseAmt = (1 - coherence);
          const noiseY = (rand(Math.floor(t * 30) + px) * 2 - 1) * noiseAmt * H * 0.28;
          const sig =
            Math.sin(nx * freq * Math.PI * 2 + drift + phs) * res +
            Math.sin(nx * freq * 1.618 * Math.PI * 2 + drift * 1.4 + phs * 0.6) * (1 - res) * 0.4 +
            Math.sin(nx * freq * 3.1 * Math.PI * 2 + drift * 2.3) * 0.1;
          const y = cy + sig * amp * coherence + noiseY * H * 0.15;
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      // ── Crisp signal line ──────────────────────────────────
      ctx.strokeStyle = `rgba(${sigColor},${signalAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = `rgba(${sigColor},0.5)`;
      ctx.shadowBlur = 4 * sp;
      ctx.beginPath();
      for (let px = 0; px <= W; px++) {
        const nx = px / W;
        const noiseAmt = (1 - coherence) * 0.9;
        const noiseY = (rand(Math.floor(t * 45) + px * 3) * 2 - 1) * noiseAmt;
        const sig =
          Math.sin(nx * freq * Math.PI * 2 + drift + phs) * res +
          Math.sin(nx * freq * 1.618 * Math.PI * 2 + drift * 1.4 + phs * 0.6) * (1 - res) * 0.4 +
          Math.sin(nx * freq * 3.1 * Math.PI * 2 + drift * 2.3) * 0.1;
        const y = cy + (sig * amp + noiseY * H * 0.25) * coherence + noiseY * H * 0.18 * (1 - coherence);
        px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Sweep line (leading edge of scan, when starting) ────
      if (sp < 0.7) {
        const sweepX = Math.min(W, sp / 0.7 * W);
        const g = ctx.createLinearGradient(sweepX - 24, 0, sweepX + 2, 0);
        g.addColorStop(0, "rgba(0,255,136,0)");
        g.addColorStop(1, `rgba(0,255,136,${(0.7 - sp) * 0.6})`);
        ctx.fillStyle = g;
        ctx.fillRect(sweepX - 24, 0, 26, H);
      }

      // ── Right-edge amplitude bars ────────────────────────────
      if (sp > 0.5) {
        const barAlpha = Math.min(0.5, (sp - 0.5) * 1.5);
        for (let i = 0; i < 6; i++) {
          const barY = H * 0.18 + (H * 0.64 / 6) * i;
          const lvl = Math.sin(t * 3.5 + i * 1.1) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(${sigColor},${barAlpha * 0.45})`;
          ctx.fillRect(W - 10, barY, 6 * lvl, 2);
        }
      }

      // ── Entity overlay: appears when proximity > 0.65 ────────
      if (prox > 0.65 && entityIdRef.current) {
        drawEntityOverlay(ctx, W, H, t, entityIdRef.current, (prox - 0.65) / 0.35);
      }
    }

    frameRef.current++;
    rafRef.current = requestAnimationFrame(draw);
  }, [scanning, freqMod, resCoeff, phaseShift, gain, scanMode, proximity, entityId]);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
