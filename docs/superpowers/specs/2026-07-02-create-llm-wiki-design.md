# create-llm-wiki Plugin — Design Spec

**Date:** 2026-07-02
**Status:** Approved
**Marketplace:** oh-my-powers

---

## Overview

`create-llm-wiki` is a Claude Code plugin that enables LLM-maintained, persistent knowledge bases directly inside any project. Inspired by the [LLM Wiki pattern](../../references/llm-wiki.md), it provides five operations: initialize a wiki, add content from files or conversation, search, export, and generate visual relationship graphs.

The wiki lives in the project directory (`./llm-wiki/`) as plain markdown files — no external database, no embedding infrastructure. The LLM handles all the bookkeeping.

---

## Architecture

```
User command → Skill/Agent → reads/writes → ./llm-wiki/
                                   │
                          reads rules from → references/llm-wiki.md
                                   │
                          calls scripts → scripts/graph-viz.js
                                          scripts/wiki-search.js
                                          scripts/wiki-export.js
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
│   ├── add-to-wiki/SKILL.md         ← /create-llm-wiki:add-to-wiki
│   ├── graph-wiki/SKILL.md          ← /create-llm-wiki:graph-wiki [html|obsidian]
│   ├── search-wiki/SKILL.md         ← /create-llm-wiki:search-wiki <query>
│   └── export-wiki/SKILL.md         ← /create-llm-wiki:export-wiki [format] [path]
├── agents/
│   └── wiki-grapher.md              ← wiki-grapher agent (batch import + health check)
├── scripts/
│   ├── graph-viz.js                 ← D3.js HTML renderer
│   ├── wiki-search.js               ← Keyword search with ranking (env: LLM_WIKI_DIR)
│   └── wiki-export.js               ← Export to single markdown or JSON (env: LLM_WIKI_DIR)
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
4. Ensure `./CLAUDE.md` has wiki reference rules (create or append)
5. Output confirmation and usage hints to user

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
8. **Post-add lint** (active orchestration):
   - Orphan check: scan inbound [[links]] for the new page, add if missing
   - Backlink sync: for every [[target]] referenced, ensure return link exists
   - Gap detection: suggest new pages for concepts mentioned but not covered
   - Index validation: ensure categories are still well-balanced

**SKILL.md structure:**
- Frontmatter: `name`, `description` with trigger phrases, `argument-hint: [file-path-or-topic]`
- Body references ingest/query operations from `references/llm-wiki.md`
- Emphasizes checking `index.md` first, no duplicate pages

### 3. `wiki-grapher` Agent

**Trigger:** User says "批量导入" / "健康检查" / "wiki health" / "batch import"

**Required tools:** Read, Write, Edit, Bash, WebSearch

**Behavior:**

**Mode 1: Batch Import**
- Scan multiple files, dedup against existing index, group similar files by topic, compose a single wiki page per group, batch update index.md and log.md.

**Mode 2: Health Check**
- Run checks: orphan pages, dead [[links]], stale pages (>30d no update), index drift, overcrowded categories, gap mentions, contradictions.
- Generate summary report and ask user if they want to auto-fix.

**Graph generation is handled by the `graph-wiki` skill, not the agent.**

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

### 5. `graph-wiki` Skill

**Trigger:** `/create-llm-wiki:graph-wiki [html|obsidian]` or "生成图谱" / "graph the wiki"

**Behavior:**
1. Scan wiki pages for content and `[[wikilinks]]`
2. Build graph data (nodes + edges)
3. Ask user for format (or use argument): HTML → pipe to `scripts/graph-viz.js`; Obsidian → update `[[wikilinks]]` in pages

### 6. `search-wiki` Skill

**Trigger:** `/create-llm-wiki:search-wiki <query>` or "搜索"

**Behavior:**
1. Determine wiki directory (default `./llm-wiki/`)
2. Run `LLM_WIKI_DIR=<dir> scripts/wiki-search.js <query>`
3. Present ranked results with excerpts

### 7. `export-wiki` Skill

**Trigger:** `/create-llm-wiki:export-wiki [format] [output-path]` or "导出"

**Behavior:**
1. Determine wiki directory
2. Run `LLM_WIKI_DIR=<dir> scripts/wiki-export.js <format> <output-path>`
3. Confirm exported file with size

### 8. `wiki-search.js` Script

**Type:** Node.js, no deps
**Input:** Query string via argv
**Output:** JSON `[{ file, title, score, excerpt }]` via stdout
**Feature:** Keyword frequency scoring, title/heading bonus, excerpt extraction. Accepts `LLM_WIKI_DIR` env var.

### 9. `wiki-export.js` Script

**Type:** Node.js, no deps
**Input:** Format (`markdown` / `json`) + optional output path via argv
**Output:** Single merged file. Accepts `LLM_WIKI_DIR` env var.

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
| Skill naming | `init-wiki`, `add-to-wiki`, `graph-wiki`, `search-wiki`, `export-wiki` |
| Wiki location | `./llm-wiki/` in project root (overridable via `LLM_WIKI_DIR`) |
| Add input modes | Both file and Q&A |
| Add post-add lint | Orphan check, backlink sync, gap detection, index validation |
| Graph output | Skill `/create-llm-wiki:graph-wiki` (not agent) |
| Search & Export | Skills + Node.js scripts with `LLM_WIKI_DIR` env var |
| Batch & Health Check | wiki-grapher agent, conversation-triggered |
| Architecture | Skill + Agent + Script (方案 C) |

---

## Next Steps

1. Create plugin directory and files ✅
2. Implement each component ✅
3. Validate with plugin-validator ✅
4. Register in oh-my-powers marketplace.json ✅
5. Test in Claude Code 🔲
