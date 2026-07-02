# create-llm-wiki Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code plugin that creates and maintains LLM-driven knowledge bases in any project.

**Architecture:** Plugin with 2 user-invoked skills (init-wiki, add-to-wiki), 1 autonomous agent (wiki-grapher), 1 rendering script (graph-viz.js), and 1 reference file (llm-wiki.md). All components live under `plugins/create-llm-wiki/`.

**Tech Stack:** SKILL.md (markdown with YAML frontmatter), Agent markdown config, Node.js (no npm deps, D3.js via CDN)

## Global Constraints

- Plugin name: `create-llm-wiki`
- Skill namespaced as `/create-llm-wiki:init-wiki` and `/create-llm-wiki:add-to-wiki`
- Wiki directory: `./llm-wiki/` relative to project root
- All prompts reference `references/llm-wiki.md` for rules
- graph-viz.js: zero npm dependencies, D3.js via CDN
- Agent script uses `${CLAUDE_PLUGIN_ROOT}` for portability

---

### Task 1: Copy reference file + create plugin manifest

**Files:**
- Create: `plugins/create-llm-wiki/.claude-plugin/plugin.json`
- Create: `plugins/create-llm-wiki/references/llm-wiki.md`

**Interfaces:**
- Consumes: nothing
- Produces: `plugin.json` manifest; `references/llm-wiki.md` as the rule source for all skills/agents

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p plugins/create-llm-wiki/.claude-plugin
mkdir -p plugins/create-llm-wiki/skills/init-wiki
mkdir -p plugins/create-llm-wiki/skills/add-to-wiki
mkdir -p plugins/create-llm-wiki/agents
mkdir -p plugins/create-llm-wiki/scripts
mkdir -p plugins/create-llm-wiki/references
```

- [ ] **Step 2: Copy reference file**

```bash
cp /Users/zhengmingming/Downloads/442a6bf555914893e9891c11519de94f-ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md \
  plugins/create-llm-wiki/references/llm-wiki.md
```

- [ ] **Step 3: Write plugin manifest**

Write `plugins/create-llm-wiki/.claude-plugin/plugin.json`:

```json
{
  "name": "create-llm-wiki",
  "version": "0.1.0",
  "description": "LLM-maintained knowledge base — init, add content, visualize relationships",
  "author": { "name": "oh-my-powers team" },
  "homepage": "https://github.com/zhengmingming/oh-my-powers"
}
```

- [ ] **Step 4: Verify structure**

```bash
find plugins/create-llm-wiki -type f | sort
```

Expected:
```
plugins/create-llm-wiki/.claude-plugin/plugin.json
plugins/create-llm-wiki/references/llm-wiki.md
```

- [ ] **Step 5: Commit**

```bash
git add plugins/create-llm-wiki
git commit -m "feat(create-llm-wiki): add plugin manifest and reference rules"
```

---

### Task 2: Create init-wiki skill

**Files:**
- Create: `plugins/create-llm-wiki/skills/init-wiki/SKILL.md`

**Interfaces:**
- Consumes: `references/llm-wiki.md` for wiki structure conventions
- Produces: Skill triggered by `/create-llm-wiki:init-wiki`

- [ ] **Step 1: Write SKILL.md**

Write `plugins/create-llm-wiki/skills/init-wiki/SKILL.md`:

```markdown
---
description: >-
  Initialize a new LLM-maintained wiki in the current project. Use this skill when
  the user says "init wiki", "initialize knowledge base", "创建知识库", "初始化wiki",
  or runs /create-llm-wiki:init-wiki.
name: init-wiki
argument-hint: [wiki-directory]
---

# Init Wiki

Initialize a new LLM-maintained wiki in the current project following the LLM Wiki pattern.

Reference: `references/llm-wiki.md` for the full architectural rules.

## Steps

1. Read `references/llm-wiki.md` to understand the three-layer architecture (raw sources → wiki pages → schema) and directory conventions.

2. Ask user for the wiki directory path. Default to `./llm-wiki/` if not specified.

3. Create the following directory structure under the chosen path:
   - `sources/` — for original/immutable source documents
   - `pages/` — for LLM-generated wiki pages

4. Create `index.md` with the following skeleton:
   - A top heading "# Wiki Index"
   - Section headers per category (initially empty, to be populated on ingest)
   - A note that this index is maintained by the LLM on every add-to-wiki operation

