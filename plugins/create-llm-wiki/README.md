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
