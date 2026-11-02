/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { PDESolution } from '../types';
import { formatNum } from '../utils/pdeSolver';

interface AuxiliaryEquationPlotProps {
  solution: PDESolution;
}

export const AuxiliaryEquationPlot: React.FC<AuxiliaryEquationPlotProps> = ({ solution }) => {
  const { a, b, c, discriminant, rootType, m1, m2 } = solution;

  const [hoverPt, setHoverPt] = useState<{ m: number; y: number; px: number; py: number } | null>(null);

  // SVG viewBox dimensions
  const svgWidth = 520;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Determine m (x-axis) range
  const { mMin, mMax, yMin, yMax } = useMemo(() => {
    let minM = -4;
    let maxM = 4;

    if (Math.abs(a) > 1e-12) {
      const vertexM = -b / (2 * a);
      if (rootType === 'distinct_real') {
        const rMin = Math.min(m1.real, m2.real);
        const rMax = Math.max(m1.real, m2.real);
        const span = Math.max(2, rMax - rMin);
        minM = Math.min(vertexM, rMin) - span * 0.6;
        maxM = Math.max(vertexM, rMax) + span * 0.6;
      } else if (rootType === 'repeated_real') {
        minM = vertexM - 3;
        maxM = vertexM + 3;
      } else {
        // complex roots
        const alpha = m1.real;
        const beta = Math.abs(m1.imag);
        minM = alpha - Math.max(3, beta * 1.5);
        maxM = alpha + Math.max(3, beta * 1.5);
      }
    } else if (Math.abs(b) > 1e-12) {
      // Linear
      const root = -c / b;
      minM = root - 4;
      maxM = root + 4;
    }

    // Ensure nice span
    if (maxM - minM < 4) {
      const mid = (minM + maxM) / 2;
      minM = mid - 2.5;
      maxM = mid + 2.5;
    }

    // Sample y values
    const steps = 100;
    const yVals: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const mVal = minM + (i / steps) * (maxM - minM);
      const yVal = a * mVal * mVal + b * mVal + c;
      yVals.push(yVal);
    }

    let minY = Math.min(0, ...yVals);
    let maxY = Math.max(0, ...yVals);

    // Padding for y
    const ySpan = Math.max(2, maxY - minY);
    minY -= ySpan * 0.15;
    maxY += ySpan * 0.15;

    return { mMin: minM, mMax: maxM, yMin: minY, yMax: maxY };
  }, [a, b, c, rootType, m1, m2]);

  // Coordinate transforms
  const toSvgX = (mVal: number) => padding.left + ((mVal - mMin) / (mMax - mMin)) * plotWidth;
  const toSvgY = (yVal: number) => padding.top + ((yMax - yVal) / (yMax - yMin)) * plotHeight;
  const fromSvgX = (px: number) => mMin + ((px - padding.left) / plotWidth) * (mMax - mMin);

  // Generate curve path data
  const curvePath = useMemo(() => {
    const points: string[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const mVal = mMin + (i / steps) * (mMax - mMin);
      const yVal = a * mVal * mVal + b * mVal + c;
      const px = toSvgX(mVal);
      const py = toSvgY(yVal);
      // clamp py to reasonable view bounds
      const clampedPy = Math.max(-50, Math.min(svgHeight + 50, py));
      points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${clampedPy.toFixed(2)}`);
    }
    return points.join(' ');
  }, [a, b, c, mMin, mMax, yMin, yMax]);

  // Zero axes positions
  const zeroY = toSvgY(0);
  const zeroX = toSvgX(0);

  // Nice tick values for m axis
  const mTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    const step = (mMax - mMin) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(mMin + i * step);
    }
    return ticks;
  }, [mMin, mMax]);

  // Nice tick values for y axis
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 4;
    const step = (yMax - yMin) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(yMin + i * step);
    }
    return ticks;
  }, [yMin, yMax]);

  // Mouse move handler for interactive coordinates
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (px >= padding.left && px <= svgWidth - padding.right) {
      const mVal = fromSvgX(px);
      const yVal = a * mVal * mVal + b * mVal + c;
      const py = toSvgY(yVal);
      setHoverPt({ m: mVal, y: yVal, px, py });
    } else {
      setHoverPt(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5">
      <div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0] pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-[#233746] tracking-tight">
            First Plot – Auxiliary Equation Curve
          </h3>
          <p className="text-xs text-[#477FA5] font-mono mt-0.5">
            y = {formatNum(a)}m² {b >= 0 ? '+' : '-'} {formatNum(Math.abs(b))}m {c >= 0 ? '+' : '-'} {formatNum(Math.abs(c))}
          </p>
        </div>

        {/* Legend / Status */}
        <div className="text-[11px] font-medium text-[#233746]/70 flex items-center gap-2">
          {rootType === 'distinct_real' && (
            <span className="flex items-center gap-1 text-[#2563EB]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              2 Real Roots
            </span>
          )}
          {rootType === 'repeated_real' && (
            <span className="flex items-center gap-1 text-[#059669]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              1 Repeated Root
            </span>
          )}
          {rootType === 'complex' && (
            <span className="flex items-center gap-1 text-[#D97706]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              No Real Intercepts (Δ &lt; 0)
            </span>
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
          {/* Background Grid Lines */}
          <g stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3">
            {mTicks.map((tick, i) => {
              const xPos = toSvgX(tick);
              return <line key={`gx-${i}`} x1={xPos} y1={padding.top} x2={xPos} y2={svgHeight - padding.bottom} />;
            })}
            {yTicks.map((tick, i) => {
              const yPos = toSvgY(tick);
              return <line key={`gy-${i}`} x1={padding.left} y1={yPos} x2={svgWidth - padding.right} y2={yPos} />;
            })}
          </g>

          {/* Coordinate Axes */}
          {/* m-Axis (y = 0) */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={svgWidth - padding.right}
            y2={zeroY}
            stroke="#64748B"
            strokeWidth="1.5"
          />
          {/* y-Axis (m = 0) */}
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

          {/* Axis Labels */}
          <text
            x={svgWidth - padding.right + 12}
            y={zeroY + 4}
            fill="#233746"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            m
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

          {/* m-axis Ticks & Numbers */}
          {mTicks.map((tick, i) => {
            const xPos = toSvgX(tick);
            return (
              <g key={`mtick-${i}`}>
                <line x1={xPos} y1={svgHeight - padding.bottom} x2={xPos} y2={svgHeight - padding.bottom + 4} stroke="#64748B" />
                <text
                  x={xPos}
                  y={svgHeight - padding.bottom + 16}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatNum(tick, 1)}
                </text>
              </g>
            );
          })}

          {/* y-axis Ticks & Numbers */}
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

          {/* The Parabola Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="#477FA5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Real Root Points (where curve crosses y = 0) */}
          {rootType === 'distinct_real' && (
            <>
              {/* Root 1 */}
              <circle
                cx={toSvgX(m1.real)}
                cy={zeroY}
                r="5.5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={toSvgX(m1.real)}
                y={zeroY - 10}
                fill="#1E40AF"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                m₁ = {formatNum(m1.real)}
              </text>

              {/* Root 2 */}
              <circle
                cx={toSvgX(m2.real)}
                cy={zeroY}
                r="5.5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={toSvgX(m2.real)}
                y={zeroY - 10}
                fill="#1E40AF"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                m₂ = {formatNum(m2.real)}
              </text>
            </>
          )}

          {/* Repeated Real Root */}
          {rootType === 'repeated_real' && (
            <>
              <circle
                cx={toSvgX(m1.real)}
                cy={zeroY}
                r="6"
                fill="#059669"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={toSvgX(m1.real)}
                y={zeroY - 12}
                fill="#065F46"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                m = {formatNum(m1.real)} (Double Root)
              </text>
            </>
          )}

          {/* Linear Degenerate Root */}
          {rootType === 'linear_degenerate' && Math.abs(b) > 1e-12 && (
            <>
              <circle
                cx={toSvgX(m1.real)}
                cy={zeroY}
                r="5.5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={toSvgX(m1.real)}
                y={zeroY - 10}
                fill="#1E40AF"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                m = {formatNum(m1.real)}
              </text>
            </>
          )}

          {/* Complex Roots Annotation */}
          {rootType === 'complex' && (
            <g transform={`translate(${svgWidth / 2}, ${padding.top + 20})`}>
              <rect
                x="-140"
                y="-14"
                width="280"
                height="26"
                rx="6"
                fill="#FEF3C7"
                stroke="#F59E0B"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3"
                fill="#92400E"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                No Real Intercepts: Roots are Complex (Δ &lt; 0)
              </text>
            </g>
          )}

          {/* Hover Crosshair and Tooltip */}
          {hoverPt && (
            <g>
              <line
                x1={hoverPt.px}
                y1={padding.top}
                x2={hoverPt.px}
                y2={svgHeight - padding.bottom}
                stroke="#477FA5"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle
                cx={hoverPt.px}
                cy={hoverPt.py}
                r="4"
                fill="#233746"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Coordinate Label Badge */}
        {hoverPt && (
          <div
            className="absolute bg-white/95 backdrop-blur-xs border border-[#E2E8F0] shadow-xs px-2 py-1 rounded text-[11px] font-mono text-[#233746] pointer-events-none"
            style={{
              left: Math.min(svgWidth - 110, Math.max(10, hoverPt.px - 45)),
              top: Math.max(10, hoverPt.py - 35),
            }}
          >
            m: {formatNum(hoverPt.m, 2)}, y: {formatNum(hoverPt.y, 2)}
          </div>
        )}
      </div>
    </div>
  );
};
