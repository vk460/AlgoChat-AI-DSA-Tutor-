import React, { forwardRef } from 'react';

/**
 * Renders a step-by-step array visualization for algorithms like 
 * Binary Search, Sorting, or Sliding Window.
 * Uses real SVG shapes (Rectangles for cells, Circles for pointers).
 */
export const ArrayTraceSVG = forwardRef(({ data }, ref) => {
  const { array = [], steps = [], eliminated = [] } = data || {};
  
  if (!array.length) return null;

  const cellW = 60;
  const cellH = 45;
  const startX = 50;
  const startY = 80;
  const totalWidth = Math.max(array.length * cellW + 100, 600);
  const totalHeight = steps.length * 100 + 150;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full h-auto bg-[#0d1117] rounded-xl border border-white/10 shadow-2xl"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Header */}
      <text x="20" y="35" fill="#58a6ff" fontSize="14" fontWeight="600" fontFamily="JetBrains Mono, monospace">
        ALGO_TRACE::ARRAY
      </text>

      {/* Main Array Cells */}
      {array.map((val, i) => {
        const isEliminated = eliminated.includes(i);
        return (
          <g key={i} filter="url(#shadow)">
            <rect
              x={startX + i * cellW}
              y={startY}
              width={cellW - 5}
              height={cellH}
              rx="6"
              fill={isEliminated ? '#1c2128' : '#161b22'}
              stroke={isEliminated ? '#30363d' : '#58a6ff'}
              strokeWidth="2"
              className="transition-all duration-500"
            />
            <text
              x={startX + i * cellW + (cellW - 5) / 2}
              y={startY + cellH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isEliminated ? '#484f58' : '#e6edf3'}
              fontSize="16"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {val}
            </text>
            <text
              x={startX + i * cellW + (cellW - 5) / 2}
              y={startY + cellH + 15}
              textAnchor="middle"
              fill="#8b949e"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              idx:{i}
            </text>
          </g>
        );
      })}

      {/* Step Visualization (Pointers & Labels) */}
      {steps.map((step, si) => {
        const yPos = startY + cellH + 60 + si * 90;
        return (
          <g key={si}>
            <text x="20" y={yPos} fill="#d29922" fontSize="12" fontWeight="600" fontFamily="JetBrains Mono, monospace">
              STEP_{si + 1}:
            </text>
            
            {/* Render Pointers */}
            {Object.entries(step.pointers || {}).map(([name, idx], pi) => {
              const colors = { left: '#3fb950', right: '#f85149', mid: '#58a6ff' };
              const targetX = startX + idx * cellW + (cellW - 5) / 2;
              return (
                <g key={name}>
                  <line 
                    x1={targetX} y1={yPos + 5} 
                    x2={targetX} y2={startY + cellH + 5} 
                    stroke={colors[name] || '#8b949e'} 
                    strokeWidth="1.5" strokeDasharray="4 2" 
                  />
                  <circle 
                    cx={targetX} cy={yPos + 15} r="10" 
                    fill={colors[name] || '#8b949e'} opacity="0.2" 
                    stroke={colors[name] || '#8b949e'} strokeWidth="1.5"
                  />
                  <text 
                    x={targetX} y={yPos + 15} textAnchor="middle" dominantBaseline="central" 
                    fill={colors[name] || '#8b949e'} fontSize="9" fontWeight="800"
                  >
                    {name[0].toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Step Explanation */}
            <text x="70" y={yPos} fill="#8b949e" fontSize="12" fontFamily="Inter, sans-serif italic">
              {step.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
