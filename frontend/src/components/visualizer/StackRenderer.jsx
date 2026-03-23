import { useEffect, useRef } from "react";
import * as d3 from "d3";

/*
  StackRenderer — D3 SVG visualizer for stack push/pop/peek.
  Props:
    data        – { algorithm: "stack", steps }
    stepIndex   – current step index
*/
export default function StackRenderer({ data, stepIndex }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const step = data?.steps?.[stepIndex];
  const stack = step?.stack || [];

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width: W } = container.getBoundingClientRect();
    const H = 360;
    const blockH = 44;
    const blockW = Math.min(160, W * 0.35);
    const gap = 6;
    const centerX = W / 2;
    const bottomY = H - 40;

    let svg = d3.select(svgRef.current);
    if (svg.empty()) {
      svg = d3.select(container).append("svg");
      svgRef.current = svg.node();
    }
    svg.attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);

    // Stack base
    svg.selectAll(".stack-base").remove();
    svg
      .append("line")
      .attr("class", "stack-base")
      .attr("x1", centerX - blockW / 2 - 10)
      .attr("y1", bottomY + 4)
      .attr("x2", centerX + blockW / 2 + 10)
      .attr("y2", bottomY + 4)
      .attr("stroke", "#475569")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round");

    // Side rails
    svg.selectAll(".stack-rail").remove();
    const railH = Math.max(blockH * 6 + gap * 5, H - 80);
    [centerX - blockW / 2 - 8, centerX + blockW / 2 + 8].forEach((x) => {
      svg
        .append("line")
        .attr("class", "stack-rail")
        .attr("x1", x).attr("y1", bottomY + 4)
        .attr("x2", x).attr("y2", bottomY - railH)
        .attr("stroke", "#334155")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4");
    });

    // Data join for stack blocks
    const blocks = svg.selectAll(".stack-block").data(stack, (d, i) => `${i}-${d}`);

    // ENTER
    const enter = blocks.enter().append("g").attr("class", "stack-block");
    enter
      .append("rect")
      .attr("rx", 8)
      .attr("width", blockW)
      .attr("height", blockH)
      .attr("fill", "rgba(59, 130, 246, 0.2)")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 1.5);
    enter
      .append("text")
      .attr("x", blockW / 2)
      .attr("y", blockH / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .attr("font-family", "JetBrains Mono, monospace");

    // Animate entering element from top
    enter.attr("transform", () => `translate(${centerX - blockW / 2}, -50)`);

    // MERGE
    const merged = enter.merge(blocks);

    merged
      .transition()
      .duration(400)
      .ease(d3.easeCubicOut)
      .attr("transform", (d, i) => {
        const y = bottomY - (i + 1) * (blockH + gap);
        return `translate(${centerX - blockW / 2}, ${y})`;
      });

    // Color top of stack differently
    merged.select("rect")
      .transition()
      .duration(300)
      .attr("fill", (d, i) => {
        if (step?.type === "peek" && i === stack.length - 1) return "rgba(245, 158, 11, 0.35)";
        if (step?.type === "push" && i === stack.length - 1) return "rgba(34, 197, 94, 0.3)";
        return i === stack.length - 1 ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.12)";
      })
      .attr("stroke", (d, i) => {
        if (step?.type === "peek" && i === stack.length - 1) return "#f59e0b";
        if (step?.type === "push" && i === stack.length - 1) return "#22c55e";
        return i === stack.length - 1 ? "#3b82f6" : "#334155";
      });

    merged.select("text").text((d) => d);

    // EXIT — animate leaving to top
    blocks
      .exit()
      .transition()
      .duration(300)
      .attr("transform", `translate(${centerX - blockW / 2}, -60)`)
      .style("opacity", 0)
      .remove();

    // Operation label
    svg.selectAll(".op-label").remove();
    if (step) {
      const labelMap = {
        push: `PUSH  ${step.value}`,
        pop: `POP → ${step.value}`,
        peek: `PEEK → ${step.value}`,
      };
      svg
        .append("text")
        .attr("class", "op-label")
        .attr("x", centerX)
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .attr("fill", step.type === "push" ? "#22c55e" : step.type === "pop" ? "#ef4444" : "#f59e0b")
        .attr("font-size", 15)
        .attr("font-weight", 700)
        .attr("font-family", "JetBrains Mono, monospace")
        .text(labelMap[step.type] || "");
    }

    // "TOP" label
    svg.selectAll(".top-pointer").remove();
    if (stack.length > 0) {
      const topY = bottomY - stack.length * (blockH + gap) + blockH / 2;
      svg
        .append("text")
        .attr("class", "top-pointer")
        .attr("x", centerX + blockW / 2 + 30)
        .attr("y", topY)
        .attr("dy", ".35em")
        .attr("fill", "#60a5fa")
        .attr("font-size", 12)
        .attr("font-weight", 700)
        .attr("font-family", "JetBrains Mono, monospace")
        .text("← TOP");
    }

  }, [stack, stepIndex, step]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[360px] relative"
    />
  );
}
