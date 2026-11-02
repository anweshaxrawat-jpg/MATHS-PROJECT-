/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MathView } from './components/MathView';
import { AuxiliaryEquationPlot } from './components/AuxiliaryEquationPlot';
import { RootBehaviourPlot } from './components/RootBehaviourPlot';
import { solvePDE, formatNum } from './utils/pdeSolver';
import { PDESolution } from './types';
import { Play, AlertCircle } from 'lucide-react';

export default function App() {
  // Input fields default: a = 1, b = 0, c = -1
  const [aInput, setAInput] = useState<string>('1');
  const [bInput, setBInput] = useState<string>('0');
  const [cInput, setCInput] = useState<string>('-1');

  // Parse numerical inputs
  const aNum = useMemo(() => {
    const val = parseFloat(aInput);
    return isNaN(val) ? 0 : val;
  }, [aInput]);

  const bNum = useMemo(() => {
    const val = parseFloat(bInput);
    return isNaN(val) ? 0 : val;
  }, [bInput]);

  const cNum = useMemo(() => {
    const val = parseFloat(cInput);
    return isNaN(val) ? 0 : val;
  }, [cInput]);

  // Solution state: initialized with default values (a=1, b=0, c=-1)
  const [solution, setSolution] = useState<PDESolution>(() => solvePDE(1, 0, -1));

  // Explicit Analyze action
  const handleAnalyze = useCallback(() => {
    setSolution(solvePDE(aNum, bNum, cNum));
  }, [aNum, bNum, cNum]);

  // Live auto-update when inputs change
  const handleAChange = (val: string) => {
    setAInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setSolution(solvePDE(parsed, bNum, cNum));
    }
  };

  const handleBChange = (val: string) => {
    setBInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setSolution(solvePDE(aNum, parsed, cNum));
    }
  };

  const handleCChange = (val: string) => {
    setCInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setSolution(solvePDE(aNum, bNum, parsed));
    }
  };

  // PDE equation representation with current inputs
  const pdeSubstitutedLatex = useMemo(() => {
    const aStr = isNaN(aNum) ? 'a' : formatNum(aNum);
    const bStr = isNaN(bNum) ? 'b' : formatNum(bNum);
    const cStr = isNaN(cNum) ? 'c' : formatNum(cNum);
    return `(${aStr})\\,z_{xx} + (${bStr})\\,z_{xy} + (${cStr})\\,z_{yy} = 0`;
  }, [aNum, bNum, cNum]);

  // Classification Badge styling: Hyperbolic = Blue, Parabolic = Green, Elliptic = Orange
  const classificationBadge = useMemo(() => {
    if (solution.classification === 'Hyperbolic') {
      return {
        label: 'Hyperbolic',
        colorClass: 'bg-blue-100 text-blue-800 border-2 border-blue-300',
        dotColor: 'bg-blue-600',
        condition: 'Δ > 0',
      };
    } else if (solution.classification === 'Parabolic') {
      return {
        label: 'Parabolic',
        colorClass: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300',
        dotColor: 'bg-emerald-600',
        condition: 'Δ = 0',
      };
    } else if (solution.classification === 'Elliptic') {
      return {
        label: 'Elliptic',
        colorClass: 'bg-amber-100 text-amber-900 border-2 border-amber-300',
        dotColor: 'bg-amber-600',
        condition: 'Δ < 0',
      };
    } else {
      return {
        label: solution.classification,
        colorClass: 'bg-slate-100 text-slate-800 border-2 border-slate-300',
        dotColor: 'bg-slate-600',
        condition: 'Degenerate',
      };
    }
  }, [solution.classification]);

  const isAZero = Math.abs(aNum) < 1e-12;
  const isAllZero = isAZero && Math.abs(bNum) < 1e-12 && Math.abs(cNum) < 1e-12;

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#233746] flex flex-col font-sans">
      {/* 1. Header */}
      <Header />

      {/* Main Container: 2-Panel Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT PANEL: INPUT ================= */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6">
            <div className="border-b border-[#E2E8F0] pb-4 mb-5">
              <h2 className="text-base font-bold text-[#233746] tracking-tight">
                Input Coefficients
              </h2>
              <p className="text-xs text-[#477FA5] mt-0.5">
                Second-order homogeneous linear PDE
              </p>
            </div>

            {/* PDE Being Analyzed */}
            <div className="p-4 bg-[#F7F9F8] rounded-lg border border-[#E2E8F0] text-center mb-5">
              <div className="text-[11px] text-[#477FA5] font-semibold uppercase tracking-wider mb-1">
                PDE Under Analysis
              </div>
              <div className="text-base sm:text-lg py-1 font-serif">
                <MathView math="a\,z_{xx} + b\,z_{xy} + c\,z_{yy} = 0" display={true} />
              </div>
              <div className="text-[11px] text-[#233746]/60 mt-1 font-mono">
                <MathView math={pdeSubstitutedLatex} />
              </div>
            </div>

            {/* Input fields for a, b, c */}
            <div className="space-y-4 mb-5">
              {/* Coefficient a */}
              <div>
                <label className="block text-xs font-semibold text-[#233746] mb-1.5 flex items-center justify-between">
                  <span>Coefficient a (for z_xx)</span>
                  <span className="font-mono text-[11px] text-[#477FA5]">default: 1</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={aInput}
                  onChange={(e) => handleAChange(e.target.value)}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F8] border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#233746] focus:bg-white focus:outline-none focus:border-[#477FA5] focus:ring-1 focus:ring-[#477FA5] transition-colors"
                />
              </div>

              {/* Coefficient b */}
              <div>
                <label className="block text-xs font-semibold text-[#233746] mb-1.5 flex items-center justify-between">
                  <span>Coefficient b (for z_xy)</span>
                  <span className="font-mono text-[11px] text-[#477FA5]">default: 0</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={bInput}
                  onChange={(e) => handleBChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F8] border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#233746] focus:bg-white focus:outline-none focus:border-[#477FA5] focus:ring-1 focus:ring-[#477FA5] transition-colors"
                />
              </div>

              {/* Coefficient c */}
              <div>
                <label className="block text-xs font-semibold text-[#233746] mb-1.5 flex items-center justify-between">
                  <span>Coefficient c (for z_yy)</span>
                  <span className="font-mono text-[11px] text-[#477FA5]">default: -1</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={cInput}
                  onChange={(e) => handleCChange(e.target.value)}
                  placeholder="-1"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F8] border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#233746] focus:bg-white focus:outline-none focus:border-[#477FA5] focus:ring-1 focus:ring-[#477FA5] transition-colors"
                />
              </div>
            </div>

            {/* Warnings for Special Cases */}
            {isAZero && !isAllZero && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Special Case (a = 0):</strong> The auxiliary equation reduces to the linear equation <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded">{bNum}m + {cNum} = 0</code>.
                </div>
              </div>
            )}

            {isAllZero && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Invalid Input:</strong> All coefficients are zero (0 = 0). Please enter non-zero values.
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#477FA5] hover:bg-[#3B6B8C] text-white text-sm font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Analyze</span>
            </button>
          </div>

          {/* ================= RIGHT PANEL: RESULTS ================= */}
          <div className="lg:col-span-8 space-y-5">
            {/* A. PDE Classification */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5">
              <div className="text-xs text-[#72AFA8] font-semibold uppercase tracking-wider mb-2">
                A. PDE Classification
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Prominent coloured badge */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base font-bold shadow-2xs ${classificationBadge.colorClass}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${classificationBadge.dotColor}`} />
                    <span>{classificationBadge.label}</span>
                  </span>
                  <span className="text-xs font-mono text-[#233746]/70">
                    ({classificationBadge.condition})
                  </span>
                </div>

                {/* Discriminant Calculation Display */}
                <div className="bg-[#F7F9F8] px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-mono text-[#233746]">
                  <span className="text-[#477FA5] font-semibold">Discriminant: </span>
                  <MathView math={solution.discriminantLatex} />
                </div>
              </div>
            </div>

            {/* B. Auxiliary Equation */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5">
              <div className="text-xs text-[#72AFA8] font-semibold uppercase tracking-wider mb-2">
                B. Auxiliary Equation
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F9F8] p-4 rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-xs text-[#233746]/60 font-medium">Standard Form: </span>
                  <span className="text-sm font-serif text-[#233746] font-medium ml-1">
                    <MathView math="am^2 + bm + c = 0" />
                  </span>
                </div>
                <div className="text-base sm:text-xl font-bold text-[#233746]">
                  <MathView math={solution.auxiliaryEquationLatex} />
                </div>
              </div>
            </div>

            {/* C. Roots */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5">
              <div className="text-xs text-[#72AFA8] font-semibold uppercase tracking-wider mb-2">
                C. Calculated Roots
              </div>
              <div className="bg-[#F7F9F8] p-4 rounded-lg border border-[#E2E8F0] mb-3 text-center">
                <div className="text-base sm:text-lg font-bold text-[#233746]">
                  <MathView math={solution.rootsLatex} display={true} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#F7F9F8] rounded-md border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#233746]/70 font-medium">First Root (m₁)</span>
                  <span className="font-mono font-semibold text-[#233746]">
                    <MathView math={solution.m1.displayLatex} />
                  </span>
                </div>
                <div className="p-2.5 bg-[#F7F9F8] rounded-md border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#233746]/70 font-medium">Second Root (m₂)</span>
                  <span className="font-mono font-semibold text-[#233746]">
                    <MathView math={solution.m2.displayLatex} />
                  </span>
                </div>
              </div>
            </div>

            {/* D. First Plot – Auxiliary Equation */}
            <div className="space-y-1">
              <div className="text-xs text-[#72AFA8] font-semibold uppercase tracking-wider px-1">
                D. Auxiliary Equation Plot
              </div>
              <AuxiliaryEquationPlot solution={solution} />
            </div>

            {/* E. Second Plot – Root Behaviour */}
            <div className="space-y-1">
              <div className="text-xs text-[#72AFA8] font-semibold uppercase tracking-wider px-1">
                E. Root Behaviour Plot
              </div>
              <RootBehaviourPlot solution={solution} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E2E8F0] bg-white py-4 text-xs text-[#233746]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-medium text-[#233746]">
            PDE Root Analyzer <span className="text-[#477FA5]">·</span> Auxiliary Equation &amp; Root Behaviour
          </div>
          <div className="text-[11px] font-mono text-[#233746]/50">
            az_xx + bz_xy + cz_yy = 0
          </div>
        </div>
      </footer>
    </div>
  );
}
