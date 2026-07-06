---
description: >-
  Search the project's LLM wiki for relevant pages. Use when the user says
  "search wiki", "查找", "搜索", "找一下", or runs
  /create-llm-wiki:search-wiki <query>.
name: search-wiki
argument-hint: <query>
---

# Search Wiki

Search the project's LLM wiki for relevant pages with ranked results.

## Steps

1. Determine the wiki directory. Check if `./llm-wiki/pages/` exists. If not, ask the user where the wiki is. Use that path for `LLM_WIKI_DIR`.

2. Run the search script with the wiki directory:
   ```
   LLM_WIKI_DIR=<wiki-dir> ${CLAUDE_PLUGIN_ROOT}/scripts/wiki-search.js <query>
   ```
   - Replace `<query>` with the user's search terms
   - Replace `<wiki-dir>` with the wiki path (e.g. `llm-wiki` or a custom path)
   - The script returns JSON with `[{ file, title, score, excerpt }]`

3. Read the results. If results found, present them as a ranked list:
   - Show title, relevance score, and excerpt for each result
   - Offer to read the full page content

3. If no results found, suggest the user:
   - Try different search terms
   - Or add content with `/create-llm-wiki:add-to-wiki`

4. If the user picks a result, read `<wiki-dir>/pages/<file>` and answer their question based on it.

## Example

User: "搜索一下数据库设计"
You: Check wiki dir → `llm-wiki`. Run `LLM_WIKI_DIR=llm-wiki node ${CLAUDE_PLUGIN_ROOT}/scripts/wiki-search.js 数据库设计`
→ Show results, ask if they want to drill in.
