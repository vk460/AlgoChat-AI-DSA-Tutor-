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

    const { algorithm, array, steps, target } = data;

    // --- SEARCHING ANIMATION (Nodes) ---
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

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) {
          clearInterval(interval);
          return;
        }

        const step = steps[currentStep];
        const { index, type } = step;

        if (index !== undefined) {
          nodes.filter((d, i) => i === index)
            .select(".node-rect")
            .transition()
            .duration(500)
            .attr("fill", type === 'found' ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.2)")
            .attr("stroke", type === 'found' ? "#22c55e" : "#ef4444");
        }

        currentStep++;
      }, 1000);

      return () => clearInterval(interval);
    }

    // --- SORTING ANIMATION (Bars) ---
    if (algorithm === 'bubble_sort' || algorithm === 'quick_sort' || algorithm === 'merge_sort') {
      const barPadding = 10;
      const barWidth = (width - margin.left - margin.right) / array.length - barPadding;
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(array)])
        .range([0, height - margin.top - margin.bottom]);

      const bars = svg.selectAll(".bar")
        .data(array.map((v, i) => ({ value: v, id: i })))
        .enter()
        .append("g")
        .attr("class", "bar")
        .attr("transform", (d, i) => `translate(${margin.left + i * (barWidth + barPadding)}, ${height - margin.bottom - yScale(d.value)})`);

      bars.append("rect")
        .attr("width", barWidth)
        .attr("height", d => yScale(d.value))
        .attr("rx", 4)
        .attr("fill", "#3b82f6")
        .attr("fill-opacity", 0.6)
        .attr("stroke", "#3b82f6")
        .attr("class", "bar-rect");

      bars.append("text")
        .attr("x", barWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", "10px")
        .text(d => d.value);

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) {
          clearInterval(interval);
          return;
        }

        const step = steps[currentStep];
        const { type, i, j, array: stepArray, sortedIndices } = step;

        if (type === 'compare' || type === 'swap') {
            bars.selectAll(".bar-rect")
                .transition().duration(200)
                .attr("fill", "#3b82f6")
                .attr("stroke", "#3b82f6");

            bars.filter((d, idx) => idx === i || idx === j)
                .select(".bar-rect")
                .transition().duration(200)
                .attr("fill", type === 'swap' ? "#ef4444" : "#f59e0b")
                .attr("stroke", type === 'swap' ? "#ef4444" : "#f59e0b");
        }

        if (type === 'swap' && stepArray) {
            bars.each(function(d, idx) {
                const newValue = stepArray[idx];
                d3.select(this).select(".bar-rect")
                    .transition().duration(500)
                    .attr("height", yScale(newValue));
                d3.select(this).select("text")
                    .text(newValue);
                d3.select(this)
                    .transition().duration(500)
                    .attr("transform", `translate(${margin.left + idx * (barWidth + barPadding)}, ${height - margin.bottom - yScale(newValue)})`);
            });
        }

        if (sortedIndices) {
            bars.filter((d, idx) => sortedIndices.includes(idx))
                .select(".bar-rect")
                .transition().duration(500)
                .attr("fill", "#22c55e")
                .attr("stroke", "#22c55e");
        }

        currentStep++;
      }, 800);

      return () => clearInterval(interval);
    }

    // --- BST ANIMATION (Trees) ---
    if (algorithm === 'bst' && data.treeData) {
      const hierarchy = d3.hierarchy(data.treeData);
      const treeLayout = d3.tree().size([width - 100, height - 120]);
      treeLayout(hierarchy);

      const g = svg.append("g").attr("transform", "translate(50, 60)");

      const links = g.selectAll(".link")
        .data(hierarchy.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr("fill", "none")
        .attr("stroke", "rgba(59, 130, 246, 0.2)")
        .attr("stroke-width", 2);

      const nodes = g.selectAll(".node")
        .data(hierarchy.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

      nodes.append("circle")
        .attr("r", 20)
        .attr("fill", "rgba(15, 23, 42, 0.9)")
        .attr("stroke", "rgba(59, 130, 246, 0.4)")
        .attr("stroke-width", 2)
        .attr("class", "node-circle");

      nodes.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .text(d => d.data.value);

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) {
          clearInterval(interval);
          return;
        }

        const step = steps[currentStep];
        const { nodeId, path, type } = step;

        // Reset highlights
        nodes.selectAll(".node-circle")
          .transition().duration(200)
          .attr("stroke", "rgba(59, 130, 246, 0.4)")
          .attr("fill", "rgba(15, 23, 42, 0.9)");

        // Highlight path
        if (path) {
          nodes.filter(d => path.includes(d.data.id))
            .select(".node-circle")
            .attr("stroke", "#60a5fa")
            .attr("fill", "rgba(59, 130, 246, 0.1)");
        }

        // Highlight current node
        if (nodeId !== undefined) {
          nodes.filter(d => d.data.id === nodeId)
            .select(".node-circle")
            .transition().duration(300)
            .attr("stroke", type === 'insert' ? "#22c55e" : "#f59e0b")
            .attr("fill", type === 'insert' ? "rgba(34, 197, 94, 0.2)" : "rgba(245, 158, 11, 0.2)");
        }

        currentStep++;
      }, 1000);

      return () => clearInterval(interval);
    }

    // --- FALLBACK ---
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
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">D3 Engine Active</span>
      </div>
    </div>
  );
}
