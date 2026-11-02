/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { PDESolution } from '../types';
import { formatNum } from '../utils/pdeSolver';

interface RootBehaviourPlotProps {
  solution: PDESolution;
}

export const RootBehaviourPlot: React.FC<RootBehaviourPlotProps> = ({ solution }) => {
  const { rootType, m1, m2 } = solution;

  const [hoverPt, setHoverPt] = useState<{ x: number; y1: number; y2?: number; px: number; py1: number } | null>(null);

  // SVG dimensions
  const svgWidth = 520;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Domain for x
  const xMin = -2.5;
  const xMax = 2.5;

  // Determine functions based on root type
  const config = useMemo(() => {
    if (rootType === 'distinct_real') {
      const r1 = m1.real;
      const r2 = m2.real;
      // Normalizing exponent if roots are large to prevent visual blowup
      const scale = Math.max(1, Math.max(Math.abs(r1), Math.abs(r2)) / 3);
      const effectiveR1 = r1 / scale;
      const effectiveR2 = r2 / scale;

      return {
        type: 'distinct',
        title: 'Distinct Real Roots – Exponential Behaviour',
        label1: `y₁ = e^(${formatNum(r1)}x)`,
        label2: `y₂ = e^(${formatNum(r2)}x)`,
        color1: '#2563EB', // Blue
        color2: '#0D9488', // Teal
        f1: (x: number) => Math.exp(effectiveR1 * x),
        f2: (x: number) => Math.exp(effectiveR2 * x),
        yMinTarget: -0.5,
        yMaxTarget: 6,
      };
    } else if (rootType === 'repeated_real') {
      const r = m1.real;
      const scale = Math.max(1, Math.abs(r) / 2.5);
      const effectiveR = r / scale;

      return {
        type: 'repeated',
        title: 'Repeated Real Roots – Repeated-Root Behaviour',
        label1: `y₁ = e^(${formatNum(r)}x)`,
        label2: `y₂ = x · e^(${formatNum(r)}x)`,
        color1: '#059669', // Emerald
        color2: '#0D9488', // Teal
        f1: (x: number) => Math.exp(effectiveR * x),
        f2: (x: number) => x * Math.exp(effectiveR * x),
        yMinTarget: -2.5,
        yMaxTarget: 5,
      };
    } else if (rootType === 'complex') {
      const alpha = m1.real;
      const beta = Math.abs(m1.imag);
      const effectiveAlpha = Math.max(-1.5, Math.min(1.5, alpha * 0.5));
      const effectiveBeta = Math.max(0.8, Math.min(6, beta));

      return {
        type: 'complex',
        title: 'Complex Conjugate Roots – Sinusoidal Behaviour',
        label1: alpha === 0 ? `y₁ = cos(${formatNum(beta)}x)` : `y₁ = e^(${formatNum(alpha)}x) cos(${formatNum(beta)}x)`,
        label2: alpha === 0 ? `y₂ = sin(${formatNum(beta)}x)` : `y₂ = e^(${formatNum(alpha)}x) sin(${formatNum(beta)}x)`,
        color1: '#D97706', // Orange / Amber
        color2: '#4F46E5', // Indigo
        f1: (x: number) => Math.exp(effectiveAlpha * x) * Math.cos(effectiveBeta * x),
        f2: (x: number) => Math.exp(effectiveAlpha * x) * Math.sin(effectiveBeta * x),
        yMinTarget: -2.5,
        yMaxTarget: 2.5,
      };
    } else {
      // Linear degenerate
      const r = m1.real;
      return {
        type: 'linear',
        title: 'Linear Auxiliary Equation – Exponential Behaviour',
        label1: `y = e^(${formatNum(r)}x)`,
        color1: '#2563EB',
        f1: (x: number) => Math.exp(Math.max(-2, Math.min(2, r)) * x),
        yMinTarget: -0.5,
        yMaxTarget: 6,
      };
    }
  }, [rootType, m1, m2]);

  // Compute y bounds
  const { yMin, yMax } = useMemo(() => {
    let minY = config.yMinTarget;
    let maxY = config.yMaxTarget;

    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const v1 = config.f1(x);
      if (isFinite(v1)) {
        minY = Math.min(minY, Math.max(-8, v1));
        maxY = Math.max(maxY, Math.min(8, v1));
      }
      if (config.f2) {
        const v2 = config.f2(x);
        if (isFinite(v2)) {
          minY = Math.min(minY, Math.max(-8, v2));
          maxY = Math.max(maxY, Math.min(8, v2));
        }
      }
    }

    const span = Math.max(3, maxY - minY);
    return { yMin: minY - span * 0.1, yMax: maxY + span * 0.1 };
  }, [config, xMin, xMax]);

  // Coordinate transforms
  const toSvgX = (xVal: number) => padding.left + ((xVal - xMin) / (xMax - xMin)) * plotWidth;
  const toSvgY = (yVal: number) => padding.top + ((yMax - yVal) / (yMax - yMin)) * plotHeight;
  const fromSvgX = (px: number) => xMin + ((px - padding.left) / plotWidth) * (xMax - xMin);

  // Generate paths
  const path1 = useMemo(() => {
    const points: string[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = config.f1(x);
      const px = toSvgX(x);
      const py = toSvgY(y);
      const clampedPy = Math.max(-40, Math.min(svgHeight + 40, py));
      points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${clampedPy.toFixed(2)}`);
    }
    return points.join(' ');
  }, [config, xMin, xMax, yMin, yMax]);

  const path2 = useMemo(() => {
    if (!config.f2) return null;
    const points: string[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = config.f2(x);
      const px = toSvgX(x);
      const py = toSvgY(y);
      const clampedPy = Math.max(-40, Math.min(svgHeight + 40, py));
      points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${clampedPy.toFixed(2)}`);
    }
    return points.join(' ');
  }, [config, xMin, xMax, yMin, yMax]);

  // Zero axes positions
  const zeroY = toSvgY(0);
  const zeroX = toSvgX(0);

  // Ticks for x
  const xTicks = useMemo(() => [-2, -1, 0, 1, 2], []);

  // Ticks for y
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 4;
    const step = (yMax - yMin) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(yMin + i * step);
    }
    return ticks;
  }, [yMin, yMax]);

  // Hover handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (px >= padding.left && px <= svgWidth - padding.right) {
      const xVal = fromSvgX(px);
      const y1Val = config.f1(xVal);
      const y2Val = config.f2 ? config.f2(xVal) : undefined;
      const py1 = toSvgY(y1Val);
      setHoverPt({ x: xVal, y1: y1Val, y2: y2Val, px, py1 });
    } else {
      setHoverPt(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5">
      <div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0] pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-[#233746] tracking-tight">
            Second Plot – {config.title}
          </h3>
          <p className="text-xs text-[#477FA5] font-mono mt-0.5">
            Representative solutions illustrating characteristic modes
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded" style={{ backgroundColor: config.color1 }} />
            <span className="text-[#233746] font-medium text-[11px]">{config.label1}</span>
          </div>
          {config.label2 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: config.color2 }} />
              <span className="text-[#233746] font-medium text-[11px]">{config.label2}</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-hidden rounded-lg bg-[#F7F9F8] border border-[#E2E8F0]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto block select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPt(null)}
        >
          <defs>
            <clipPath id="plot-area-clip">
              <rect
                x={padding.left}
                y={padding.top}
                width={plotWidth}
                height={plotHeight}
              />
            </clipPath>
          </defs>

          {/* Grid lines */}
          <g stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3">
            {xTicks.map((tick, i) => {
              const xPos = toSvgX(tick);
              return <line key={`rx-${i}`} x1={xPos} y1={padding.top} x2={xPos} y2={svgHeight - padding.bottom} />;
            })}
            {yTicks.map((tick, i) => {
              const yPos = toSvgY(tick);
              return <line key={`ry-${i}`} x1={padding.left} y1={yPos} x2={svgWidth - padding.right} y2={yPos} />;
            })}
          </g>

          {/* Coordinate Axes */}
          {/* x-axis */}
          {zeroY >= padding.top && zeroY <= svgHeight - padding.bottom && (
            <line
              x1={padding.left}
              y1={zeroY}
              x2={svgWidth - padding.right}
              y2={zeroY}
              stroke="#64748B"
              strokeWidth="1.5"
            />
          )}

          {/* y-axis */}
          {zeroX >= padding.left && zeroX <= svgWidth - padding.right && (
            <line
              x1={zeroX}
              y1={padding.top}
              x2={zeroX}
              y2={svgHeight - padding.bottom}
              stroke="#64748B"
              strokeWidth="1.5"
            />
          )}

          {/* Axis labels */}
          <text
            x={svgWidth - padding.right + 12}
            y={zeroY + 4}
            fill="#233746"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            x
          </text>
          <text
            x={zeroX >= padding.left ? zeroX - 4 : padding.left + 4}
            y={padding.top - 8}
            fill="#233746"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="end"
          >
            y
          </text>

          {/* x-axis ticks */}
          {xTicks.map((tick, i) => {
            const xPos = toSvgX(tick);
            return (
              <g key={`xtick-${i}`}>
                <line x1={xPos} y1={svgHeight - padding.bottom} x2={xPos} y2={svgHeight - padding.bottom + 4} stroke="#64748B" />
                <text
                  x={xPos}
                  y={svgHeight - padding.bottom + 16}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* y-axis ticks */}
          {yTicks.map((tick, i) => {
            const yPos = toSvgY(tick);
            return (
              <g key={`ytick-${i}`}>
                <line x1={padding.left - 4} y1={yPos} x2={padding.left} y2={yPos} stroke="#64748B" />
                <text
                  x={padding.left - 8}
                  y={yPos + 3}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatNum(tick, 1)}
                </text>
              </g>
            );
          })}

          {/* Plotted Curves (Clipped to plot area) */}
          <g clipPath="url(#plot-area-clip)">
            {/* Curve 1 */}
            <path
              d={path1}
              fill="none"
              stroke={config.color1}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Curve 2 */}
            {path2 && (
              <path
                d={path2}
                fill="none"
                stroke={config.color2}
                strokeWidth="2.2"
                strokeDasharray={rootType === 'repeated_real' ? '5,4' : undefined}
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Hover crosshair */}
          {hoverPt && (
            <g>
              <line
                x1={hoverPt.px}
                y1={padding.top}
                x2={hoverPt.px}
                y2={svgHeight - padding.bottom}
                stroke="#64748B"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle
                cx={hoverPt.px}
                cy={hoverPt.py1}
                r="4"
                fill={config.color1}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Coordinate Label Badge */}
        {hoverPt && (
          <div
            className="absolute bg-white/95 backdrop-blur-xs border border-[#E2E8F0] shadow-xs px-2.5 py-1 rounded text-[11px] font-mono text-[#233746] pointer-events-none"
            style={{
              left: Math.min(svgWidth - 140, Math.max(10, hoverPt.px - 50)),
              top: Math.max(10, hoverPt.py1 - 40),
            }}
          >
            <div>x: {formatNum(hoverPt.x, 2)}</div>
            <div style={{ color: config.color1 }}>y₁: {formatNum(hoverPt.y1, 2)}</div>
            {hoverPt.y2 !== undefined && (
              <div style={{ color: config.color2 }}>y₂: {formatNum(hoverPt.y2, 2)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
