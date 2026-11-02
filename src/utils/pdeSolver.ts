/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDESolution, RootValue } from '../types';

/**
 * Format a number cleanly for LaTeX and plain text display.
 */
export function formatNum(n: number, maxDecimals: number = 4): string {
  if (Math.abs(n) < 1e-12) return '0';
  if (Number.isInteger(n)) return n.toString();
  
  const rounded = Math.round(n * 1000) / 1000;
  if (Math.abs(rounded - n) < 1e-6) {
    return rounded.toString();
  }
  return n.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Format quadratic auxiliary equation: am^2 + bm + c = 0
 */
export function formatAuxEquation(a: number, b: number, c: number): string {
  const parts: string[] = [];

  // a*m^2 term
  if (Math.abs(a) > 1e-12) {
    if (a === 1) parts.push('m^2');
    else if (a === -1) parts.push('-m^2');
    else parts.push(`${formatNum(a)}m^2`);
  }

  // b*m term
  if (Math.abs(b) > 1e-12) {
    const sign = parts.length > 0 ? (b > 0 ? '+' : '-') : (b < 0 ? '-' : '');
    const absB = Math.abs(b);
    const bStr = absB === 1 ? 'm' : `${formatNum(absB)}m`;
    parts.push(parts.length > 0 ? `${sign} ${bStr}` : `${sign}${bStr}`);
  }

  // c constant term
  if (Math.abs(c) > 1e-12 || parts.length === 0) {
    const sign = parts.length > 0 ? (c > 0 ? '+' : '-') : (c < 0 ? '-' : '');
    const absC = Math.abs(c);
    const cStr = formatNum(absC);
    parts.push(parts.length > 0 ? `${sign} ${cStr}` : `${sign}${cStr}`);
  }

  return `${parts.join(' ')} = 0`;
}

/**
 * Solve homogeneous 2nd order linear PDE with constant coefficients:
 * a * z_xx + b * z_xy + c * z_yy = 0
 */
export function solvePDE(a: number, b: number, c: number): PDESolution {
  // Edge case 1: All zero
  if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) {
    return {
      a, b, c,
      discriminant: 0,
      rootType: 'trivial',
      classification: 'Degenerate',
      m1: { real: 0, imag: 0, displayLatex: 'm \\in \\mathbb{C}', displayPlain: 'Any m' },
      m2: { real: 0, imag: 0, displayLatex: 'm \\in \\mathbb{C}', displayPlain: 'Any m' },
      auxiliaryEquationLatex: '0 = 0',
      discriminantLatex: '\\Delta = 0',
      rootsLatex: '\\text{Trivial equation } 0 = 0',
      isValid: false,
      errorMessage: 'All coefficients are zero. Please enter non-zero values.',
    };
  }

  // Edge case 2: a = 0 (linear auxiliary equation bm + c = 0)
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) {
      // a = 0, b = 0, c != 0
      return {
        a, b, c,
        discriminant: 0,
        rootType: 'linear_degenerate',
        classification: 'Degenerate',
        m1: { real: 0, imag: 0, displayLatex: '\\text{None}', displayPlain: 'None' },
        m2: { real: 0, imag: 0, displayLatex: '\\text{None}', displayPlain: 'None' },
        auxiliaryEquationLatex: `${formatNum(c)} = 0`,
        discriminantLatex: '\\Delta = 0',
        rootsLatex: '\\text{No auxiliary roots (equation is of order 0 in } m\\text{)}',
        isValid: true,
        errorMessage: 'a = 0 and b = 0: equation contains only y-derivatives (cz_{yy} = 0).',
      };
    }

    // bm + c = 0 => m = -c / b
    const mSingle = -c / b;
    const mStr = formatNum(mSingle);
    return {
      a, b, c,
      discriminant: b * b,
      rootType: 'linear_degenerate',
      classification: 'Hyperbolic',
      m1: { real: mSingle, imag: 0, displayLatex: `m = ${mStr}`, displayPlain: `m = ${mStr}` },
      m2: { real: mSingle, imag: 0, displayLatex: `m = ${mStr}`, displayPlain: `m = ${mStr}` },
      auxiliaryEquationLatex: `${formatNum(b)}m ${c >= 0 ? '+' : '-'} ${formatNum(Math.abs(c))} = 0`,
      discriminantLatex: `\\Delta = b^2 = ${formatNum(b * b)} > 0`,
      rootsLatex: `m = -\\frac{c}{b} = ${mStr}`,
      isValid: true,
    };
  }

  // Standard case: a != 0
  const auxEquationLatex = formatAuxEquation(a, b, c);
  const disc = b * b - 4 * a * c;
  const discStr = formatNum(disc);

  let rootType: PDESolution['rootType'];
  let classification: PDESolution['classification'];
  let m1: RootValue;
  let m2: RootValue;
  let rootsLatex: string;

  if (disc > 1e-12) {
    // Delta > 0: Hyperbolic (Distinct real roots)
    rootType = 'distinct_real';
    classification = 'Hyperbolic';
    const sqrtDisc = Math.sqrt(disc);
    const r1 = (-b + sqrtDisc) / (2 * a);
    const r2 = (-b - sqrtDisc) / (2 * a);
    const r1Str = formatNum(r1);
    const r2Str = formatNum(r2);

    m1 = { real: r1, imag: 0, displayLatex: `m_1 = ${r1Str}`, displayPlain: `m1 = ${r1Str}` };
    m2 = { real: r2, imag: 0, displayLatex: `m_2 = ${r2Str}`, displayPlain: `m2 = ${r2Str}` };
    rootsLatex = `m_1 = ${r1Str}, \\quad m_2 = ${r2Str}`;

  } else if (Math.abs(disc) <= 1e-12) {
    // Delta = 0: Parabolic (Repeated real roots)
    rootType = 'repeated_real';
    classification = 'Parabolic';
    const r = -b / (2 * a);
    const rStr = formatNum(r);

    m1 = { real: r, imag: 0, displayLatex: `m_1 = ${rStr}`, displayPlain: `m1 = ${rStr}` };
    m2 = { real: r, imag: 0, displayLatex: `m_2 = ${rStr}`, displayPlain: `m2 = ${rStr}` };
    rootsLatex = `m_1 = m_2 = m = ${rStr}`;

  } else {
    // Delta < 0: Elliptic (Complex conjugate roots)
    rootType = 'complex';
    classification = 'Elliptic';
    const alpha = -b / (2 * a);
    const beta = Math.sqrt(-disc) / (2 * Math.abs(a));
    const alphaStr = formatNum(alpha);
    const betaStr = formatNum(beta);

    m1 = { 
      real: alpha, 
      imag: beta, 
      displayLatex: `m_1 = ${alphaStr} + ${betaStr}i`, 
      displayPlain: `m1 = ${alphaStr} + ${betaStr}i` 
    };
    m2 = { 
      real: alpha, 
      imag: -beta, 
      displayLatex: `m_2 = ${alphaStr} - ${betaStr}i`, 
      displayPlain: `m2 = ${alphaStr} - ${betaStr}i` 
    };

    if (Math.abs(alpha) < 1e-12) {
      rootsLatex = `m = \\pm ${betaStr}i`;
    } else {
      rootsLatex = `m = ${alphaStr} \\pm ${betaStr}i`;
    }
  }

  return {
    a,
    b,
    c,
    discriminant: disc,
    rootType,
    classification,
    m1,
    m2,
    auxiliaryEquationLatex: auxEquationLatex,
    discriminantLatex: `\\Delta = b^2 - 4ac = ${discStr}`,
    rootsLatex,
    isValid: true,
  };
}