5. Create `log.md` with the initial entry:
   ```
   ## [YYYY-MM-DD] init | Created wiki at <path>
   ```
   Use the actual current date in ISO format.

6. Confirm to the user what was created, showing the full directory tree. Tell them they can now use `/create-llm-wiki:add-to-wiki` to add content.
```

- [ ] **Step 2: Validate SKILL.md structure**

```bash
head -10 plugins/create-llm-wiki/skills/init-wiki/SKILL.md
```

Expected: Valid YAML frontmatter between `---` delimiters with `description`, `name`, `argument-hint`.

- [ ] **Step 3: Commit**

```bash
git add plugins/create-llm-wiki/skills/init-wiki
git commit -m "feat(create-llm-wiki): add init-wiki skill"
```

---

### Task 3: Create add-to-wiki skill

**Files:**
- Create: `plugins/create-llm-wiki/skills/add-to-wiki/SKILL.md`

**Interfaces:**
- Consumes: `references/llm-wiki.md` for ingest rules; existing `./llm-wiki/index.md` for state awareness
- Produces: Skill triggered by `/create-llm-wiki:add-to-wiki <path>` or Q&A

- [ ] **Step 1: Write SKILL.md**

Write `plugins/create-llm-wiki/skills/add-to-wiki/SKILL.md`:

```markdown
---
description: >-
  Add content to the project's LLM wiki. Handles both file ingestion and Q&A-based
  knowledge extraction. Use when the user says "add to wiki", "把这篇加进知识库",
  /create-llm-wiki:add-to-wiki <path>, or discusses a topic they want persisted.
name: add-to-wiki
argument-hint: [file-path-or-topic]
---

# Add to Wiki

Add content to the project's LLM-maintained wiki. Supports two modes: file ingestion and Q&A distillation.

Reference: `references/llm-wiki.md` for the full architectural rules, ingest and query operations.

## Preliminary Steps

1. Read `references/llm-wiki.md` to understand the ingest and query operations.

2. Check that the wiki exists (`./llm-wiki/index.md`). If it doesn't, suggest the user run `/create-llm-wiki:init-wiki` first.

3. Read `./llm-wiki/index.md` to understand the current wiki state — what pages exist, what categories are used.

## Mode 1: File Ingestion

When the user provides a file path:

1. Read the file contents.
2. Identify the key information, entities, and concepts.
3. Check `index.md` to see if related pages already exist.
   - If yes: update existing pages with new information, adding cross-references.
   - If no: create a new page in `./llm-wiki/pages/`.
4. Write the page in markdown with consistent formatting.
5. Update `index.md` — add entry under the appropriate category section.
6. Append to `log.md` with format: `## [YYYY-MM-DD] ingest | <page-name> — <summary>`

## Mode 2: Q&A Distillation

When the user discusses a topic they want captured:

1. Review the recent conversation context to extract the key knowledge.
2. Ask the user for a page title if it's not clear from context.
3. Follow the same update/create flow as file ingestion (steps 3-6 above).
4. Confirm what was written and ask if they want to add more.

## General Rules

- Use `[[page-name]]` Obsidian-compatible wikilinks when cross-referencing.
- Each wiki page should have a clear title, a brief summary, and structured content.
- `index.md` entries follow this format: `- [[page-name]] — One-line summary`
- Log entries use the prefix format shown above (grep-parseable).
- Never delete user content. Deprecate old pages by adding a note at the top.
```

- [ ] **Step 2: Validate SKILL.md structure**

```bash
head -10 plugins/create-llm-wiki/skills/add-to-wiki/SKILL.md
```

Expected: Valid YAML frontmatter between `---` delimiters.

- [ ] **Step 3: Commit**

```bash
git add plugins/create-llm-wiki/skills/add-to-wiki
git commit -m "feat(create-llm-wiki): add add-to-wiki skill"
```

---

### Task 4: Create graph-viz.js script

**Files:**
- Create: `plugins/create-llm-wiki/scripts/graph-viz.js`

**Interfaces:**
- Consumes: JSON graph data via stdin (`{ nodes: [{id, label, summary}], edges: [{source, target, label}] }`)
- Produces: Self-contained HTML file via stdout with D3.js force-directed graph

- [ ] **Step 1: Write graph-viz.js**

Write `plugins/create-llm-wiki/scripts/graph-viz.js`:

```javascript
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
```

- [ ] **Step 2: Make executable**

```bash
chmod +x plugins/create-llm-wiki/scripts/graph-viz.js
```

- [ ] **Step 3: Quick smoke test**

```bash
echo '{"nodes":[{"id":"a","label":"Page A","summary":"Test"}],"edges":[{"source":"a","target":"a","label":"self"}]}' \
  | node plugins/create-llm-wiki/scripts/graph-viz.js \
  > /tmp/test-graph.html && echo "PASS: $(wc -c < /tmp/test-graph.html) bytes generated"
