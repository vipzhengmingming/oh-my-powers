---
description: >-
  Generate a visual relationship graph from the project's LLM wiki. Use when the
  user says "生成图谱", "graph the wiki", "关系图谱", "知识图谱", "show connections",
  or runs /create-llm-wiki:graph-wiki.
name: graph-wiki
argument-hint: [html|obsidian]
---

# Graph Wiki

Generate a visual relationship graph from the project's LLM wiki.

Reference: `references/llm-wiki.md` for wiki architecture conventions.  
Agent: the wiki-grapher agent handles the actual analysis and generation — this skill coordinates the flow.

## Steps

1. Read `references/llm-wiki.md` to understand wiki conventions.

2. Check that the wiki exists (`./llm-wiki/index.md`). If not, suggest the user run `/create-llm-wiki:init-wiki` first.

3. Scan `./llm-wiki/pages/*.md` for content and `[[wikilinks]]`. Build a graph data structure:
   - **Nodes:** each wiki page → `{ id, label, summary, group }`
   - **Edges:** each `[[wikilink]]` → `{ source, target, label }`. Also infer implicit relationships from shared keywords.

4. Ask user for output format (or use the argument if provided):
   - `html` — Generate interactive D3.js graph. Pipe JSON to `${CLAUDE_PLUGIN_ROOT}/scripts/graph-viz.js`, write output to `./llm-wiki/graph.html`. Tell user to open it in a browser.
   - `obsidian` — Add/update `[[wikilinks]]` in page files. Tell user to open Obsidian and use Graph View.

5. Execute based on user's choice.

6. Confirm where the output was generated and how to view it.

## Important Notes

- Check existing `[[wikilinks]]` first — don't duplicate.
- For implicit relationships, add a `label` explaining the connection.
- `${CLAUDE_PLUGIN_ROOT}` expands to the plugin root in shell commands — pass it as-is.
- The graph-viz.js script reads JSON from stdin and writes HTML to stdout.
