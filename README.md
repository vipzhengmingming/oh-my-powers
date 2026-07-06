# oh-my-powers 🚀

非常实用的 Claude Code plugin-marketplace — 社区驱动的插件市场，人人都有超能力。

A community-driven **Claude Code plugin marketplace** — superpowers for everyone.

## Quick Start

```bash
# Add this marketplace
/plugin marketplace add vipzhengmingming/oh-my-powers

# Install a plugin
/plugin install create-llm-wiki@oh-my-powers
```

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [create-llm-wiki](./plugins/create-llm-wiki) | LLM-maintained knowledge base — init, add content, visualize relationships |

## Creating a Plugin

```bash
git clone https://github.com/vipzhengmingming/oh-my-powers
cd oh-my-powers

# Use plugin-dev to scaffold a new plugin
cc --plugin-dir ./plugins/your-plugin
```

Then add it to [.claude-plugin/marketplace.json](./.claude-plugin/marketplace.json) and open a PR!

## Contributing

1. Fork the repo
2. Add your plugin under `plugins/` with a proper `.claude-plugin/plugin.json`
3. Register it in `.claude-plugin/marketplace.json`
4. Open a Pull Request

Your plugin must pass validation:
```bash
claude plugin validate ./plugins/your-plugin
```

## License

MIT