```

Expected: `PASS: <N> bytes generated` with a valid HTML file.

- [ ] **Step 4: Commit**

```bash
git add plugins/create-llm-wiki/scripts/graph-viz.js
git commit -m "feat(create-llm-wiki): add graph-viz.js D3.js HTML renderer"
```

---

### Task 5: Create wiki-grapher agent

**Files:**
- Create: `plugins/create-llm-wiki/agents/wiki-grapher.md`

**Interfaces:**
- Consumes: `scripts/graph-viz.js` via Bash; `references/llm-wiki.md` for rules
- Produces: `./llm-wiki/graph.html` or updated `[[wikilinks]]` in page files

- [ ] **Step 1: Write agent config**

Write `plugins/create-llm-wiki/agents/wiki-grapher.md`:

```markdown
---
name: wiki-grapher
description: Analyzes a project's LLM wiki and generates a visual relationship graph. Use when users ask to "generate graph", "view relationships", "show knowledge connections", "生成知识图谱", or "看看知识关联".
model:
  name: claude-sonnet-4-20250514
tools:
  - Read
  - Write
  - Edit
  - Bash
---

You are a wiki graph specialist. Your job is to analyze a project's LLM-maintained wiki and produce a visual relationship graph.

Reference: `references/llm-wiki.md` for wiki architecture conventions.

## Trigger

Activate when a user says something like:
- "生成图谱"
- "graph the wiki"
- "show me the knowledge graph"
- "看看知识关联"
- "generate a relationship graph"

## Process

1. **Scan the wiki.** Read all files in `./llm-wiki/pages/*.md` to understand content and extract `[[wikilinks]]`.

2. **Build graph data.** Construct a JSON structure with:
   - **Nodes:** Each wiki page is a node. Include `id` (page name), `label` (display title), `summary` (first line or key topic), `group` (category inferred from index.md or content).
   - **Edges:** Each `[[wikilink]]` from page A to page B is an edge. Also infer implicit relationships from shared keywords across pages.

3. **Ask user for output format.** Present two options:
   - **HTML** — Generate an interactive D3.js graph. Pipe the JSON to `scripts/graph-viz.js` via: `${CLAUDE_PLUGIN_ROOT}/scripts/graph-viz.js` < input.json. Write output to `./llm-wiki/graph.html`.
   - **Obsidian** — Add/update `[[wikilinks]]` in page markdown files. Tell user to open Obsidian and use Graph View.

4. **Execute.** Based on user's choice, generate the output.
   - For HTML: Pipe JSON data to the script and save the HTML output.
   - For Obsidian: Edit page files to ensure consistent `[[wikilinks]]` between related pages.

5. **Confirm.** Tell the user where the graph was generated and how to view it.

## Important Notes

- Check existing `[[wikilinks]]` in pages first — don't duplicate what's already there.
- For implicit relationships (shared keywords/topics), add a `label` to the edge explaining the relationship.
- When using `${CLAUDE_PLUGIN_ROOT}`, the shell will expand it — pass it as-is in shell commands.
- The graph-viz.js script reads JSON from stdin and writes HTML to stdout.
```

- [ ] **Step 2: Validate agent file**

```bash
head -15 plugins/create-llm-wiki/agents/wiki-grapher.md
```

Expected: Valid YAML frontmatter between `---` with `name`, `description`, `model`, `tools`.

- [ ] **Step 3: Commit**

```bash
git add plugins/create-llm-wiki/agents/wiki-grapher.md
git commit -m "feat(create-llm-wiki): add wiki-grapher agent"
```

---

### Task 6: Create README + register in marketplace

**Files:**
- Create: `plugins/create-llm-wiki/README.md`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: all previous tasks' outputs
- Produces: documented plugin; marketplace entry

- [ ] **Step 1: Write plugin README**

Write `plugins/create-llm-wiki/README.md`:

```markdown
# create-llm-wiki

