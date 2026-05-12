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

    // ─── LINKED LIST DIAGRAM ───────────────────────────────────────────────────
    if (algorithm === 'linked_list' && data.nodes) {
      const nodeW = 90, nodeH = 44, split = 55;
      const gap = 48;
      const totalW = data.nodes.length * (nodeW + gap) - gap;
      const startX = (width - totalW) / 2;
      const y = height / 2 - nodeH / 2;
      const g = svg.append('g');

      // HEAD label
      g.append('text').attr('x', startX - 4).attr('y', y - 20)
        .attr('fill', '#94a3b8').attr('font-size', '12px').attr('font-family', 'monospace')
        .attr('text-anchor', 'middle').text('Head');
      g.append('line')
        .attr('x1', startX - 4).attr('y1', y - 14)
        .attr('x2', startX - 4).attr('y2', y + 6)
        .attr('stroke', '#64748b').attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrow-gray)');

      // Arrow marker
      const defs = svg.append('defs');
      const mkArrow = (id, color) => {
        defs.append('marker').attr('id', id).attr('markerWidth', 8).attr('markerHeight', 8)
          .attr('refX', 6).attr('refY', 3).attr('orient', 'auto')
          .append('path').attr('d', 'M0,0 L0,6 L8,3 z').attr('fill', color);
      };
      mkArrow('arrow-blue', '#6366f1');
      mkArrow('arrow-gray', '#64748b');
      mkArrow('arrow-green', '#22c55e');

      data.nodes.forEach((node, i) => {
        const x = startX + i * (nodeW + gap);
        const isLast = i === data.nodes.length - 1;
        const isHighlighted = data.highlight && data.highlight.includes(i);

        // Outer rect
        g.append('rect').attr('x', x).attr('y', y).attr('width', nodeW).attr('height', nodeH)
          .attr('rx', 6).attr('fill', '#0f1117')
          .attr('stroke', isHighlighted ? '#6366f1' : 'rgba(255,255,255,0.15)').attr('stroke-width', isHighlighted ? 2 : 1.5);

        // Divider line
        g.append('line').attr('x1', x + split).attr('y1', y + 4).attr('x2', x + split).attr('y2', y + nodeH - 4)
          .attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-width', 1);

        // DATA value
        g.append('text').attr('x', x + split / 2).attr('y', y + nodeH / 2)
          .attr('dy', '.35em').attr('text-anchor', 'middle')
          .attr('fill', '#e2e8f0').attr('font-size', '15px').attr('font-weight', 'bold').attr('font-family', 'monospace')
          .text(node.value);

        // POINTER value (next address or NULL)
        g.append('rect').attr('x', x + split + 2).attr('y', y + 2).attr('width', nodeW - split - 4).attr('height', nodeH - 4)
          .attr('rx', 4).attr('fill', isLast ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)');
        g.append('text').attr('x', x + split + (nodeW - split) / 2).attr('y', y + nodeH / 2)
          .attr('dy', '.35em').attr('text-anchor', 'middle')
          .attr('fill', isLast ? '#f87171' : '#86efac').attr('font-size', '10px').attr('font-weight', '700').attr('font-family', 'monospace')
          .text(isLast ? 'NULL' : (node.next || `${3000 + (i + 1) * 400}`));

        // Address label below node
        g.append('text').attr('x', x + nodeW / 2).attr('y', y + nodeH + 14)
          .attr('text-anchor', 'middle').attr('fill', '#64748b').attr('font-size', '10px').attr('font-family', 'monospace')
          .text(node.address || `${3000 + i * 400}`);

        // Arrow to next node
        if (!isLast) {
          g.append('line')
            .attr('x1', x + nodeW).attr('y1', y + nodeH / 2)
            .attr('x2', x + nodeW + gap - 6).attr('y2', y + nodeH / 2)
            .attr('stroke', '#6366f1').attr('stroke-width', 2).attr('marker-end', 'url(#arrow-blue)');
        }

        // Node label (optional)
        if (node.label) {
          g.append('text').attr('x', x + nodeW / 2).attr('y', y - 18)
            .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', '11px')
            .text(node.label);
          g.append('line').attr('x1', x + nodeW / 2).attr('y1', y - 12).attr('x2', x + nodeW / 2).attr('y2', y - 2)
            .attr('stroke', '#64748b').attr('stroke-width', 1).attr('marker-end', 'url(#arrow-gray)');
        }
      });

      // Title
      svg.append('text').attr('x', width / 2).attr('y', 22).attr('text-anchor', 'middle')
        .attr('fill', '#6366f1').attr('font-size', '13px').attr('font-weight', '700').attr('letter-spacing', '2')
        .text((data.title || 'LINKED LIST').toUpperCase());
      return;
    }

    // ─── TREE / RECURSION DIAGRAM ──────────────────────────────────────────────
    if (algorithm === 'tree_diagram' && data.treeData) {
      const hierarchy = d3.hierarchy(data.treeData);
      const treeLayout = d3.tree().size([width - 80, height - 100]);
      treeLayout(hierarchy);

      const g = svg.append('g').attr('transform', 'translate(40, 50)');

      // Links
      g.selectAll('.link').data(hierarchy.links()).enter().append('path').attr('class', 'link')
        .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr('fill', 'none').attr('stroke', 'rgba(99,102,241,0.35)').attr('stroke-width', 1.5);

      // Nodes as rectangles
      const nodes = g.selectAll('.node').data(hierarchy.descendants()).enter().append('g')
        .attr('class', 'node').attr('transform', d => `translate(${d.x}, ${d.y})`);

      nodes.append('rect')
        .attr('x', d => -(d.data.label ? Math.max(30, d.data.label.length * 5) : 30))
        .attr('y', -14).attr('rx', 6)
        .attr('width', d => Math.max(60, (d.data.label || '').length * 10))
        .attr('height', 28)
        .attr('fill', d => d.data.sorted ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.12)')
        .attr('stroke', d => d.data.sorted ? '#22c55e' : 'rgba(99,102,241,0.5)').attr('stroke-width', 1.5);

      nodes.append('text').attr('dy', '.35em').attr('text-anchor', 'middle')
        .attr('fill', d => d.data.sorted ? '#86efac' : '#c7d2fe')
        .attr('font-size', '11px').attr('font-weight', '600').attr('font-family', 'monospace')
        .text(d => d.data.label || d.data.value);

      svg.append('text').attr('x', width / 2).attr('y', 20).attr('text-anchor', 'middle')
        .attr('fill', '#6366f1').attr('font-size', '13px').attr('font-weight', '700').attr('letter-spacing', '2')
        .text((data.title || 'TREE DIAGRAM').toUpperCase());
      return;
    }

    // ─── ARRAY / SEARCHING ────────────────────────────────────────────────────
    if (algorithm === 'linear_search' || algorithm === 'binary_search') {
      const nodeWidth = 52, nodeHeight = 52, spacing = 8;
      const startX = (width - (array.length * (nodeWidth + spacing))) / 2;
      const startY = height / 2 - nodeHeight / 2;

      const nodes = svg.selectAll('.node').data(array).enter().append('g').attr('class', 'node')
        .attr('transform', (d, i) => `translate(${startX + i * (nodeWidth + spacing)}, ${startY})`);

      nodes.append('rect').attr('width', nodeWidth).attr('height', nodeHeight).attr('rx', 8)
        .attr('fill', 'rgba(255,255,255,0.04)').attr('stroke', 'rgba(255,255,255,0.1)').attr('class', 'node-rect');

      nodes.append('text').attr('x', nodeWidth / 2).attr('y', nodeHeight / 2).attr('dy', '.35em')
        .attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-family', 'monospace').text(d => d);

      nodes.append('text').attr('x', nodeWidth / 2).attr('y', nodeHeight + 14).attr('text-anchor', 'middle')
        .attr('fill', '#475569').attr('font-size', '10px').attr('font-family', 'monospace')
        .text((d, i) => i);

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) { clearInterval(interval); return; }
        const { index, type } = steps[currentStep];
        if (index !== undefined) {
          nodes.filter((d, i) => i === index).select('.node-rect').transition().duration(500)
            .attr('fill', type === 'found' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)')
            .attr('stroke', type === 'found' ? '#22c55e' : '#ef4444');
        }
        currentStep++;
      }, 1000);
      return () => clearInterval(interval);
    }

    // ─── SORTING BARS ─────────────────────────────────────────────────────────
    if (algorithm === 'bubble_sort' || algorithm === 'quick_sort' || algorithm === 'merge_sort' || algorithm === 'insertion_sort') {
      const barPadding = 8;
      const barWidth = (width - margin.left - margin.right) / array.length - barPadding;
      const yScale = d3.scaleLinear().domain([0, d3.max(array)]).range([0, height - margin.top - margin.bottom]);

      const bars = svg.selectAll('.bar').data(array.map((v, i) => ({ value: v, id: i }))).enter()
        .append('g').attr('class', 'bar')
        .attr('transform', (d, i) => `translate(${margin.left + i * (barWidth + barPadding)}, ${height - margin.bottom - yScale(d.value)})`);

      bars.append('rect').attr('width', barWidth).attr('height', d => yScale(d.value)).attr('rx', 4)
        .attr('fill', '#6366f1').attr('fill-opacity', 0.6).attr('stroke', '#6366f1').attr('class', 'bar-rect');

      bars.append('text').attr('x', barWidth / 2).attr('y', -8).attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8').attr('font-size', '10px').text(d => d.value);

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) { clearInterval(interval); return; }
        const { type, i, j, array: stepArray, sortedIndices } = steps[currentStep];

        if (type === 'compare' || type === 'swap') {
          bars.selectAll('.bar-rect').transition().duration(200).attr('fill', '#6366f1').attr('stroke', '#6366f1');
          bars.filter((d, idx) => idx === i || idx === j).select('.bar-rect').transition().duration(200)
            .attr('fill', type === 'swap' ? '#ef4444' : '#f59e0b').attr('stroke', type === 'swap' ? '#ef4444' : '#f59e0b');
        }
        if (type === 'swap' && stepArray) {
          bars.each(function(d, idx) {
            const newValue = stepArray[idx];
            d3.select(this).select('.bar-rect').transition().duration(500).attr('height', yScale(newValue));
            d3.select(this).select('text').text(newValue);
            d3.select(this).transition().duration(500)
              .attr('transform', `translate(${margin.left + idx * (barWidth + barPadding)}, ${height - margin.bottom - yScale(newValue)})`);
          });
        }
        if (sortedIndices) {
          bars.filter((d, idx) => sortedIndices.includes(idx)).select('.bar-rect').transition().duration(500)
            .attr('fill', '#22c55e').attr('stroke', '#22c55e');
        }
        currentStep++;
      }, 800);
      return () => clearInterval(interval);
    }

    // ─── BST ─────────────────────────────────────────────────────────────────
    if (algorithm === 'bst' && data.treeData) {
      const hierarchy = d3.hierarchy(data.treeData);
      const treeLayout = d3.tree().size([width - 100, height - 120]);
      treeLayout(hierarchy);
      const g = svg.append('g').attr('transform', 'translate(50, 60)');
      g.selectAll('.link').data(hierarchy.links()).enter().append('path').attr('class', 'link')
        .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr('fill', 'none').attr('stroke', 'rgba(99,102,241,0.25)').attr('stroke-width', 2);
      const nodes = g.selectAll('.node').data(hierarchy.descendants()).enter().append('g')
        .attr('class', 'node').attr('transform', d => `translate(${d.x}, ${d.y})`);
      nodes.append('circle').attr('r', 20).attr('fill', 'rgba(15,23,42,0.9)')
        .attr('stroke', 'rgba(99,102,241,0.4)').attr('stroke-width', 2).attr('class', 'node-circle');
      nodes.append('text').attr('dy', '.35em').attr('text-anchor', 'middle')
        .attr('fill', '#fff').attr('font-size', '11px').attr('font-weight', 'bold').text(d => d.data.value);
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) { clearInterval(interval); return; }
        const { nodeId, path, type } = steps[currentStep];
        nodes.selectAll('.node-circle').transition().duration(200)
          .attr('stroke', 'rgba(99,102,241,0.4)').attr('fill', 'rgba(15,23,42,0.9)');
        if (path) nodes.filter(d => path.includes(d.data.id)).select('.node-circle')
          .attr('stroke', '#60a5fa').attr('fill', 'rgba(99,102,241,0.1)');
        if (nodeId !== undefined) nodes.filter(d => d.data.id === nodeId).select('.node-circle')
          .transition().duration(300)
          .attr('stroke', type === 'insert' ? '#22c55e' : '#f59e0b')
          .attr('fill', type === 'insert' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)');
        currentStep++;
      }, 1000);
      return () => clearInterval(interval);
    }

    // ─── FALLBACK ─────────────────────────────────────────────────────────────
    svg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8').text(`Visualizing ${algorithm || 'Algorithm'}...`);

  }, [data]);

  return (
    <div className="w-full h-full bg-black/20 rounded-xl border border-white/10 overflow-hidden relative">
      <svg ref={svgRef} viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" className="w-full h-full" />
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">D3 Engine Active</span>
      </div>
    </div>
  );
}
