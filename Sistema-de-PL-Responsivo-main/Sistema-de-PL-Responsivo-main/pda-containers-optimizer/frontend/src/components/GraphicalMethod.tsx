import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Compass, Play, Square, RotateCcw, Target } from 'lucide-react';
import { CargoVariableInput, ConstraintInput, OptimizationResult } from '../types/optimizer';

interface GraphicalMethodProps {
  variables: CargoVariableInput[];
  constraints: ConstraintInput[];
  technologyMatrix: number[][];
  result: OptimizationResult | null;
}

interface Vertex2D {
  label: string;
  x: number;
  y: number;
  z2D: number;
  zTotal: number;
  activeConstraints: string[];
  isOptimal: boolean;
}

const COLORS = [
  '#059669',
  '#7c3aed',
  '#d97706',
  '#e11d48',
  '#0284c7',
  '#4f46e5',
];

const EPSILON = 1e-7;

export const GraphicalMethod: React.FC<GraphicalMethodProps> = ({
  variables,
  constraints,
  technologyMatrix,
  result,
}) => {
  const [axisX, setAxisX] = useState<number>(0);
  const [axisY, setAxisY] = useState<number>(variables.length > 2 ? 2 : 1);
  const [projectionMode, setProjectionMode] = useState<'zero' | 'optimal'>('zero');
  const [isoProfitPct, setIsoProfitPct] = useState<number>(100);
  const [showIsoLine, setShowIsoLine] = useState<boolean>(true);
  const [showGradient, setShowGradient] = useState<boolean>(true);
  const [zoomFeasible, setZoomFeasible] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVerticesRef = useRef<{ sx: number; sy: number; idx: number }[]>([]);

  useEffect(() => {
    if (axisX >= variables.length || axisY >= variables.length || (variables.length >= 2 && axisX === axisY)) {
      setAxisX(0);
      setAxisY(Math.min(1, variables.length - 1));
    }
  }, [variables.length, axisX, axisY]);

  const handleFocusOptimalPair = () => {
    if (!result || variables.length < 2) return;
    const ranked = result.cargoAllocations
      .map((a, idx) => ({ idx, contrib: a.totalProfitContribution, profit: a.unitProfit }))
      .sort((a, b) => b.contrib - a.contrib || b.profit - a.profit || a.idx - b.idx);
    const i1 = ranked[0]?.idx ?? 0;
    const i2 = ranked[1]?.idx ?? 1;
    setAxisX(Math.min(i1, i2));
    setAxisY(Math.max(i1, i2));
    setIsoProfitPct(100);
  };

  const computed = useMemo(() => {
    const nVars = variables.length;
    const ix = Math.min(axisX, nVars - 1);
    const iy = Math.min(axisY, nVars - 1);
    const varX = variables[ix];
    const varY = variables[iy];

    let fixedProfit = 0;
    if (nVars > 2 && projectionMode === 'optimal' && result) {
      variables.forEach((v, kIdx) => {
        if (kIdx !== ix && kIdx !== iy) {
          const qty = result.cargoAllocations[kIdx]?.optimalQuantity || 0;
          fixedProfit += qty * v.profitCoefficient;
        }
      });
    }

    const adjConstraints = constraints.map((c, rIdx) => {
      let rhs = c.capacityRhs;
      if (nVars > 2 && projectionMode === 'optimal' && result) {
        variables.forEach((_, kIdx) => {
          if (kIdx !== ix && kIdx !== iy) {
            const qty = result.cargoAllocations[kIdx]?.optimalQuantity || 0;
            const coeff = technologyMatrix[rIdx]?.[kIdx] || 0;
            rhs -= coeff * qty;
          }
        });
      }
      rhs = Math.max(0, rhs);
      const ax = technologyMatrix[rIdx]?.[ix] || 0;
      const ay = ix === iy ? 0 : technologyMatrix[rIdx]?.[iy] || 0;
      return {
        index: rIdx,
        slackCode: c.slackCode,
        name: c.name,
        unit: c.unit,
        rhs,
        ax,
        ay,
        xIntercept: ax > EPSILON ? rhs / ax : null,
        yIntercept: ay > EPSILON ? rhs / ay : null,
        color: COLORS[rIdx % COLORS.length],
      };
    });

    const lines: { a: number; b: number; c: number }[] = [
      { a: 1, b: 0, c: 0 },
      { a: 0, b: 1, c: 0 },
    ];
    adjConstraints.forEach((con) => {
      if (con.ax > EPSILON || con.ay > EPSILON) {
        lines.push({ a: con.ax, b: con.ay, c: con.rhs });
      }
    });

    const rawPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const L1 = lines[i];
        const L2 = lines[j];
        const det = L1.a * L2.b - L2.a * L1.b;
        if (Math.abs(det) > 1e-9) {
          let x = (L1.c * L2.b - L2.c * L1.b) / det;
          let y = (L1.a * L2.c - L2.a * L1.c) / det;
          if (Math.abs(x) < 1e-7) x = 0;
          if (Math.abs(y) < 1e-7) y = 0;
          rawPoints.push({ x, y });
        }
      }
    }

    const feasible: Vertex2D[] = [];
    rawPoints.forEach((pt) => {
      if (pt.x < -1e-5 || pt.y < -1e-5) return;
      const x = Math.max(0, pt.x);
      const y = Math.max(0, pt.y);
      for (const con of adjConstraints) {
        if (con.ax * x + con.ay * y > con.rhs + 1e-4) return;
      }
      if (!feasible.some((v) => Math.hypot(v.x - x, v.y - y) < 1e-3)) {
        const z2D = varX.profitCoefficient * x + (ix === iy ? 0 : varY.profitCoefficient * y);
        const zTotal = z2D + fixedProfit;
        const active: string[] = [];
        if (x < 1e-4) active.push(`${varX.code}=0`);
        if (y < 1e-4) active.push(`${varY.code}=0`);
        adjConstraints.forEach((con) => {
          if (Math.abs(con.ax * x + con.ay * y - con.rhs) <= 1e-3) active.push(con.slackCode);
        });
        feasible.push({
          label: '',
          x,
          y,
          z2D,
          zTotal,
          activeConstraints: active,
          isOptimal: false,
        });
      }
    });

    if (feasible.length > 2) {
      const cx = feasible.reduce((s, v) => s + v.x, 0) / feasible.length;
      const cy = feasible.reduce((s, v) => s + v.y, 0) / feasible.length;
      feasible.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    }

    const originIdx = feasible.findIndex((v) => v.x < 1e-4 && v.y < 1e-4);
    const ordered =
      originIdx > 0 ? [...feasible.slice(originIdx), ...feasible.slice(0, originIdx)] : feasible;

    let maxZ = -Infinity;
    let optIdx = -1;
    ordered.forEach((v, idx) => {
      v.label = `V${idx}`;
      if (v.zTotal > maxZ + 1e-5 || (Math.abs(v.zTotal - maxZ) <= 1e-5 && v.x + v.y > 0)) {
        maxZ = v.zTotal;
        optIdx = idx;
      }
    });
    if (optIdx >= 0) ordered[optIdx].isOptimal = true;

    return {
      varX,
      varY,
      fixedProfit,
      constraints: adjConstraints,
      vertices: ordered,
      maxZ: maxZ > -Infinity ? maxZ : 0,
      maxZ2D: optIdx >= 0 ? ordered[optIdx].z2D : 0,
    };
  }, [variables, constraints, technologyMatrix, result, axisX, axisY, projectionMode]);

  useEffect(() => {
    if (!isAnimating) return;
    let pct = 0;
    let frameId: number;
    const step = () => {
      pct += 0.9;
      if (pct >= 100) {
        setIsoProfitPct(100);
        setIsAnimating(false);
        return;
      }
      setIsoProfitPct(pct);
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 620;
    const height = rect.height || 420;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padL = 56;
    const padR = 26;
    const padT = 26;
    const padB = 46;
    const plotW = Math.max(100, width - padL - padR);
    const plotH = Math.max(100, height - padT - padB);

    let maxFeasX = 0;
    let maxFeasY = 0;
    computed.vertices.forEach((v) => {
      if (v.x > maxFeasX) maxFeasX = v.x;
      if (v.y > maxFeasY) maxFeasY = v.y;
    });

    let maxIntX = 0;
    let maxIntY = 0;
    computed.constraints.forEach((c) => {
      if (c.xIntercept !== null && isFinite(c.xIntercept)) maxIntX = Math.max(maxIntX, c.xIntercept);
      if (c.yIntercept !== null && isFinite(c.yIntercept)) maxIntY = Math.max(maxIntY, c.yIntercept);
    });

    const domainX =
      zoomFeasible && (maxFeasX > EPSILON || maxFeasY > EPSILON)
        ? Math.max(maxFeasX * 1.28, 1)
        : Math.max(maxIntX * 1.12, maxFeasX * 1.28, 10);
    const domainY =
      zoomFeasible && (maxFeasX > EPSILON || maxFeasY > EPSILON)
        ? Math.max(maxFeasY * 1.28, 1)
        : Math.max(maxIntY * 1.12, maxFeasY * 1.28, 10);

    const sx = (x: number) => padL + (x / domainX) * plotW;
    const sy = (y: number) => padT + plotH - (y / domainY) * plotH;

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.font = '500 10px monospace';
    ctx.fillStyle = '#64748b';
    for (let i = 0; i <= 6; i++) {
      const vx = (domainX / 6) * i;
      const px = sx(vx);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(vx.toFixed(1), px, padT + plotH + 14);

      const vy = (domainY / 6) * i;
      const py = sy(vy);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(vy.toFixed(1), padL - 8, py + 3);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    if (computed.vertices.length >= 3) {
      ctx.beginPath();
      computed.vertices.forEach((v, idx) => {
        if (idx === 0) ctx.moveTo(sx(v.x), sy(v.y));
        else ctx.lineTo(sx(v.x), sy(v.y));
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    computed.constraints.forEach((c) => {
      if (c.ax <= EPSILON && c.ay <= EPSILON) return;
      const pts: { x: number; y: number }[] = [];
      if (c.ay > EPSILON) {
        pts.push({ x: 0, y: c.rhs / c.ay });
        pts.push({ x: domainX * 1.2, y: (c.rhs - c.ax * domainX * 1.2) / c.ay });
      } else if (c.ax > EPSILON) {
        const xc = c.rhs / c.ax;
        pts.push({ x: xc, y: 0 });
        pts.push({ x: xc, y: domainY * 1.2 });
      }
      if (pts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
        ctx.lineTo(sx(pts[1].x), sy(pts[1].y));
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    });

    if (showIsoLine && computed.maxZ2D > EPSILON) {
      const zCurr = (isoProfitPct / 100) * computed.maxZ2D;
      const cx = computed.varX.profitCoefficient;
      const cy = computed.varY.profitCoefficient;
      if (cy > EPSILON) {
        ctx.beginPath();
        ctx.setLineDash([7, 5]);
        ctx.moveTo(sx(-domainX * 0.1), sy((zCurr - cx * (-domainX * 0.1)) / cy));
        ctx.lineTo(sx(domainX * 1.2), sy((zCurr - cx * (domainX * 1.2)) / cy));
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    screenVerticesRef.current = [];
    const polyCX =
      computed.vertices.length > 0
        ? computed.vertices.reduce((s, v) => s + sx(v.x), 0) / computed.vertices.length
        : padL + plotW / 2;
    const polyCY =
      computed.vertices.length > 0
        ? computed.vertices.reduce((s, v) => s + sy(v.y), 0) / computed.vertices.length
        : padT + plotH / 2;

    const labelBoxes = computed.vertices.map((v, idx) => {
      const px = sx(v.x);
      const py = sy(v.y);
      screenVerticesRef.current.push({ sx: px, sy: py, idx });
      const labelStr = `${v.label}${v.isOptimal ? '★' : ''} (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`;
      ctx.font = v.isOptimal ? 'bold 10.5px monospace' : '10px monospace';
      const boxW = Math.ceil(ctx.measureText(labelStr).width) + 14;
      const boxH = 20;

      let dx = px - polyCX;
      let dy = py - polyCY;
      const dist = Math.hypot(dx, dy) || 1;
      dx /= dist;
      dy /= dist;

      let cx = px + dx * 28 + (dx >= 0 ? boxW * 0.45 : -boxW * 0.45);
      let cy = py + dy * 22;
      if (v.x < EPSILON && v.y < EPSILON) {
        cx = px + boxW / 2 + 12;
        cy = py - 16;
      } else if (v.y < EPSILON) {
        cx = px + boxW / 2 + 10;
        cy = py - 14;
      } else if (v.x < EPSILON) {
        cx = px + boxW / 2 + 8;
        cy = py - 22;
      }
      return { idx, v, px, py, cx, cy, boxW, boxH, labelStr };
    });

    for (let step = 0; step < 65; step++) {
      for (let i = 0; i < labelBoxes.length; i++) {
        for (let j = i + 1; j < labelBoxes.length; j++) {
          const a = labelBoxes[i];
          const b = labelBoxes[j];
          const overlapX = (a.boxW + b.boxW) / 2 + 8 - Math.abs(a.cx - b.cx);
          const overlapY = (a.boxH + b.boxH) / 2 + 8 - Math.abs(a.cy - b.cy);
          if (overlapX > 0 && overlapY > 0) {
            const signY = a.cy === b.cy ? (a.py <= b.py ? -1 : 1) : Math.sign(a.cy - b.cy);
            const signX = a.cx === b.cx ? (a.px <= b.px ? -1 : 1) : Math.sign(a.cx - b.cx);
            const pushY = (overlapY / 2 + 1.5) * signY;
            const pushX = overlapX * 0.18 * signX;
            a.cy += pushY;
            b.cy -= pushY;
            a.cx += pushX;
            b.cx -= pushX;
          }
        }
      }
      labelBoxes.forEach((b) => {
        b.cx = Math.max(padL + b.boxW / 2 + 4, Math.min(width - padR - b.boxW / 2 - 4, b.cx));
        b.cy = Math.max(padT + b.boxH / 2 + 4, Math.min(padT + plotH - b.boxH / 2 - 4, b.cy));
      });
    }

    labelBoxes.forEach((b) => {
      if (Math.hypot(b.cx - b.px, b.cy - b.py) > 18) {
        ctx.beginPath();
        ctx.moveTo(b.px, b.py);
        ctx.lineTo(b.cx, b.cy);
        ctx.strokeStyle = b.v.isOptimal ? '#10b981' : '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    labelBoxes.forEach((b) => {
      const { px, py, idx, v } = b;
      const isHov = idx === hoveredIdx;
      ctx.beginPath();
      ctx.arc(px, py, v.isOptimal ? (isHov ? 7.5 : 6.5) : isHov ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = v.isOptimal ? '#10b981' : isHov ? '#2563eb' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = v.isOptimal ? '#ffffff' : '#2563eb';
      ctx.stroke();
    });

    labelBoxes.forEach((b) => {
      const { cx, cy, boxW, boxH, labelStr, v, idx } = b;
      const isHov = idx === hoveredIdx;
      ctx.fillStyle = v.isOptimal ? '#ecfdf5' : isHov ? '#eff6ff' : 'rgba(255,255,255,0.94)';
      ctx.strokeStyle = v.isOptimal ? '#10b981' : isHov ? '#2563eb' : '#cbd5e1';
      ctx.lineWidth = v.isOptimal || isHov ? 1.6 : 1.1;
      ctx.beginPath();
      ctx.rect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
      ctx.fill();
      ctx.stroke();

      ctx.font = v.isOptimal ? 'bold 10.5px monospace' : '10px monospace';
      ctx.fillStyle = v.isOptimal ? '#047857' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelStr, cx, cy + 0.5);
    });

    ctx.restore();
  }, [computed, isoProfitPct, showIsoLine, showGradient, zoomFeasible, hoveredIdx]);

  const currentZ = (isoProfitPct / 100) * computed.maxZ2D + computed.fixedProfit;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <Compass className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-foreground text-base">
              Método Gráfico de Programação Linear (Região Viável &amp; Vértices 2D)
            </h3>
            <p className="text-xs text-muted-foreground">
              Visualização geométrica das restrições, polígono de soluções viáveis, reta objetivo (Z) e pontos extremos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={axisX}
            onChange={(e) => setAxisX(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground font-semibold"
          >
            {variables.map((v, idx) => (
              <option key={v.code} value={idx}>
                Eixo X: {v.code} ({v.name})
              </option>
            ))}
          </select>

          <select
            value={axisY}
            onChange={(e) => setAxisY(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground font-semibold"
          >
            {variables.map((v, idx) => (
              <option key={v.code} value={idx}>
                Eixo Y: {v.code} ({v.name})
              </option>
            ))}
          </select>

          {variables.length > 2 && (
            <select
              value={projectionMode}
              onChange={(e) => setProjectionMode(e.target.value as 'zero' | 'optimal')}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground"
            >
              <option value="zero">Demais = 0 (2D Puro)</option>
              <option value="optimal">Demais = Solução Ótima</option>
            </select>
          )}

          <button
            onClick={handleFocusOptimalPair}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Par Ótimo</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-3 rounded-lg border border-border">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white"
          >
            {isAnimating ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAnimating ? 'Parar' : 'Animar Z'}</span>
          </button>
          <button
            onClick={() => {
              setIsAnimating(false);
              setIsoProfitPct(100);
            }}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Z* Ótimo</span>
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={isoProfitPct}
            onChange={(e) => setIsoProfitPct(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 whitespace-nowrap">
            R$ {currentZ.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showIsoLine}
              onChange={(e) => setShowIsoLine(e.target.checked)}
            />
            <span>Reta Z</span>
          </label>
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={zoomFeasible}
              onChange={(e) => setZoomFeasible(e.target.checked)}
            />
            <span>Zoom na Região Viável</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 border border-border rounded-xl overflow-hidden bg-white">
          <canvas ref={canvasRef} className="w-full h-[420px] block" />
        </div>

        <div className="lg:col-span-5 border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-muted/80 border-b border-border uppercase">
              <tr>
                <th className="py-2.5 px-3">Vértice</th>
                <th className="py-2.5 px-3">{computed.varX.code}</th>
                <th className="py-2.5 px-3">{computed.varY.code}</th>
                <th className="py-2.5 px-3 text-right">Lucro Z (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {computed.vertices.map((v, idx) => (
                <tr
                  key={v.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(-1)}
                  className={v.isOptimal ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' : ''}
                >
                  <td className="py-2 px-3">
                    {v.label} {v.isOptimal && '★ Ótimo'}
                  </td>
                  <td className="py-2 px-3">{v.x.toFixed(2)}</td>
                  <td className="py-2 px-3">{v.y.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">
                    {v.zTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

