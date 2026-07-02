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
