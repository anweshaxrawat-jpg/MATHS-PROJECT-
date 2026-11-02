/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  display?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ math, display = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return `<span class="font-mono text-sm">${math}</span>`;
    }
  }, [math, display]);

  if (display) {
    return (
      <div
        className={`overflow-x-auto py-1 my-0.5 text-[#233746] ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block text-[#233746] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
