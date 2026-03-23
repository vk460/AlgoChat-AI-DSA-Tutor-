import { useEffect, useRef } from "react";
import * as d3 from "d3";

/*
  ArrayRenderer — D3 SVG visualizer for array-based algorithms.
  Props:
    data        – full algorithm data ({ algorithm, array, steps })
    stepIndex   – current step index
*/
export default function ArrayRenderer({ data, stepIndex }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const step = data?.steps?.[stepIndex];
  const algo = data?.algorithm || "";
  const isSearch = algo.includes("search");
  const displayArray = isSearch ? data.array : (step?.array || data.array);

  useEffect(() => {
    if (!containerRef.current || !displayArray) return;

    const container = containerRef.current;
    const { width: W } = container.getBoundingClientRect();
    const H = 340;
    const n = displayArray.length;
    const maxVal = Math.max(...displayArray, 1);

    const gap = Math.max(4, Math.min(12, W / n * 0.15));
    const barW = Math.max(16, Math.min(56, (W - gap * (n + 1)) / n));
    const totalW = n * barW + (n - 1) * gap;
    const offsetX = (W - totalW) / 2;
    const barArea = H - 90; // leave room for top labels and bottom indices

    let svg = d3.select(svgRef.current);
    if (svg.empty()) {
      svg = d3.select(container).append("svg");
      svgRef.current = svg.node();
    }
    svg.attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);

    // ---------- DATA JOIN ----------
    const bars = svg.selectAll(".bar-group").data(displayArray, (d, i) => i);

    // ENTER
    const enter = bars.enter().append("g").attr("class", "bar-group");
    enter.append("rect").attr("class", "bar-rect").attr("rx", 6);
    enter.append("text").attr("class", "bar-value");
    enter.append("text").attr("class", "bar-index");

    // MERGE
    const merged = enter.merge(bars);

    merged
      .transition()
      .duration(350)
      .attr("transform", (d, i) => `translate(${offsetX + i * (barW + gap)}, 0)`);

    // Bar rect
    merged
      .select(".bar-rect")
      .transition()
      .duration(350)
      .attr("x", 0)
      .attr("width", barW)
      .attr("y", (d) => 50 + barArea - (d / maxVal) * barArea)
      .attr("height", (d) => (d / maxVal) * barArea)
      .attr("fill", (d, i) => getColor(i, step, algo))
      .attr("stroke", (d, i) => getStroke(i, step, algo))
      .attr("stroke-width", 2);

    // Value label on top of bar
    merged
      .select(".bar-value")
      .transition()
      .duration(350)
      .attr("x", barW / 2)
      .attr("y", (d) => 50 + barArea - (d / maxVal) * barArea - 8)
      .attr("text-anchor", "middle")
      .attr("fill", (d, i) => {
        if (step?.type === "swap" && (step.i === i || step.j === i)) return "#f59e0b";
        return "#e2e8f0";
      })
      .attr("font-size", Math.min(14, barW * 0.4))
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", 700)
      .text((d) => d);

    // Index label below
    merged
      .select(".bar-index")
      .attr("x", barW / 2)
      .attr("y", H - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", 10)
      .attr("font-family", "JetBrains Mono, monospace")
      .text((d, i) => i);

    // EXIT
    bars.exit().remove();

    // ---------- SWAP ARROW ----------
    svg.selectAll(".swap-indicator").remove();
    if (step?.type === "swap") {
      const x1 = offsetX + step.i * (barW + gap) + barW / 2;
      const x2 = offsetX + step.j * (barW + gap) + barW / 2;
      const arrowY = H - 22;

      // Curved path between the two bars
      const midX = (x1 + x2) / 2;
      const curveY = arrowY + 18;

      const g = svg.append("g").attr("class", "swap-indicator");

      // Arc between the two positions
      g.append("path")
        .attr("d", `M ${x1} ${arrowY} Q ${midX} ${curveY} ${x2} ${arrowY}`)
        .attr("fill", "none")
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0)
        .transition()
        .duration(200)
        .attr("opacity", 1);

      // Arrows at both ends
      [x1, x2].forEach((x) => {
        g.append("polygon")
          .attr("points", `${x},${arrowY - 3} ${x - 4},${arrowY + 4} ${x + 4},${arrowY + 4}`)
          .attr("fill", "#f59e0b")
          .attr("opacity", 0)
          .transition()
          .duration(200)
          .attr("opacity", 1);
      });

      // SWAP label
      g.append("text")
        .attr("x", midX)
        .attr("y", curveY + 14)
        .attr("text-anchor", "middle")
        .attr("fill", "#f59e0b")
        .attr("font-size", 11)
        .attr("font-weight", 800)
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("opacity", 0)
        .text("SWAP ↔")
        .transition()
        .duration(200)
        .attr("opacity", 1);
    }

    // ---------- POINTER OVERLAYS (search) ----------
    svg.selectAll(".pointer-label").remove();
    if (isSearch && step) {
      if (step.type === "range") {
        addPointer(svg, step.lo, "lo", "#f59e0b", offsetX, barW, gap, H);
        addPointer(svg, step.hi, "hi", "#f59e0b", offsetX, barW, gap, H);
        addPointer(svg, step.mid, "mid", "#3b82f6", offsetX, barW, gap, H);
      }
      if (step.type === "compare") {
        addPointer(svg, step.index, "▼", "#f59e0b", offsetX, barW, gap, 58);
      }
      if (step.type === "found") {
        addPointer(svg, step.index, "✓", "#22c55e", offsetX, barW, gap, 58);
      }
    }

    // Target label
    svg.selectAll(".target-label").remove();
    if (isSearch && data.target !== undefined) {
      svg
        .append("text")
        .attr("class", "target-label")
        .attr("x", 16)
        .attr("y", 24)
        .attr("fill", "#60a5fa")
        .attr("font-size", 14)
        .attr("font-weight", 700)
        .attr("font-family", "JetBrains Mono, monospace")
        .text(`Target: ${data.target}`);
    }

  }, [displayArray, stepIndex, step, data]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[340px] relative"
    />
  );
}

