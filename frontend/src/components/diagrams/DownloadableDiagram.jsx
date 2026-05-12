import React, { useRef } from 'react';
import { ArrayTraceSVG } from './ArrayTraceSVG';
import { PointerDiagramSVG } from './PointerDiagramSVG';

/**
 * Wraps a diagram and provides a "Save as PNG" button.
 * Uses a Canvas trick to convert SVG to a high-resolution image.
 */
export const DownloadableDiagram = ({ type, data }) => {
  const svgRef = useRef(null);

  const downloadPNG = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set high resolution
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;

    img.onload = () => {
      // Draw background
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `AlgoChat_Diagram_${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="relative group my-6 border border-white/5 rounded-2xl overflow-hidden bg-[#0d1117]/50 backdrop-blur-xl">
      <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
          Visual Aid: {type.replace('_', ' ')}
        </span>
        <button
          onClick={downloadPNG}
          className="text-[10px] flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300 font-bold border border-blue-500/20"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          SAVE PNG
        </button>
      </div>

      <div className="p-4">
        {type === 'array_trace' && <ArrayTraceSVG ref={svgRef} data={data} />}
        {type === 'pointer_diagram' && <PointerDiagramSVG ref={svgRef} data={data} />}
      </div>
    </div>
  );
};
