/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RootType = 
  | 'distinct_real' 
  | 'repeated_real' 
  | 'complex' 
  | 'linear_degenerate' 
  | 'trivial';

export type PDEClassification = 
  | 'Hyperbolic' 
  | 'Parabolic' 
  | 'Elliptic' 
  | 'Degenerate';

export interface RootValue {
  real: number;
  imag: number;
  displayLatex: string;
  displayPlain: string;
}

export interface PDESolution {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  rootType: RootType;
  classification: PDEClassification;
  m1: RootValue;
  m2: RootValue;
  auxiliaryEquationLatex: string;
  discriminantLatex: string;
  rootsLatex: string;
  isValid: boolean;
  errorMessage?: string;
}