// ---------- Color helpers ----------
function getColor(idx, step, algo) {
  if (!step) return "rgba(148, 163, 184, 0.15)";
  const isSearch = algo.includes("search");

  if (step.type === "done" || step.sortedIndices?.includes(idx))
    return "rgba(34, 197, 94, 0.35)";
  if (step.type === "found" && step.index === idx)
    return "rgba(34, 197, 94, 0.5)";
  if (step.type === "not-found")
    return "rgba(239, 68, 68, 0.15)";

  if (isSearch) {
    if (step.type === "compare" && step.index === idx) return "rgba(245, 158, 11, 0.4)";
    if (step.type === "range" && step.mid === idx) return "rgba(59, 130, 246, 0.4)";
    if (step.type === "range" && (step.lo === idx || step.hi === idx)) return "rgba(245, 158, 11, 0.2)";
    return "rgba(148, 163, 184, 0.15)";
  }

  if (step.type === "pivot" && step.index === idx) return "rgba(168, 85, 247, 0.5)";
  if (step.type === "pivot-place" && step.index === idx) return "rgba(34, 197, 94, 0.5)";
  if (step.type === "compare" && (step.i === idx || step.j === idx)) return "rgba(59, 130, 246, 0.4)";
  if (step.type === "swap" && (step.i === idx || step.j === idx)) return "rgba(245, 158, 11, 0.5)";
  if (step.type === "merge-compare" && (step.leftIdx === idx || step.rightIdx === idx)) return "rgba(59, 130, 246, 0.35)";
  if (step.type === "merge-place" && step.index === idx) return "rgba(34, 197, 94, 0.35)";
  if (step.type === "sorted" && step.sortedIndices?.includes(idx)) return "rgba(34, 197, 94, 0.35)";

  return "rgba(148, 163, 184, 0.15)";
}

function getStroke(idx, step, algo) {
  if (!step) return "rgba(148, 163, 184, 0.2)";
  if (step.type === "done" || step.sortedIndices?.includes(idx)) return "#22c55e";
  if (step.type === "found" && step.index === idx) return "#22c55e";

  const isSearch = algo.includes("search");
  if (isSearch) {
    if (step.type === "compare" && step.index === idx) return "#f59e0b";
    if (step.type === "range" && step.mid === idx) return "#3b82f6";
    return "rgba(148, 163, 184, 0.2)";
  }

  if (step.type === "pivot" && step.index === idx) return "#a855f7";
  if (step.type === "pivot-place" && step.index === idx) return "#22c55e";
  if (step.type === "compare" && (step.i === idx || step.j === idx)) return "#3b82f6";
  if (step.type === "swap" && (step.i === idx || step.j === idx)) return "#f59e0b";
  if (step.type === "merge-compare" && (step.leftIdx === idx || step.rightIdx === idx)) return "#3b82f6";
  if (step.type === "merge-place" && step.index === idx) return "#22c55e";

  return "rgba(148, 163, 184, 0.2)";
}

function addPointer(svg, idx, label, color, offsetX, barW, gap, yPos) {
  const x = offsetX + idx * (barW + gap) + barW / 2;
  svg
    .append("text")
    .attr("class", "pointer-label")
    .attr("x", x)
    .attr("y", yPos)
    .attr("text-anchor", "middle")
    .attr("fill", color)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .attr("font-family", "JetBrains Mono, monospace")
    .text(label);
}
