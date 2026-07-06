#!/usr/bin/env node
// wiki-search.js — Search LLM wiki pages with keyword ranking
// Usage: node scripts/wiki-search.js <query>
// Env: LLM_WIKI_DIR — wiki directory path (default: ./llm-wiki)
// Output: ranked results with excerpts to stdout

const fs = require("fs");
const path = require("path");

const WIKI_DIR = path.resolve(process.cwd(), process.env.LLM_WIKI_DIR || "llm-wiki");
const PAGES_DIR = path.join(WIKI_DIR, "pages");

function main() {
  const query = process.argv.slice(2).join(" ");
  if (!query) {
    console.error("Usage: node scripts/wiki-search.js <query>");
    process.exit(1);
  }

  if (!fs.existsSync(PAGES_DIR)) {
    console.log("[]");
    return;
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".md"));

  const results = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(PAGES_DIR, file), "utf-8");
    const lower = content.toLowerCase();
    let score = 0;

    // Count term frequency
    for (const term of terms) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = content.match(regex);
      if (matches) score += matches.length * 2;
      // Bonus for title match
      if (file.toLowerCase().includes(term)) score += 5;
      // Bonus for heading match
      const headings = content.match(/^#{1,3}\s+.*$/gm) || [];
      for (const h of headings) {
        if (h.toLowerCase().includes(term)) score += 3;
      }
    }

    if (score > 0) {
      // Extract excerpt around first match
      let excerpt = "";
      const matchIdx = lower.search(new RegExp(terms.join("|"), "i"));
      if (matchIdx >= 0) {
        const start = Math.max(0, matchIdx - 60);
        const end = Math.min(content.length, matchIdx + 140);
        excerpt = (start > 0 ? "…" : "") + content.slice(start, end).replace(/\n/g, " ") + (end < content.length ? "…" : "");
      }

      // Get title from first h1 or filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, "");

      results.push({ file, title, score, excerpt });
    }
  }

  results.sort((a, b) => b.score - a.score);
  console.log(JSON.stringify(results.slice(0, 15), null, 2));
}

main();
