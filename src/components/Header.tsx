/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#477FA5] flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#233746] tracking-tight leading-tight">
              PDE Root Analyzer
            </h1>
            <p className="text-xs text-[#477FA5] font-medium leading-none">
              Auxiliary Equation &amp; Root Behaviour
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
