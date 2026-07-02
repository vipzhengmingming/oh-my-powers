#!/usr/bin/env node
// graph-viz.js — Generate a self-contained D3.js force-directed graph HTML
// Input: JSON via stdin  |  Output: self-contained HTML via stdout

const fs = require("fs");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const html = generateHtml(data);
    process.stdout.write(html);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
});

function generateHtml(data) {
  const nodes = JSON.stringify(data.nodes || []);
  const edges = JSON.stringify(data.edges || []);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wiki Knowledge Graph</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; overflow: hidden; }
  #graph { width: 100vw; height: 100vh; }
  .tooltip { position: absolute; background: rgba(0,0,0,.8); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; pointer-events: none; opacity: 0; transition: opacity .2s; max-width: 300px; z-index: 10; }
  .controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 8px 16px; font-size: 13px; color: #666; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .legend { position: absolute; top: 20px; left: 20px; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,.1); max-height: 90vh; overflow-y: auto; }
  .legend-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; }
  .legend-item:hover { color: #1a73e8; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .legend-item.active { font-weight: 600; color: #1a73e8; }
  .count { font-size: 11px; color: #999; margin-left: auto; }
</style>
</head>
<body>
<div id="graph"></div>
<div class="tooltip" id="tooltip"></div>
<div class="controls">🖱 Drag to move · Scroll to zoom · Hover for details</div>
<div class="legend" id="legend"></div>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
  const nodesData = ${nodes};
  const edgesData = ${edges};

  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("#graph").append("svg").attr("width", width).attr("height", height);
  const g = svg.append("g");
  const tooltip = d3.select("#tooltip");

  // Zoom
  svg.call(d3.zoom().scaleExtent([0.2, 4]).on("zoom", (e) => g.attr("transform", e.transform)));

  // Color scale
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // Simulation
  const simulation = d3.forceSimulation(nodesData)
    .force("link", d3.forceLink(edgesData).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Links
  const link = g.append("g").selectAll("line").data(edgesData).join("line")
    .attr("stroke", "#ccc").attr("stroke-width", 1.5).attr("stroke-opacity", 0.6);

  // Link labels
  const linkLabel = g.append("g").selectAll("text").data(edgesData).join("text")
    .text(d => d.label || "").attr("font-size", 10).attr("fill", "#999");

  // Nodes
  const node = g.append("g").selectAll("circle").data(nodesData).join("circle")
    .attr("r", 8).attr("fill", d => color(d.group || d.id)).attr("stroke", "#fff").attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .call(d3.drag().on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

  // Node labels
  const label = g.append("g").selectAll("text").data(nodesData).join("text")
    .text(d => d.label || d.id).attr("font-size", 12).attr("dx", 12).attr("dy", 4).attr("fill", "#333");

  // Hover
  node.on("mouseover", (e, d) => {
    tooltip.style("opacity", 1).html("<strong>" + (d.label || d.id) + "</strong>" + (d.summary ? "<br>" + d.summary : ""));
  }).on("mousemove", (e) => {
    tooltip.style("left", (e.pageX + 12) + "px").style("top", (e.pageY - 28) + "px");
  }).on("mouseout", () => tooltip.style("opacity", 0));

  // Tick
  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    linkLabel.attr("x", d => (d.source.x + d.target.x) / 2).attr("y", d => (d.source.y + d.target.y) / 2);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
    label.attr("x", d => d.x).attr("y", d => d.y);
  });

  // Legend
  const legend = d3.select("#legend");
  legend.append("div").style("font-weight", "600").style("margin-bottom", "8px").text("📄 Wiki Pages");
  const groups = [...new Set(nodesData.map(n => n.group || n.id))];
  groups.forEach(gid => {
    const count = nodesData.filter(n => (n.group || n.id) === gid).length;
    const item = legend.append("div").attr("class", "legend-item").on("click", () => {
      const ids = nodesData.filter(n => (n.group || n.id) === gid).map(n => n.id);
      node.attr("opacity", d => ids.includes(d.id) ? 1 : 0.1);
      label.attr("opacity", d => ids.includes(d.id) ? 1 : 0.1);
      link.attr("opacity", d => (ids.includes(d.source.id) && ids.includes(d.target.id)) ? 0.6 : 0.05);
      legend.selectAll(".legend-item").classed("active", false);
      item.classed("active", true);
    });
    item.append("span").attr("class", "legend-dot").style("background", color(gid));
    item.append("span").text(gid);
    item.append("span").attr("class", "count").text(count);
  });
  legend.append("div").style("margin-top", "8px").style("font-size", "11px").style("color", "#999")
    .text("Click a category to filter");
</script>
</body>
</html>`;
}
