import React, { forwardRef } from 'react';

/**
 * Renders nodes and pointers for Linked Lists and Binary Trees.
 * Uses Circles for nodes and Arrows for pointer connections.
 */
export const PointerDiagramSVG = forwardRef(({ data }, ref) => {
  const { nodes = [], connections = [], highlighted = [] } = data || {};

  if (!nodes.length) return null;

  const nodeRadius = 25;
  const totalWidth = 800;
  const totalHeight = 300;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full h-auto bg-[#0d1117] rounded-xl border border-white/10 shadow-2xl"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#58a6ff" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x="20" y="35" fill="#58a6ff" fontSize="14" fontWeight="600" fontFamily="JetBrains Mono, monospace">
        ALGO_TRACE::POINTERS
      </text>

      {/* Render Connections (Arrows) */}
      {connections.map((conn, i) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return null;

        return (
          <line
            key={i}
            x1={fromNode.x} y1={fromNode.y}
            x2={toNode.x - (toNode.x > fromNode.x ? nodeRadius + 5 : -(nodeRadius + 5))}
            y2={toNode.y}
            stroke="#58a6ff"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            strokeDasharray={conn.dashed ? "5 3" : "0"}
          />
        );
      })}

      {/* Render Nodes (Circles) */}
      {nodes.map((node, i) => {
        const isHighlighted = highlighted.includes(node.id);
        return (
          <g key={node.id} filter={isHighlighted ? "url(#glow)" : ""}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill="#161b22"
              stroke={isHighlighted ? '#f85149' : '#58a6ff'}
              strokeWidth={isHighlighted ? "3" : "2"}
              className="transition-all duration-300"
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#e6edf3"
              fontSize="14"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
            >
              {node.value}
            </text>
            <text
              x={node.x}
              y={node.y + nodeRadius + 15}
              textAnchor="middle"
              fill="#8b949e"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
