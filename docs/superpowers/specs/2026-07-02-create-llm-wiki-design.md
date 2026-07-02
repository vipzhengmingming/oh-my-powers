# create-llm-wiki Plugin — Design Spec

**Date:** 2026-07-02
**Status:** Approved
**Marketplace:** oh-my-powers

---

## Overview

`create-llm-wiki` is a Claude Code plugin that enables LLM-maintained, persistent knowledge bases directly inside any project. Inspired by the [LLM Wiki pattern](../../references/llm-wiki.md), it provides three operations: initialize a wiki structure, add content from files or conversation, and generate visual relationship graphs.

The wiki lives in the project directory (`./llm-wiki/`) as plain markdown files — no external database, no embedding infrastructure. The LLM handles all the bookkeeping.

---

## Architecture

```
User command → Skill/Agent → reads/writes → ./llm-wiki/
                                   │
                          reads rules from → references/llm-wiki.md
                                   │
                          calls for HTML → scripts/graph-viz.js
```

**Three layers** (from LLM Wiki pattern):
- **Raw sources** (`sources/`) — original documents, immutable
- **Wiki pages** (`pages/`) — LLM-generated markdown, cross-linked
- **Schema** (`references/llm-wiki.md`) — rules that govern the LLM's behavior

---

## Plugin Structure

```
plugins/create-llm-wiki/
├── .claude-plugin/
│   └── plugin.json                  ← Plugin manifest
├── skills/
│   ├── init-wiki/SKILL.md           ← /create-llm-wiki:init-wiki
│   └── add-to-wiki/SKILL.md         ← /create-llm-wiki:add-to-wiki
├── agents/
│   └── wiki-grapher.md              ← wiki-grapher agent
├── scripts/
│   └── graph-viz.js                 ← D3.js HTML renderer
├── references/
│   └── llm-wiki.md                  ← Core rules (from user)
└── README.md
```

---

## Component Design

### 1. `init-wiki` Skill

**Trigger:** `/create-llm-wiki:init-wiki` or "初始化知识库" / "init wiki"

**Behavior:**
1. Create `./llm-wiki/` with subdirectories:
   - `sources/` — for original documents
   - `pages/` — for LLM-generated wiki pages
2. Create `index.md` as a categorized catalog of all pages (initially empty skeleton)
3. Create `log.md` with initial entry marking wiki creation
4. Output confirmation and usage hints to user

**SKILL.md structure:**
- Frontmatter: `name`, `description` with trigger phrases, `argument-hint: [wiki-dir]`
- Body references `references/llm-wiki.md` for directory conventions
- Output format: confirmation message showing created structure

### 2. `add-to-wiki` Skill

**Trigger:** `/create-llm-wiki:add-to-wiki <file-path>` or "把这篇加到 wiki" / "add to wiki"

**Two input modes:**

| Mode | Trigger | Behavior |
|------|---------|----------|
| File | User provides file path | Read file → extract key info → integrate into wiki |
| Q&A | User discusses a topic | Review conversation → distill knowledge → integrate |

**Processing flow (both modes):**
1. Read `references/llm-wiki.md` for ingest rules
2. Read `./llm-wiki/index.md` to understand current wiki state
3. If content relates to existing pages: update them
4. If content is new: create new page in `pages/`
5. Ensure cross-links between related pages
6. Update `index.md` with new/changed entries
7. Append entry to `log.md` with consistent prefix format

**SKILL.md structure:**
- Frontmatter: `name`, `description` with trigger phrases, `argument-hint: [file-path-or-topic]`
- Body references ingest/query operations from `references/llm-wiki.md`
- Emphasizes checking `index.md` first, no duplicate pages

### 3. `wiki-grapher` Agent

**Trigger:** User says "生成图谱" / "graph the wiki" / "看看知识关联"

**Required tools:** Read, Write, Edit, Bash

**Behavior:**
1. Scan `./llm-wiki/pages/*.md` for content and `[[wikilinks]]`
2. Build graph data: nodes = pages, edges = cross-references/shared concepts
3. Ask user for output format:
   - **HTML** → pipe JSON to `scripts/graph-viz.js` → `./llm-wiki/graph.html`
   - **Obsidian** → add/update `[[wikilinks]]` in page files → user opens Obsidian Graph View

**Agent prompt requirements:**
- `<examples>` block showing sample user requests
- Clear instruction to check both existing wikilinks and content for relationship extraction
- Output format guidance

### 4. `graph-viz.js` Script

**Type:** Node.js script, no npm dependencies (D3.js loaded via CDN)

**Input:** JSON graph data via stdin (nodes + edges array)
**Output:** Self-contained HTML file to stdout

**Node format:**
```json
{
  "nodes": [
    { "id": "architecture", "label": "系统架构", "summary": "..." }
  ],
  "edges": [
    { "source": "architecture", "target": "database", "label": "depends on" }
  ]
}
```

**Output features:**
- D3.js force-directed graph
- Draggable nodes
- Zoom/pan
- Hover tooltip with summary
- Click to highlight connected nodes

---

## Knowledge Base Structure (`./llm-wiki/`)

```
llm-wiki/
├── sources/              ← Original documents (immutable)
│   └── ...
├── pages/                ← LLM-generated wiki pages
│   ├── architecture.md
│   └── ...
├── index.md              ← Catalog of all pages (LLM-maintained)
├── log.md                ← Append-only changelog (LLM-maintained)
└── graph.html            ← Generated by wiki-grapher (HTML mode)
```

**`index.md` format:**
```markdown
# Wiki Index

## Architecture
- [[architecture]] — System architecture overview

## Database
- [[database]] — Data layer design
```

**`log.md` format:**
```markdown
## [2026-07-02] init | Created wiki
## [2026-07-02] ingest | Added architecture.md
```

---

## Plugin Manifest

```json
{
  "name": "create-llm-wiki",
  "version": "0.1.0",
  "description": "LLM-maintained knowledge base — init, add content, visualize relationships",
  "author": { "name": "oh-my-powers team" }
}
```

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Plugin name | `create-llm-wiki` |
| Skill naming | `init-wiki`, `add-to-wiki` (self-explanatory) |
| Wiki location | `./llm-wiki/` in project root |
| Add input modes | Both file and Q&A |
| Graph output | HTML (D3.js) and Obsidian [[links]], user chooses |
| Architecture | Skill + Agent + Script (方案 C) |

---

## Next Steps

1. Create plugin directory and files
2. Implement each component
3. Validate with plugin-validator
4. Register in oh-my-powers marketplace.json
5. Test in Claude Code