LLM-maintained knowledge base for your project — part of the [oh-my-powers](https://github.com/zhengmingming/oh-my-powers) marketplace.

Inspired by the [LLM Wiki pattern](https://github.com/...), this plugin lets you build a persistent, interlinked knowledge base incrementally as you work.

## Commands

| Command | Description |
|---------|-------------|
| `/create-llm-wiki:init-wiki` | Initialize a new wiki in `./llm-wiki/` |
| `/create-llm-wiki:add-to-wiki <path>` | Add a file or Q&A content to the wiki |

## Agents

- **wiki-grapher** — Analyzes wiki pages and generates a visual relationship graph (HTML with D3.js or Obsidian wikilinks)

## Usage

```bash
# Add the marketplace
/plugin marketplace add zhengmingming/oh-my-powers

# Install the plugin
/plugin install create-llm-wiki@oh-my-powers

# Initialize a wiki
/create-llm-wiki:init-wiki

# Add content
/create-llm-wiki:add-to-wiki ./docs/architecture.md

# Generate graph
# Just say "生成图谱" or "graph the wiki"
```

## Structure

```
llm-wiki/
├── sources/       # Original documents (immutable)
├── pages/         # Wiki pages (LLM-maintained)
├── index.md       # Content catalog
├── log.md         # Change history
└── graph.html     # Interactive knowledge graph
```
```

- [ ] **Step 2: Register in marketplace.json**

Edit `.claude-plugin/marketplace.json` to add the new plugin entry in the `plugins` array:

```json
    {
      "name": "create-llm-wiki",
      "source": "./plugins/create-llm-wiki",
      "description": "LLM-maintained knowledge base — init, add content, visualize relationships",
      "version": "0.1.0",
      "author": {
        "name": "oh-my-powers team"
      }
    }
```

- [ ] **Step 3: Verify marketplace.json is valid JSON**

```bash
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo "VALID JSON"
```

Expected: `VALID JSON`

- [ ] **Step 4: Commit**

```bash
git add plugins/create-llm-wiki/README.md .claude-plugin/marketplace.json
git commit -m "feat(create-llm-wiki): add README and register in marketplace"
```

---

### Task 7: Validate plugin

**Files:** (read-only checks)
- All previously created files

- [ ] **Step 1: Run plugin-validator**

Dispatch a `plugin-dev:plugin-validator` agent targeting `plugins/create-llm-wiki`.

Check:
- plugin.json validity
- SKILL.md frontmatter correctness
- Agent config structure
- Directory naming conventions
- No missing references

- [ ] **Step 2: Verify full file tree**

```bash
find plugins/create-llm-wiki -type f | sort
```

Expected:
```
plugins/create-llm-wiki/.claude-plugin/plugin.json
plugins/create-llm-wiki/agents/wiki-grapher.md
plugins/create-llm-wiki/README.md
plugins/create-llm-wiki/references/llm-wiki.md
plugins/create-llm-wiki/scripts/graph-viz.js
plugins/create-llm-wiki/skills/add-to-wiki/SKILL.md
plugins/create-llm-wiki/skills/init-wiki/SKILL.md
```

- [ ] **Step 3: Fix any validation issues** (if found)
- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(create-llm-wiki): address validation findings"
```

---

### Task 8: End-to-end smoke test

- [ ] **Step 1: Load the plugin locally**

```bash
cc --plugin-dir ./plugins/create-llm-wiki
```

- [ ] **Step 2: Run init-wiki**

```
/create-llm-wiki:init-wiki
```

Expected: `./llm-wiki/` created with `sources/`, `pages/`, `index.md`, `log.md`.

- [ ] **Step 3: Run add-to-wiki with a test file**

```
/create-llm-wiki:add-to-wiki ./plugins/create-llm-wiki/README.md
```

Expected: A new page in `./llm-wiki/pages/` about create-llm-wiki, index updated, log updated.

- [ ] **Step 4: Generate graph**

Say "生成图谱" to trigger the wiki-grapher agent. Choose HTML format.

Expected: `./llm-wiki/graph.html` generated, openable in browser with force-directed graph.

- [ ] **Step 5: Clean up test wiki**

```bash
rm -rf ./llm-wiki/
```
