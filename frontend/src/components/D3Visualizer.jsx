import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function D3Visualizer({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const { algorithm, array, target, steps } = data;

    if (algorithm === 'linear_search' || algorithm === 'binary_search') {
      const nodeWidth = 50;
      const nodeHeight = 50;
      const spacing = 10;
      const startX = (width - (array.length * (nodeWidth + spacing))) / 2;
      const startY = height / 2 - nodeHeight / 2;

      const nodes = svg.selectAll(".node")
        .data(array)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d, i) => `translate(${startX + i * (nodeWidth + spacing)}, ${startY})`);

      nodes.append("rect")
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 8)
        .attr("fill", "rgba(255, 255, 255, 0.05)")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("class", "node-rect");

      nodes.append("text")
        .attr("x", nodeWidth / 2)
        .attr("y", nodeHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-family", "JetBrains Mono")
        .text(d => d);

      // Target Label
      svg.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .attr("fill", "#60a5fa")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`Target: ${target}`);

      // Animate Steps
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) {
          clearInterval(interval);
          return;
        }

        const step = steps[currentStep];
        const { index, result } = step;

        nodes.filter((d, i) => i === index)
          .select(".node-rect")
          .transition()
          .duration(500)
          .attr("fill", result === 'found' ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.2)")
          .attr("stroke", result === 'found' ? "#22c55e" : "#ef4444");

        currentStep++;
      }, 1000);

      return () => clearInterval(interval);
    }
    
    // Fallback for unknown algorithm types
    svg.append("text")
      .attr("x", width/2)
      .attr("y", height/2)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .text(`Visualizing ${algorithm || 'Algorithm'}...`);

  }, [data]);

  return (
    <div className="w-full h-full bg-black/20 rounded-xl border border-white/10 overflow-hidden relative">
      <svg 
        ref={svgRef} 
        viewBox="0 0 600 400" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      />
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Simulation</span>
      </div>
    </div>
  );
}
